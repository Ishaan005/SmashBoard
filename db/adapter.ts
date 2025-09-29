import { DatabaseManager } from './database';
import { EloCalculator } from '../models/Elo';

export interface Player {
  id?: number;
  name: string;
  tag?: string;
  mainCharacter?: string;
  secondaryCharacter?: string;
  rating: number;
  level: number;
  wins: number;
  losses: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Match {
  id?: number;
  matchType: 'singles' | 'doubles';
  playerA_id: number;
  playerB_id: number;
  playerC_id?: number; // Doubles: Partner of playerA
  playerD_id?: number; // Doubles: Partner of playerB
  teamA_score: number;
  teamB_score: number;
  winning_team: 'A' | 'B';
  createdAt?: Date;
  
  // Legacy fields for backwards compatibility
  scoreA?: number;
  scoreB?: number;
  winner_id?: number;
}

export class DBAdapter {
  private db = DatabaseManager.getInstance().getDatabase();
  private preparedStatements: any;

  constructor() {
    this.initializePreparedStatements();
  }

  private initializePreparedStatements(): void {
    this.preparedStatements = {
      // Player statements
      insertPlayer: this.db.prepare(`
        INSERT INTO players (name, tag, main_character, secondary_character, rating, level, wins, losses)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `),
      findPlayerById: this.db.prepare(`
        SELECT * FROM players WHERE id = ?
      `),
      findPlayerByName: this.db.prepare(`
        SELECT * FROM players WHERE name = ?
      `),
      getAllPlayers: this.db.prepare(`
        SELECT * FROM players ORDER BY rating DESC
      `),
      getLeaderboard: this.db.prepare(`
        SELECT * FROM players ORDER BY rating DESC, wins DESC
      `),
      updatePlayerRating: this.db.prepare(`
        UPDATE players 
        SET rating = ?, wins = ?, losses = ?, level = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `),
      deletePlayer: this.db.prepare(`
        DELETE FROM players WHERE id = ?
      `),

      // Match statements
      insertMatch: this.db.prepare(`
        INSERT INTO matches (match_type, playerA_id, playerB_id, playerC_id, playerD_id, teamA_score, teamB_score, winning_team, scoreA, scoreB, winner_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `),
      getAllMatches: this.db.prepare(`
        SELECT m.*, 
               pa.name as playerA_name, 
               pb.name as playerB_name,
               CASE WHEN m.playerC_id IS NOT NULL THEN pc.name ELSE NULL END as playerC_name,
               CASE WHEN m.playerD_id IS NOT NULL THEN pd.name ELSE NULL END as playerD_name
        FROM matches m
        JOIN players pa ON m.playerA_id = pa.id
        JOIN players pb ON m.playerB_id = pb.id
        LEFT JOIN players pc ON m.playerC_id = pc.id
        LEFT JOIN players pd ON m.playerD_id = pd.id
        ORDER BY m.created_at DESC
      `),
      getMatchById: this.db.prepare(`
        SELECT * FROM matches WHERE id = ?
      `),

      // Legacy support - insert singles match using old format
      insertLegacyMatch: this.db.prepare(`
        INSERT INTO matches (match_type, playerA_id, playerB_id, teamA_score, teamB_score, winning_team)
        VALUES ('singles', ?, ?, ?, ?, ?)
      `),

      // Statistics statements
      getPlayerStats: this.db.prepare(`
        SELECT 
          COUNT(*) as total_matches,
          SUM(CASE 
            WHEN (playerA_id = ? AND winning_team = 'A') OR 
                 (playerB_id = ? AND winning_team = 'B') OR
                 (playerC_id = ? AND winning_team = 'A') OR
                 (playerD_id = ? AND winning_team = 'B')
            THEN 1 ELSE 0 END) as wins,
          SUM(CASE 
            WHEN (playerA_id = ? AND winning_team = 'B') OR 
                 (playerB_id = ? AND winning_team = 'A') OR
                 (playerC_id = ? AND winning_team = 'B') OR
                 (playerD_id = ? AND winning_team = 'A')
            THEN 1 ELSE 0 END) as losses
        FROM matches 
        WHERE playerA_id = ? OR playerB_id = ? OR playerC_id = ? OR playerD_id = ?
      `)
    };
  }

  /**
   * Add a new player to the database
   */
  addPlayer(name: string, tag?: string, mainCharacter?: string, secondaryCharacter?: string): Player {
    try {
      const result = this.preparedStatements.insertPlayer.run(
        name,
        tag || null,
        mainCharacter || null,
        secondaryCharacter || null,
        1200, // default rating
        1,    // default level
        0,    // wins
        0     // losses
      );

      const newPlayer = this.preparedStatements.findPlayerById.get(result.lastInsertRowid) as any;
      return this.mapRowToPlayer(newPlayer);
    } catch (error) {
      throw new Error(`Failed to add player: ${error}`);
    }
  }

  /**
   * Get all players
   */
  getPlayers(): Player[] {
    const rows = this.preparedStatements.getAllPlayers.all() as any[];
    return rows.map(row => this.mapRowToPlayer(row));
  }

  /**
   * Get player by ID
   */
  getPlayerById(id: number): Player | null {
    const row = this.preparedStatements.findPlayerById.get(id) as any;
    return row ? this.mapRowToPlayer(row) : null;
  }

  /**
   * Get player by name
   */
  getPlayerByName(name: string): Player | null {
    const row = this.preparedStatements.findPlayerByName.get(name) as any;
    return row ? this.mapRowToPlayer(row) : null;
  }

  /**
   * Record a singles match between two players (legacy method for backwards compatibility)
   */
  recordMatch(playerA_id: number, playerB_id: number, scoreA: number, scoreB: number): Match {
    return this.recordSinglesMatch(playerA_id, playerB_id, scoreA, scoreB);
  }

  /**
   * Record a singles match between two players
   */
  recordSinglesMatch(playerA_id: number, playerB_id: number, teamA_score: number, teamB_score: number): Match {
    const transaction = this.db.transaction(() => {
      // Determine winning team
      const winning_team = teamA_score > teamB_score ? 'A' : 'B';

      // Get current player ratings
      const playerA = this.getPlayerById(playerA_id);
      const playerB = this.getPlayerById(playerB_id);

      if (!playerA || !playerB) {
        throw new Error('One or both players not found');
      }

      // Calculate new ELO ratings
      const eloResult = EloCalculator.calculateEloChange(
        winning_team === 'A' ? playerA.rating : playerB.rating,
        winning_team === 'B' ? playerA.rating : playerB.rating
      );

      // Insert match record
      const matchResult = this.preparedStatements.insertMatch.run(
        'singles',
        playerA_id,
        playerB_id,
        null, // playerC_id
        null, // playerD_id
        teamA_score,
        teamB_score,
        winning_team,
        teamA_score,
        teamB_score,
        winning_team === 'A' ? playerA_id : playerB_id // winner_id
      );

      // Update player ratings and records
      if (winning_team === 'A') {
        this.updateRating(playerA_id, eloResult.winnerNewElo, playerA.wins + 1, playerA.losses);
        this.updateRating(playerB_id, eloResult.loserNewElo, playerB.wins, playerB.losses + 1);
      } else {
        this.updateRating(playerA_id, eloResult.loserNewElo, playerA.wins, playerA.losses + 1);
        this.updateRating(playerB_id, eloResult.winnerNewElo, playerB.wins + 1, playerB.losses);
      }

      // Return the new match
      const newMatch = this.preparedStatements.getMatchById.get(matchResult.lastInsertRowid) as any;
      return this.mapRowToMatch(newMatch);
    });

    return transaction();
  }

  /**
   * Record a doubles match between four players
   */
  recordDoublesMatch(
    playerA_id: number, 
    playerC_id: number, 
    playerB_id: number, 
    playerD_id: number, 
    teamA_score: number, 
    teamB_score: number
  ): Match {
    const transaction = this.db.transaction(() => {
      // Determine winning team
      const winning_team = teamA_score > teamB_score ? 'A' : 'B';

      // Get current player ratings
      const playerA = this.getPlayerById(playerA_id);
      const playerB = this.getPlayerById(playerB_id);
      const playerC = this.getPlayerById(playerC_id);
      const playerD = this.getPlayerById(playerD_id);

      if (!playerA || !playerB || !playerC || !playerD) {
        throw new Error('One or more players not found');
      }

      // Calculate average team ratings for ELO calculation
      const teamA_avgRating = (playerA.rating + playerC.rating) / 2;
      const teamB_avgRating = (playerB.rating + playerD.rating) / 2;

      // Calculate ELO changes based on team averages
      const eloResult = EloCalculator.calculateEloChange(
        winning_team === 'A' ? teamA_avgRating : teamB_avgRating,
        winning_team === 'B' ? teamA_avgRating : teamB_avgRating
      );

      // Insert match record
      const matchResult = this.preparedStatements.insertMatch.run(
        'doubles',
        playerA_id,
        playerB_id,
        playerC_id,
        playerD_id,
        teamA_score,
        teamB_score,
        winning_team,
        teamA_score,
        teamB_score,
        winning_team === 'A' ? playerA_id : playerB_id // winner_id (use team captain)
      );

      // Calculate individual ELO changes (distribute team change among players)
      const winnerEloChange = eloResult.winnerNewElo - (winning_team === 'A' ? teamA_avgRating : teamB_avgRating);
      const loserEloChange = eloResult.loserNewElo - (winning_team === 'B' ? teamA_avgRating : teamB_avgRating);

      // Update player ratings and records
      if (winning_team === 'A') {
        // Team A wins
        this.updateRating(playerA_id, playerA.rating + winnerEloChange, playerA.wins + 1, playerA.losses);
        this.updateRating(playerC_id, playerC.rating + winnerEloChange, playerC.wins + 1, playerC.losses);
        this.updateRating(playerB_id, playerB.rating + loserEloChange, playerB.wins, playerB.losses + 1);
        this.updateRating(playerD_id, playerD.rating + loserEloChange, playerD.wins, playerD.losses + 1);
      } else {
        // Team B wins
        this.updateRating(playerA_id, playerA.rating + loserEloChange, playerA.wins, playerA.losses + 1);
        this.updateRating(playerC_id, playerC.rating + loserEloChange, playerC.wins, playerC.losses + 1);
        this.updateRating(playerB_id, playerB.rating + winnerEloChange, playerB.wins + 1, playerB.losses);
        this.updateRating(playerD_id, playerD.rating + winnerEloChange, playerD.wins + 1, playerD.losses);
      }

      // Return the new match
      const newMatch = this.preparedStatements.getMatchById.get(matchResult.lastInsertRowid) as any;
      return this.mapRowToMatch(newMatch);
    });

    return transaction();
  }

  /**
   * Get leaderboard ordered by rating
   */
  getLeaderboard(): Player[] {
    const rows = this.preparedStatements.getLeaderboard.all() as any[];
    return rows.map(row => this.mapRowToPlayer(row));
  }

  /**
   * Delete a player from the database
   * This will also delete all matches involving the player
   */
  deletePlayer(id: number): boolean {
    const transaction = this.db.transaction(() => {
      try {
        // First, delete all matches involving this player
        const deleteMatchesStmt = this.db.prepare(`
          DELETE FROM matches 
          WHERE playerA_id = ? OR playerB_id = ? OR playerC_id = ? OR playerD_id = ?
        `);
        deleteMatchesStmt.run(id, id, id, id);

        // Then delete the player
        const result = this.preparedStatements.deletePlayer.run(id);
        return result.changes > 0;
      } catch (error) {
        throw new Error(`Failed to delete player: ${error}`);
      }
    });

    return transaction();
  }

  /**
   * Update player rating, wins, and losses
   */
  updateRating(playerId: number, newRating: number, wins: number, losses: number): void {
    const level = this.calculateLevel(newRating, wins + losses);
    this.preparedStatements.updatePlayerRating.run(newRating, wins, losses, level, playerId);
  }

  /**
   * Get all matches with player details
   */
  getAllMatches(): any[] {
    return this.preparedStatements.getAllMatches.all();
  }

  /**
   * Get player statistics
   */
  getPlayerStats(playerId: number): { totalMatches: number; wins: number; losses: number; winRate: number } {
    const stats = this.preparedStatements.getPlayerStats.get(
      playerId, playerId, playerId, playerId,  // For wins calculation
      playerId, playerId, playerId, playerId,  // For losses calculation  
      playerId, playerId, playerId, playerId   // For filtering matches
    ) as any;
    const winRate = stats.total_matches === 0 ? 0 : (stats.wins / stats.total_matches) * 100;
    
    return {
      totalMatches: stats.total_matches,
      wins: stats.wins,
      losses: stats.losses,
      winRate: Math.round(winRate * 100) / 100
    };
  }

  /**
   * Calculate player level based on rating and experience
   */
  private calculateLevel(rating: number, totalMatches: number): number {
    const baseLevel = Math.floor(rating / 100);
    const experienceBonus = Math.floor(totalMatches / 10);
    return Math.max(1, baseLevel + experienceBonus);
  }

  /**
   * Map database row to Player interface
   */
  private mapRowToPlayer(row: any): Player {
    return {
      id: row.id,
      name: row.name,
      tag: row.tag,
      mainCharacter: row.main_character,
      secondaryCharacter: row.secondary_character,
      rating: row.rating,
      level: row.level,
      wins: row.wins,
      losses: row.losses,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  /**
   * Map database row to Match interface
   */
  private mapRowToMatch(row: any): Match {
    return {
      id: row.id,
      matchType: row.match_type || 'singles',
      playerA_id: row.playerA_id,
      playerB_id: row.playerB_id,
      playerC_id: row.playerC_id,
      playerD_id: row.playerD_id,
      teamA_score: row.teamA_score || row.scoreA,
      teamB_score: row.teamB_score || row.scoreB,
      winning_team: row.winning_team || (row.scoreA > row.scoreB ? 'A' : 'B'),
      createdAt: new Date(row.created_at),
      
      // Legacy fields for backwards compatibility
      scoreA: row.teamA_score || row.scoreA,
      scoreB: row.teamB_score || row.scoreB,
      winner_id: row.winner_id || (row.winning_team === 'A' ? row.playerA_id : row.playerB_id)
    };
  }

  /**
   * Close database connection
   */
  close(): void {
    DatabaseManager.getInstance().close();
  }
}

// Create and export singleton instance
export const dbAdapter = new DBAdapter();