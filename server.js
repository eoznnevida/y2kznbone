const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Memória volátil para a configuração do torneio (pode ser alterada via POST)
let tournamentConfig = {
  id: "y2kzn_tour_1v1",
  title: "y2kzn tour 1v1 bd only punch",
  region: "sa",
  image_url: "https://cdn.discordapp.com/attachments/1522374892690079767/1522403393161920643/Zn_1v1.png?ex=6a485825&is=6a4706a5&hm=172ff32a4936c77cfa6ad386fa938bb72cc3f948b71c0e6ef4cb25adba2380eb",
  map: "level19_block", // Block Dash
  allowed_emotes: ["punch"],
  registration_start: "2026-07-02T22:00:00-03:00", // Horário de Brasília
  tournament_start: "2026-07-02T23:00:00-03:00",
  phases: [
    {
      type: "bracket",
      style: "single_elimination"
    }
  ],
  rewards: [
    { rank: "16-9", gems: 100 },
    { rank: "8-5", gems: 200 },
    { rank: "4-3", gems: 500 },
    { rank: "2", gems: 1000 },
    { rank: "1", gems: 10000 }
  ],
  status: "open_registration" // Controle automático baseado no tempo ou manual
};

// 1. Rota que o jogo vai consumir para listar o torneio atualizado
app.get('/api/tournaments', (req, res) => {
  res.json([tournamentConfig]);
});

// 2. Rota de administração para alterar o torneio no Render sem mexer no GitHub
app.post('/api/tournament/config', (req, res) => {
  const { title, region, map, image_url, rewards, allowed_emotes, tournament_start, registration_start } = req.body;

  if (title) tournamentConfig.title = title;
  if (region) tournamentConfig.region = region;
  if (map) tournamentConfig.map = map;
  if (image_url) tournamentConfig.image_url = image_url;
  if (rewards) tournamentConfig.rewards = rewards;
  if (allowed_emotes) tournamentConfig.allowed_emotes = allowed_emotes;
  if (tournament_start) tournamentConfig.tournament_start = tournament_start;
  if (registration_start) tournamentConfig.registration_start = registration_start;

  return res.status(200).json({
    message: "Configuração do torneio atualizada com sucesso no Render!",
    current_config: tournamentConfig
  });
});

// 3. Estrutura básica para simular o resultado das fases até o último vencedor
app.post('/api/tournament/match-result', (req, res) => {
  const { matchId, winnerId, currentRound } = req.body;
  
  // Lógica interna para avançar a chave de brackets até restar 1 vencedor
  res.json({
    message: `Partida registrada. Vencedor ${winnerId} avançou.`,
    next_round: currentRound + 1
  });
});

app.listen(PORT, () => {
  console.log(`y2kznbone rodando com sucesso na porta ${PORT}`);
});
