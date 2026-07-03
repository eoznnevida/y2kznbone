const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Para ler os dados do formulário do painel

// ----------------------------------------------------
// CONEXÃO COM O BANCO DE DADOS (MongoDB)
// ----------------------------------------------------
// Substitua a string abaixo pela sua URL do MongoDB Atlas ou use uma variável de ambiente no Render
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://USUARIO:SENHA@cluster.mongodb.net/stumble_tournaments?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)
  .then(() => console.log("Conectado com sucesso ao MongoDB!"))
  .catch(err => console.error("Erro ao conectar ao MongoDB:", err));

// ----------------------------------------------------
// MODELO DE DADOS DO TORNEIO
// ----------------------------------------------------
const TournamentSchema = new mongoose.Schema({
  title: String,
  region: String,
  image_url: String,
  map: String,
  allowed_emotes: [String],
  registration_start: String,
  tournament_start: String,
  rewards: [{ rank: String, gems: Number }]
});

const Tournament = mongoose.model('Tournament', TournamentSchema);

// ----------------------------------------------------
// INICIALIZAÇÃO DE DADOS PADRÃO (Caso o banco esteja vazio)
// ----------------------------------------------------
async function initDefaultTournament() {
  const count = await Tournament.countDocuments();
  if (count === 0) {
    await Tournament.create({
      title: "y2kzn tour 1v1 bd only punch",
      region: "sa",
      image_url: "https://cdn.discordapp.com/attachments/1522374892690079767/1522403393161920643/Zn_1v1.png",
      map: "level19_block",
      allowed_emotes: ["punch"],
      registration_start: "2026-07-02T22:00",
      tournament_start: "2026-07-02T23:00",
      rewards: [
        { rank: "16-9", gems: 100 },
        { rank: "8-5", gems: 200 },
        { rank: "4-3", gems: 500 },
        { rank: "2", gems: 1000 },
        { rank: "1", gems: 10000 }
      ]
    });
    console.log("Torneio padrão criado no banco de dados.");
  }
}
initDefaultTournament();

// ----------------------------------------------------
// ROTAS DA API PARA O JOGO
// ----------------------------------------------------

// GET: O jogo busca as informações atualizadas por aqui
app.get('/api/tournaments', async (req, res) => {
  try {
    const tournaments = await Tournament.find();
    res.json(tournaments);
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar torneios" });
  }
});

// ----------------------------------------------------
// PAINEL DE ADMINISTRAÇÃO VISUAL (Front-end integrado)
// ----------------------------------------------------

// Rota principal: Renderiza o painel para você configurar o torneio pelo navegador
app.get('/', async (req, res) => {
  const t = await Tournament.findOne() || {};
  
  // Mapeia os prêmios de volta para o formato de texto do formulário
  const rewardsText = t.rewards ? t.rewards.map(r => `${r.rank}=${r.gems}`).join('\n') : '';

  // Template HTML direto no backend para facilidade de deploy único
  const html = `
  <!DOCTYPE html>
  <html lang="pt-BR">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Painel de Controle - y2kznbone</title>
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #121214; color: #e1e1e6; margin: 0; padding: 20px; display: flex; justify-content: center; }
      .container { width: 100%; max-width: 600px; background: #202024; padding: 30px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); }
      h1 { color: #00b37e; text-align: center; margin-bottom: 20px; font-size: 24px; }
      label { display: block; margin-top: 15px; margin-bottom: 5px; font-weight: bold; font-size: 14px; }
      input, select, textarea { width: 100%; padding: 10px; background: #121214; border: 1px solid #29292e; border-radius: 4px; color: #fff; box-sizing: border-box; font-size: 14px; }
      input:focus, select:focus, textarea:focus { border-color: #00b37e; outline: none; }
      textarea { resize: vertical; height: 100px; }
      button { width: 100%; padding: 12px; background: #00b37e; border: none; border-radius: 4px; color: white; font-size: 16px; font-weight: bold; cursor: pointer; margin-top: 25px; transition: background 0.2s; }
      button:hover { background: #00875f; }
      .preview-box { margin-top: 20px; text-align: center; border-top: 1px solid #29292e; padding-top: 15px; }
      .preview-img { max-width: 150px; border-radius: 8px; margin-top: 10px; border: 2px solid #00b37e; }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Painel de Torneios Clássicos</h1>
      <form action="/admin/update" method="POST">
        
        <label>Título do Torneio:</label>
        <input type="text" name="title" value="${t.title || ''}" required>

        <label>Região:</label>
        <select name="region">
          <option value="sa" ${t.region === 'sa' ? 'selected' : ''}>South America (SA)</option>
          <option value="na" ${t.region === 'na' ? 'selected' : ''}>North America (NA)</option>
          <option value="eu" ${t.region === 'eu' ? 'selected' : ''}>Europe (EU)</option>
        </select>

        <label>ID Interno do Mapa:</label>
        <input type="text" name="map" value="${t.map || ''}" required>

        <label>Link da Imagem (URL):</label>
        <input type="text" name="image_url" value="${t.image_url || ''}" required>

        <label>Emotes Permitidos (separados por vírgula):</label>
        <input type="text" name="allowed_emotes" value="${t.allowed_emotes ? t.allowed_emotes.join(', ') : ''}">

        <label>Início das Inscrições:</label>
        <input type="datetime-local" name="registration_start" value="${t.registration_start || ''}">

        <label>Início do Torneio:</label>
        <input type="datetime-local" name="tournament_start" value="${t.tournament_start || ''}">

        <label>Distribuição de Gemas (Formato: posições=gemas | Linha por Linha):</label>
        <textarea name="rewards" placeholder="16-9=100&#10;8-5=200&#10;4-3=500&#10;2=1000&#10;1=10000">${rewardsText}</textarea>

        <button type="submit">Salvar Alterações e Atualizar Jogo</button>
      </form>

      ${t.image_url ? `
        <div class="preview-box">
          <p style="font-size: 12px; color: #8d8d99;">Imagem atual no jogo:</p>
          <img src="${t.image_url}" class="preview-img" alt="Preview">
        </div>
      ` : ''}
    </div>
  </body>
  </html>
  `;
  res.send(html);
});

// POST do formulário do Painel: Processa e salva direto no Banco de Dados
app.post('/admin/update', async (req, res) => {
  try {
    const { title, region, map, image_url, allowed_emotes, registration_start, tournament_start, rewards } = req.body;

    // Processa a string de emotes de volta para Array
    const emotesArray = allowed_emotes ? allowed_emotes.split(',').map(e => e.trim()) : [];

    // Processa a caixa de texto de prêmios de volta para a estrutura de objetos
    const rewardsArray = [];
    if (rewards) {
      const lines = rewards.split('\n');
      lines.forEach(line => {
        const [rank, gems] = line.split('=');
        if (rank && gems) {
          rewardsArray.push({ rank: rank.trim(), gems: parseInt(gems.trim(), 10) });
        }
      });
    }

    // Busca o primeiro registro ou cria um novo para manter apenas 1 torneio ativo globalmente
    let currentTournament = await Tournament.findOne();
    if (!currentTournament) currentTournament = new Tournament();

    currentTournament.title = title;
    currentTournament.region = region;
    currentTournament.map = map;
    currentTournament.image_url = image_url;
    currentTournament.allowed_emotes = emotesArray;
    currentTournament.registration_start = registration_start;
    currentTournament.tournament_start = tournament_start;
    currentTournament.rewards = rewardsArray;

    await currentTournament.save();

    // Redireciona de volta para a página inicial com as informações atualizadas
    res.send('<script>alert("Torneio atualizado e sincronizado com o banco de dados com sucesso!"); window.location.href="/";</script>');
  } catch (err) {
    res.status(500).send("Erro ao salvar as configurações: " + err.message);
  }
});

app.listen(PORT, () => {
  console.log(`Painel Administrativo e API rodando na porta ${PORT}`);
});
