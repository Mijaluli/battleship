const MAX_GAMES = 1000;
const games = new Map();

function addGame(id, game) {
  if (games.size >= MAX_GAMES) {
    games.delete(games.keys().next().value);
  }
  games.set(id, game);
}

module.exports = { games, addGame };
