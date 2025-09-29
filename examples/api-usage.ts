// Example usage of the new SmashBoard Electron API
// This demonstrates how to use the organized database functions

// Using the new organized db namespace:

// Add a new player
await window.electronAPI.db.addPlayer('John Doe', 'JD', 'Mario', 'Luigi');

// Get all players
const players = await window.electronAPI.db.getPlayers();

// Record a match (Player A ID: 1, Player B ID: 2, Score: 3-1)
await window.electronAPI.db.recordMatch(1, 2, 3, 1);

// Get leaderboard
const leaderboard = await window.electronAPI.db.getLeaderboard();

// Get all matches
const matches = await window.electronAPI.db.getMatches();

// Get player stats
const stats = await window.electronAPI.db.getPlayerStats(1);

// ============================================
// Legacy API (still works for backward compatibility):

// Add player (old way)
await window.electronAPI.addPlayer({
  name: 'Jane Doe',
  tag: 'JaneDoe',
  mainCharacter: 'Peach'
});

// Get players (old way)
const allPlayers = await window.electronAPI.getPlayers();

// Record match (old way)
await window.electronAPI.addMatch({
  playerA_id: 1,
  playerB_id: 2,
  scoreA: 2,
  scoreB: 1
});

export {};