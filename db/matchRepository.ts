import { DatabaseManager } from './database';
import { Match, MatchModel } from '../models/Match';

export class MatchRepository {
  private db = DatabaseManager.getInstance().getDatabase();

  private preparedStatements = {
    insert: this.db.prepare(`
      INSERT INTO matches (
        player1_id, player2_id, player1_character, player2_character,
        player1_score, player2_score, winner_id, loser_id,
        stage, match_type, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `),
    findById: this.db.prepare(`
      SELECT * FROM matches WHERE id = ?
    `),
    findAll: this.db.prepare(`
      SELECT * FROM matches ORDER BY created_at DESC
    `),
    findByPlayer: this.db.prepare(`
      SELECT * FROM matches 
      WHERE player1_id = ? OR player2_id = ?
      ORDER BY created_at DESC
    `),
    findBetweenPlayers: this.db.prepare(`
      SELECT * FROM matches 
      WHERE (player1_id = ? AND player2_id = ?) OR (player1_id = ? AND player2_id = ?)
      ORDER BY created_at DESC
    `),
    findRecent: this.db.prepare(`
      SELECT * FROM matches 
      ORDER BY created_at DESC 
      LIMIT ?
    `),
    delete: this.db.prepare(`
      DELETE FROM matches WHERE id = ?
    `)
  };

  async create(match: Omit<Match, 'id' | 'createdAt'>): Promise<Match> {
    try {
      const winnerId = match.player1Score > match.player2Score ? match.player1Id : match.player2Id;
      const loserId = match.player1Score < match.player2Score ? match.player1Id : match.player2Id;

      const result = this.preparedStatements.insert.run(
        match.player1Id,
        match.player2Id,
        match.player1Character,
        match.player2Character,
        match.player1Score,
        match.player2Score,
        winnerId,
        loserId,
        match.stage || null,
        match.matchType || 'friendly',
        match.notes || null
      );

      const newMatch = this.preparedStatements.findById.get(result.lastInsertRowid) as any;
      return this.mapRowToMatch(newMatch);
    } catch (error) {
      throw new Error(`Failed to create match: ${error}`);
    }
  }

  async findById(id: number): Promise<Match | null> {
    const row = this.preparedStatements.findById.get(id) as any;
    return row ? this.mapRowToMatch(row) : null;
  }

  async findAll(): Promise<Match[]> {
    const rows = this.preparedStatements.findAll.all() as any[];
    return rows.map(row => this.mapRowToMatch(row));
  }

  async findByPlayer(playerId: number): Promise<Match[]> {
    const rows = this.preparedStatements.findByPlayer.all(playerId, playerId) as any[];
    return rows.map(row => this.mapRowToMatch(row));
  }

  async findBetweenPlayers(player1Id: number, player2Id: number): Promise<Match[]> {
    const rows = this.preparedStatements.findBetweenPlayers.all(
      player1Id, player2Id, player2Id, player1Id
    ) as any[];
    return rows.map(row => this.mapRowToMatch(row));
  }

  async findRecent(limit: number = 10): Promise<Match[]> {
    const rows = this.preparedStatements.findRecent.all(limit) as any[];
    return rows.map(row => this.mapRowToMatch(row));
  }

  async delete(id: number): Promise<boolean> {
    try {
      const result = this.preparedStatements.delete.run(id);
      return result.changes > 0;
    } catch (error) {
      throw new Error(`Failed to delete match: ${error}`);
    }
  }

  async getPlayerStats(playerId: number): Promise<{
    totalMatches: number;
    wins: number;
    losses: number;
    winRate: number;
  }> {
    const matches = await this.findByPlayer(playerId);
    const wins = matches.filter(match => match.winnerId === playerId).length;
    const losses = matches.filter(match => match.loserId === playerId).length;
    const totalMatches = matches.length;
    const winRate = totalMatches === 0 ? 0 : (wins / totalMatches) * 100;

    return {
      totalMatches,
      wins,
      losses,
      winRate,
    };
  }

  private mapRowToMatch(row: any): Match {
    return {
      id: row.id,
      player1Id: row.player1_id,
      player2Id: row.player2_id,
      player1Character: row.player1_character,
      player2Character: row.player2_character,
      player1Score: row.player1_score,
      player2Score: row.player2_score,
      winnerId: row.winner_id,
      loserId: row.loser_id,
      stage: row.stage,
      matchType: row.match_type,
      notes: row.notes,
      createdAt: new Date(row.created_at),
    };
  }
}