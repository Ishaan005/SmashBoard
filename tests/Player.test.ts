import { PlayerModel } from '../models/Player';

describe('PlayerModel', () => {
  let player: PlayerModel;

  beforeEach(() => {
    player = new PlayerModel(
      'John Doe',
      'JD',
      'Fox',
      'Falco',
      1200,
      10,
      5
    );
  });

  describe('constructor', () => {
    it('should create a player with correct properties', () => {
      expect(player.name).toBe('John Doe');
      expect(player.tag).toBe('JD');
      expect(player.mainCharacter).toBe('Fox');
      expect(player.secondaryCharacter).toBe('Falco');
      expect(player.elo).toBe(1200);
      expect(player.wins).toBe(10);
      expect(player.losses).toBe(5);
    });
  });

  describe('winRate', () => {
    it('should calculate win rate correctly', () => {
      expect(player.winRate).toBeCloseTo(66.67, 1);
    });

    it('should return 0 for player with no games', () => {
      const newPlayer = new PlayerModel('New Player', 'NP', 'Mario');
      expect(newPlayer.winRate).toBe(0);
    });
  });

  describe('totalGames', () => {
    it('should return sum of wins and losses', () => {
      expect(player.totalGames).toBe(15);
    });
  });

  describe('updateElo', () => {
    it('should update ELO and timestamp', () => {
      const originalTime = player.updatedAt;
      player.updateElo(1250);
      
      expect(player.elo).toBe(1250);
      expect(player.updatedAt).not.toBe(originalTime);
    });
  });

  describe('recordWin', () => {
    it('should increment wins', () => {
      const originalWins = player.wins;
      player.recordWin();
      
      expect(player.wins).toBe(originalWins + 1);
    });
  });

  describe('recordLoss', () => {
    it('should increment losses', () => {
      const originalLosses = player.losses;
      player.recordLoss();
      
      expect(player.losses).toBe(originalLosses + 1);
    });
  });

  describe('toJSON', () => {
    it('should return a plain object representation', () => {
      const json = player.toJSON();
      
      expect(json.name).toBe(player.name);
      expect(json.tag).toBe(player.tag);
      expect(json.mainCharacter).toBe(player.mainCharacter);
      expect(json.elo).toBe(player.elo);
    });
  });
});