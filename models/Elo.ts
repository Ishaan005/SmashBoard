export class EloCalculator {
  private static readonly K_FACTOR = 32;
  private static readonly DEFAULT_ELO = 1200;

  /**
   * Calculate expected score for a player
   */
  static getExpectedScore(playerElo: number, opponentElo: number): number {
    return 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
  }

  /**
   * Calculate new ELO rating after a match
   */
  static calculateNewElo(
    currentElo: number,
    opponentElo: number,
    actualScore: number,
    kFactor: number = EloCalculator.K_FACTOR
  ): number {
    const expectedScore = EloCalculator.getExpectedScore(currentElo, opponentElo);
    const newElo = currentElo + kFactor * (actualScore - expectedScore);
    
    // Ensure ELO doesn't go below 0
    return Math.max(0, Math.round(newElo));
  }

  /**
   * Calculate ELO changes for both players after a match
   */
  static calculateEloChange(
    winnerElo: number,
    loserElo: number,
    kFactor: number = EloCalculator.K_FACTOR
  ): { winnerNewElo: number; loserNewElo: number; winnerChange: number; loserChange: number } {
    const winnerNewElo = EloCalculator.calculateNewElo(winnerElo, loserElo, 1, kFactor);
    const loserNewElo = EloCalculator.calculateNewElo(loserElo, winnerElo, 0, kFactor);

    return {
      winnerNewElo,
      loserNewElo,
      winnerChange: winnerNewElo - winnerElo,
      loserChange: loserNewElo - loserElo,
    };
  }

  /**
   * Get K-factor based on player's current ELO and game count
   */
  static getKFactor(elo: number, gameCount: number): number {
    // Higher K-factor for new players
    if (gameCount < 30) return 40;
    
    // Lower K-factor for high-rated players
    if (elo >= 2400) return 16;
    
    // Standard K-factor
    return 32;
  }

  /**
   * Calculate win probability
   */
  static getWinProbability(playerElo: number, opponentElo: number): number {
    return EloCalculator.getExpectedScore(playerElo, opponentElo);
  }

  /**
   * Get ELO tier/rank name
   */
  static getEloTier(elo: number): string {
    if (elo >= 2400) return 'Grand Master';
    if (elo >= 2200) return 'Master';
    if (elo >= 2000) return 'Expert';
    if (elo >= 1800) return 'Class A';
    if (elo >= 1600) return 'Class B';
    if (elo >= 1400) return 'Class C';
    if (elo >= 1200) return 'Class D';
    return 'Beginner';
  }
}

/**
 * Update ELO ratings for both players based on match result
 * @param rA - Player A's current rating
 * @param rB - Player B's current rating
 * @param result - Match result: "A" (A wins), "B" (B wins), or "draw"
 * @param K - K-factor (default 20)
 * @returns [newRA, newRB] - Updated ratings for both players
 */
export function updateElo(
  rA: number, 
  rB: number, 
  result: "A" | "B" | "draw", 
  K: number = 20
): [number, number] {
  // Calculate expected scores
  const expectedA = 1 / (1 + Math.pow(10, (rB - rA) / 400));
  const expectedB = 1 / (1 + Math.pow(10, (rA - rB) / 400));

  // Determine actual scores based on result
  let actualA: number;
  let actualB: number;

  switch (result) {
    case "A":
      actualA = 1;
      actualB = 0;
      break;
    case "B":
      actualA = 0;
      actualB = 1;
      break;
    case "draw":
      actualA = 0.5;
      actualB = 0.5;
      break;
  }

  // Calculate new ratings
  const newRA = Math.round(rA + K * (actualA - expectedA));
  const newRB = Math.round(rB + K * (actualB - expectedB));

  // Ensure ratings don't go below 0
  return [Math.max(0, newRA), Math.max(0, newRB)];
}

/**
 * Convert rating to skill level string
 * @param rating - ELO rating
 * @returns Skill level string
 */
export function ratingToLevel(rating: number): string {
  if (rating >= 1400) return "Pro";
  if (rating >= 1200) return "Advanced";
  if (rating >= 1000) return "Intermediate";
  return "Beginner";
}

export interface EloRating {
  elo: number;
  tier: string;
  gameCount: number;
  kFactor: number;
}