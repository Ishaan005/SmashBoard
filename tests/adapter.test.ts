import { DBAdapter } from '../db/adapter';
import { DatabaseManager } from '../db/database';
import Database from 'better-sqlite3';

// Mock the database to use in-memory database for testing
jest.mock('../db/database', () => {
  return {
    DatabaseManager: {
      getInstance: jest.fn(() => ({
        getDatabase: () => new (require('better-sqlite3'))(':memory:')
      }))
    }
  };
});

describe('DBAdapter', () => {
  let adapter: DBAdapter;
  let mockDb: any;

  beforeEach(() => {
    // Create a new in-memory database for each test
    mockDb = new (require('better-sqlite3'))(':memory:');
    
    // Mock the DatabaseManager to return our test database
    (DatabaseManager.getInstance as jest.Mock).mockReturnValue({
      getDatabase: () => mockDb
    });
    
    // Manually initialize tables
    mockDb.exec(`
      CREATE TABLE IF NOT EXISTS players (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        tag TEXT UNIQUE,
        main_character TEXT,
        secondary_character TEXT,
        rating INTEGER DEFAULT 1200,
        level INTEGER DEFAULT 1,
        wins INTEGER DEFAULT 0,
        losses INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    mockDb.exec(`
      CREATE TABLE IF NOT EXISTS matches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        playerA_id INTEGER NOT NULL,
        playerB_id INTEGER NOT NULL,
        scoreA INTEGER NOT NULL,
        scoreB INTEGER NOT NULL,
        winner_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (playerA_id) REFERENCES players (id),
        FOREIGN KEY (playerB_id) REFERENCES players (id),
        FOREIGN KEY (winner_id) REFERENCES players (id)
      )
    `);

    // Create adapter after tables are initialized
    adapter = new DBAdapter();
  });

  afterEach(() => {
    // Clean up after each test
    mockDb.close();
  });

  describe('Player operations', () => {
    it('should add a new player', () => {
      const player = adapter.addPlayer('Test Player', 'TP', 'Fox');
      
      expect(player.name).toBe('Test Player');
      expect(player.tag).toBe('TP');
      expect(player.mainCharacter).toBe('Fox');
      expect(player.rating).toBe(1200);
      expect(player.level).toBe(1);
      expect(player.wins).toBe(0);
      expect(player.losses).toBe(0);
      expect(player.id).toBeDefined();
    });

    it('should get all players', () => {
      adapter.addPlayer('Player 1', 'P1', 'Fox');
      adapter.addPlayer('Player 2', 'P2', 'Falco');
      
      const players = adapter.getPlayers();
      expect(players).toHaveLength(2);
      expect(players[0].name).toBe('Player 1');
      expect(players[1].name).toBe('Player 2');
    });

    it('should get player by ID', () => {
      const addedPlayer = adapter.addPlayer('Test Player', 'TP', 'Fox');
      const foundPlayer = adapter.getPlayerById(addedPlayer.id!);
      
      expect(foundPlayer).not.toBeNull();
      expect(foundPlayer?.name).toBe('Test Player');
    });

    it('should get player by name', () => {
      adapter.addPlayer('Test Player', 'TP', 'Fox');
      const foundPlayer = adapter.getPlayerByName('Test Player');
      
      expect(foundPlayer).not.toBeNull();
      expect(foundPlayer?.tag).toBe('TP');
    });

    it('should update player rating', () => {
      const player = adapter.addPlayer('Test Player', 'TP', 'Fox');
      adapter.updateRating(player.id!, 1300, 5, 2);
      
      const updatedPlayer = adapter.getPlayerById(player.id!);
      expect(updatedPlayer?.rating).toBe(1300);
      expect(updatedPlayer?.wins).toBe(5);
      expect(updatedPlayer?.losses).toBe(2);
      expect(updatedPlayer?.level).toBeGreaterThan(1);
    });
  });

  describe('Match operations', () => {
    let player1: any;
    let player2: any;

    beforeEach(() => {
      player1 = adapter.addPlayer('Player 1', 'P1', 'Fox');
      player2 = adapter.addPlayer('Player 2', 'P2', 'Falco');
    });

    it('should record a match', () => {
      const match = adapter.recordMatch(player1.id!, player2.id!, 3, 1);
      
      expect(match.playerA_id).toBe(player1.id);
      expect(match.playerB_id).toBe(player2.id);
      expect(match.scoreA).toBe(3);
      expect(match.scoreB).toBe(1);
      expect(match.winner_id).toBe(player1.id);
    });

    it('should update player ratings after a match', () => {
      adapter.recordMatch(player1.id!, player2.id!, 3, 1);
      
      const updatedPlayer1 = adapter.getPlayerById(player1.id!);
      const updatedPlayer2 = adapter.getPlayerById(player2.id!);
      
      expect(updatedPlayer1?.wins).toBe(1);
      expect(updatedPlayer1?.losses).toBe(0);
      expect(updatedPlayer2?.wins).toBe(0);
      expect(updatedPlayer2?.losses).toBe(1);
      
      // Winner should gain rating, loser should lose rating
      expect(updatedPlayer1?.rating).toBeGreaterThan(1200);
      expect(updatedPlayer2?.rating).toBeLessThan(1200);
    });

    it('should get all matches', () => {
      adapter.recordMatch(player1.id!, player2.id!, 3, 1);
      adapter.recordMatch(player2.id!, player1.id!, 2, 3);
      
      const matches = adapter.getAllMatches();
      expect(matches).toHaveLength(2);
    });
  });

  describe('Leaderboard', () => {
    it('should return players ordered by rating', () => {
      const player1 = adapter.addPlayer('Low Player', 'LP', 'Fox');
      const player2 = adapter.addPlayer('High Player', 'HP', 'Falco');
      
      // Give player2 a higher rating
      adapter.updateRating(player2.id!, 1400, 10, 2);
      
      const leaderboard = adapter.getLeaderboard();
      expect(leaderboard[0].name).toBe('High Player');
      expect(leaderboard[1].name).toBe('Low Player');
    });
  });

  describe('Player statistics', () => {
    it('should calculate player stats correctly', () => {
      const player1 = adapter.addPlayer('Player 1', 'P1', 'Fox');
      const player2 = adapter.addPlayer('Player 2', 'P2', 'Falco');
      
      // Player 1 wins 2 matches, loses 1
      adapter.recordMatch(player1.id!, player2.id!, 3, 1);
      adapter.recordMatch(player1.id!, player2.id!, 3, 2);
      adapter.recordMatch(player2.id!, player1.id!, 3, 1);
      
      const stats = adapter.getPlayerStats(player1.id!);
      expect(stats.totalMatches).toBe(3);
      expect(stats.wins).toBe(2);
      expect(stats.losses).toBe(1);
      expect(stats.winRate).toBeCloseTo(66.67, 1);
    });
  });
});