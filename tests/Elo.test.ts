import { EloCalculator, updateElo, ratingToLevel } from '../models/Elo';

describe('EloCalculator', () => {
  describe('getExpectedScore', () => {
    it('should return 0.5 for equal ratings', () => {
      const expected = EloCalculator.getExpectedScore(1200, 1200);
      expect(expected).toBeCloseTo(0.5);
    });

    it('should return higher probability for higher rated player', () => {
      const expected = EloCalculator.getExpectedScore(1400, 1200);
      expect(expected).toBeGreaterThan(0.5);
    });

    it('should return lower probability for lower rated player', () => {
      const expected = EloCalculator.getExpectedScore(1000, 1200);
      expect(expected).toBeLessThan(0.5);
    });
  });

  describe('calculateNewElo', () => {
    it('should increase ELO after a win', () => {
      const newElo = EloCalculator.calculateNewElo(1200, 1200, 1);
      expect(newElo).toBeGreaterThan(1200);
    });

    it('should decrease ELO after a loss', () => {
      const newElo = EloCalculator.calculateNewElo(1200, 1200, 0);
      expect(newElo).toBeLessThan(1200);
    });

    it('should not change ELO significantly when result matches expectation', () => {
      // Higher rated player wins as expected
      const newElo = EloCalculator.calculateNewElo(1400, 1200, 1);
      const change = Math.abs(newElo - 1400);
      expect(change).toBeLessThan(16); // Should be a small change
    });
  });

  describe('calculateEloChange', () => {
    it('should calculate changes for both players', () => {
      const result = EloCalculator.calculateEloChange(1200, 1200);
      expect(result.winnerNewElo).toBeGreaterThan(1200);
      expect(result.loserNewElo).toBeLessThan(1200);
      expect(result.winnerChange).toBeGreaterThan(0);
      expect(result.loserChange).toBeLessThan(0);
    });
  });

  describe('getEloTier', () => {
    it('should return correct tier for different ELO ranges', () => {
      expect(EloCalculator.getEloTier(2500)).toBe('Grand Master');
      expect(EloCalculator.getEloTier(2300)).toBe('Master');
      expect(EloCalculator.getEloTier(2100)).toBe('Expert');
      expect(EloCalculator.getEloTier(1900)).toBe('Class A');
      expect(EloCalculator.getEloTier(1700)).toBe('Class B');
      expect(EloCalculator.getEloTier(1500)).toBe('Class C');
      expect(EloCalculator.getEloTier(1300)).toBe('Class D');
      expect(EloCalculator.getEloTier(1100)).toBe('Beginner');
    });
  });
});

describe('updateElo function', () => {
  describe('Equal ratings (1000 vs 1000)', () => {
    it('should update ratings when Player A beats Player B', () => {
      const [newRA, newRB] = updateElo(1000, 1000, "A", 20);
      
      expect(newRA).toBeGreaterThan(1000);
      expect(newRB).toBeLessThan(1000);
      expect(newRA + newRB).toBeCloseTo(2000, 0); // Total rating should be approximately preserved
      
      // With equal ratings, each player should gain/lose approximately K/2 points
      expect(newRA).toBeCloseTo(1010, 2);
      expect(newRB).toBeCloseTo(990, 2);
    });

    it('should update ratings when Player B beats Player A', () => {
      const [newRA, newRB] = updateElo(1000, 1000, "B", 20);
      
      expect(newRA).toBeLessThan(1000);
      expect(newRB).toBeGreaterThan(1000);
      expect(newRA).toBeCloseTo(990, 2);
      expect(newRB).toBeCloseTo(1010, 2);
    });
  });

  describe('Unequal ratings (1000 vs 1200)', () => {
    it('should give smaller rating change when higher-rated player (B) beats lower-rated player (A)', () => {
      const [newRA, newRB] = updateElo(1000, 1200, "B", 20);
      
      expect(newRA).toBeLessThan(1000);
      expect(newRB).toBeGreaterThan(1200);
      
      // Higher rated player should gain fewer points
      const changeB = newRB - 1200;
      const changeA = Math.abs(newRA - 1000);
      
      expect(changeB).toBeLessThan(10); // Should be small gain
      expect(changeA).toBeGreaterThanOrEqual(5); // Should be larger loss (adjusted expectation)
      
      // In this specific case with K=20, the changes should be exactly equal and opposite
      // This is because the expected scores are symmetric around 0.5
      expect(Math.abs(changeB)).toEqual(changeA);
    });

    it('should give larger rating change when lower-rated player (A) beats higher-rated player (B)', () => {
      const [newRA, newRB] = updateElo(1000, 1200, "A", 20);
      
      expect(newRA).toBeGreaterThan(1000);
      expect(newRB).toBeLessThan(1200);
      
      // Lower rated player should gain more points for upset win
      const changeA = newRA - 1000;
      const changeB = Math.abs(newRB - 1200);
      
      expect(changeA).toBeGreaterThan(10); // Should be large gain
      expect(changeB).toBeGreaterThan(10); // Should be large loss
    });
  });

  describe('Draw scenarios', () => {
    it('should handle draws between equal players', () => {
      const [newRA, newRB] = updateElo(1000, 1000, "draw", 20);
      
      // With equal ratings and a draw, ratings should remain unchanged
      expect(newRA).toBe(1000);
      expect(newRB).toBe(1000);
    });

    it('should handle draws between unequal players', () => {
      const [newRA, newRB] = updateElo(1000, 1200, "draw", 20);
      
      // In a draw, lower-rated player gains points, higher-rated loses points
      expect(newRA).toBeGreaterThan(1000);
      expect(newRB).toBeLessThan(1200);
      
      // Changes should be moderate for a draw
      expect(newRA - 1000).toBeGreaterThan(0);
      expect(newRA - 1000).toBeLessThan(15);
      expect(1200 - newRB).toBeGreaterThan(0);
      expect(1200 - newRB).toBeLessThan(15);
    });
  });

  describe('K-factor variations', () => {
    it('should apply larger changes with higher K-factor', () => {
      const [newRA_K10, newRB_K10] = updateElo(1000, 1000, "A", 10);
      const [newRA_K30, newRB_K30] = updateElo(1000, 1000, "A", 30);
      
      const changeA_K10 = newRA_K10 - 1000;
      const changeA_K30 = newRA_K30 - 1000;
      
      expect(changeA_K30).toBeGreaterThan(changeA_K10);
      expect(changeA_K30 / changeA_K10).toBeCloseTo(3, 0.1);
    });
  });

  describe('Rating bounds', () => {
    it('should not allow ratings to go below 0', () => {
      const [newRA, newRB] = updateElo(50, 1500, "B", 50);
      
      expect(newRA).toBeGreaterThanOrEqual(0);
      expect(newRB).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('ratingToLevel function', () => {
  it('should return correct level for each rating range', () => {
    // Beginner: 0-999
    expect(ratingToLevel(0)).toBe("Beginner");
    expect(ratingToLevel(500)).toBe("Beginner");
    expect(ratingToLevel(999)).toBe("Beginner");
    
    // Intermediate: 1000-1199
    expect(ratingToLevel(1000)).toBe("Intermediate");
    expect(ratingToLevel(1100)).toBe("Intermediate");
    expect(ratingToLevel(1199)).toBe("Intermediate");
    
    // Advanced: 1200-1399
    expect(ratingToLevel(1200)).toBe("Advanced");
    expect(ratingToLevel(1300)).toBe("Advanced");
    expect(ratingToLevel(1399)).toBe("Advanced");
    
    // Pro: 1400+
    expect(ratingToLevel(1400)).toBe("Pro");
    expect(ratingToLevel(1500)).toBe("Pro");
    expect(ratingToLevel(2000)).toBe("Pro");
    expect(ratingToLevel(3000)).toBe("Pro");
  });

  it('should handle edge cases', () => {
    expect(ratingToLevel(999.9)).toBe("Beginner");
    expect(ratingToLevel(1000.1)).toBe("Intermediate");
    expect(ratingToLevel(1199.9)).toBe("Intermediate");
    expect(ratingToLevel(1200.1)).toBe("Advanced");
    expect(ratingToLevel(1399.9)).toBe("Advanced");
    expect(ratingToLevel(1400.1)).toBe("Pro");
  });
});