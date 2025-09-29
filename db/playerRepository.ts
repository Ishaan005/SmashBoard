import { DatabaseManager } from './database';
import { Player, PlayerModel } from '../models/Player';

export class PlayerRepository {
  private db = DatabaseManager.getInstance().getDatabase();

  private preparedStatements = {
    insert: this.db.prepare(`
      INSERT INTO players (name, tag, main_character, secondary_character, elo, wins, losses)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `),
    findById: this.db.prepare(`
      SELECT * FROM players WHERE id = ?
    `),
    findByTag: this.db.prepare(`
      SELECT * FROM players WHERE tag = ?
    `),
    findAll: this.db.prepare(`
      SELECT * FROM players ORDER BY elo DESC
    `),
    update: this.db.prepare(`
      UPDATE players 
      SET name = ?, main_character = ?, secondary_character = ?, elo = ?, wins = ?, losses = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `),
    updateElo: this.db.prepare(`
      UPDATE players 
      SET elo = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `),
    updateRecord: this.db.prepare(`
      UPDATE players 
      SET wins = ?, losses = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `),
    delete: this.db.prepare(`
      DELETE FROM players WHERE id = ?
    `)
  };

  async create(player: Omit<Player, 'id' | 'createdAt' | 'updatedAt'>): Promise<Player> {
    try {
      const result = this.preparedStatements.insert.run(
        player.name,
        player.tag,
        player.mainCharacter,
        player.secondaryCharacter || null,
        player.elo || 1200,
        player.wins || 0,
        player.losses || 0
      );

      const newPlayer = this.preparedStatements.findById.get(result.lastInsertRowid) as any;
      return this.mapRowToPlayer(newPlayer);
    } catch (error) {
      throw new Error(`Failed to create player: ${error}`);
    }
  }

  async findById(id: number): Promise<Player | null> {
    const row = this.preparedStatements.findById.get(id) as any;
    return row ? this.mapRowToPlayer(row) : null;
  }

  async findByTag(tag: string): Promise<Player | null> {
    const row = this.preparedStatements.findByTag.get(tag) as any;
    return row ? this.mapRowToPlayer(row) : null;
  }

  async findAll(): Promise<Player[]> {
    const rows = this.preparedStatements.findAll.all() as any[];
    return rows.map(row => this.mapRowToPlayer(row));
  }

  async update(id: number, updates: Partial<Player>): Promise<Player | null> {
    try {
      const existingPlayer = await this.findById(id);
      if (!existingPlayer) return null;

      const updatedPlayer = { ...existingPlayer, ...updates };
      
      this.preparedStatements.update.run(
        updatedPlayer.name,
        updatedPlayer.mainCharacter,
        updatedPlayer.secondaryCharacter || null,
        updatedPlayer.elo,
        updatedPlayer.wins,
        updatedPlayer.losses,
        id
      );

      return await this.findById(id);
    } catch (error) {
      throw new Error(`Failed to update player: ${error}`);
    }
  }

  async updateElo(id: number, newElo: number): Promise<void> {
    this.preparedStatements.updateElo.run(newElo, id);
  }

  async updateRecord(id: number, wins: number, losses: number): Promise<void> {
    this.preparedStatements.updateRecord.run(wins, losses, id);
  }

  async delete(id: number): Promise<boolean> {
    const transaction = this.db.transaction(() => {
      try {
        // First, delete all matches involving this player
        const deleteMatchesStmt = this.db.prepare(`
          DELETE FROM matches 
          WHERE playerA_id = ? OR playerB_id = ? OR playerC_id = ? OR playerD_id = ?
        `);
        deleteMatchesStmt.run(id, id, id, id);

        // Then delete the player
        const result = this.preparedStatements.delete.run(id);
        return result.changes > 0;
      } catch (error) {
        throw new Error(`Failed to delete player: ${error}`);
      }
    });

    return transaction();
  }

  private mapRowToPlayer(row: any): Player {
    return {
      id: row.id,
      name: row.name,
      tag: row.tag,
      mainCharacter: row.main_character,
      secondaryCharacter: row.secondary_character,
      elo: row.elo,
      wins: row.wins,
      losses: row.losses,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}