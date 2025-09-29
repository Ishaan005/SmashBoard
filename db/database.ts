import Database from 'better-sqlite3';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

export class DatabaseManager {
  private db: Database.Database;
  private static instance: DatabaseManager;
  private readonly dbPath: string;

  private constructor() {
    let dbPath: string;
    
    try {
      // Use Electron's app module for userData
      const { app } = require('electron');
      const userDbDir = app.getPath('userData');
      const userDbPath = path.join(userDbDir, 'smashboard.db');
      // If a pre-seeded DB is bundled at dist/db, copy it to userData on first launch
      try {
        const appPath = app.getAppPath();
        const bundledDb = path.join(appPath, 'dist', 'db', 'smashboard.db');
        if (!fs.existsSync(userDbPath) && fs.existsSync(bundledDb)) {
          fs.mkdirSync(path.dirname(userDbPath), { recursive: true });
          fs.copyFileSync(bundledDb, userDbPath);
          console.log(`Copied bundled DB from ${bundledDb} to ${userDbPath}`);
        }
      } catch {}
      dbPath = userDbPath;
    } catch (error) {
      // Fallback for non-Electron (testing, seeding, etc.)
      const homeDir = os.homedir();
      const appDataDir = path.join(homeDir, '.smashboard');
      if (!fs.existsSync(appDataDir)) {
        fs.mkdirSync(appDataDir, { recursive: true });
      }
      dbPath = path.join(appDataDir, 'smashboard.db');
    }
    
  console.log(`Opening database at: ${dbPath}`);
  this.dbPath = dbPath;
  this.db = new Database(dbPath);
    this.initializeTables();
  }

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  private initializeTables(): void {
    // Create players table
    this.db.exec(`
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

    // Create matches table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS matches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        match_type TEXT NOT NULL DEFAULT 'singles', -- 'singles' or 'doubles'
        -- Singles: playerA_id and playerB_id are used
        -- Doubles: all four player IDs are used
        playerA_id INTEGER NOT NULL,
        playerB_id INTEGER NOT NULL,
        playerC_id INTEGER, -- Doubles: Partner of playerA
        playerD_id INTEGER, -- Doubles: Partner of playerB
        teamA_score INTEGER NOT NULL,
        teamB_score INTEGER NOT NULL,
        winning_team TEXT NOT NULL, -- 'A' or 'B'
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (playerA_id) REFERENCES players (id),
        FOREIGN KEY (playerB_id) REFERENCES players (id),
        FOREIGN KEY (playerC_id) REFERENCES players (id),
        FOREIGN KEY (playerD_id) REFERENCES players (id)
      )
    `);

    // Create indexes for better performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_players_rating ON players (rating DESC);
      CREATE INDEX IF NOT EXISTS idx_players_level ON players (level DESC);
      CREATE INDEX IF NOT EXISTS idx_matches_created_at ON matches (created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_matches_players_a_b ON matches (playerA_id, playerB_id);
    `);

    // Add new columns to existing matches table if they don't exist
    try {
      this.db.exec(`ALTER TABLE matches ADD COLUMN match_type TEXT DEFAULT 'singles'`);
    } catch (error) {
      // Column may already exist, ignore error
    }
    
    try {
      this.db.exec(`ALTER TABLE matches ADD COLUMN playerC_id INTEGER`);
    } catch (error) {
      // Column may already exist, ignore error
    }
    
    try {
      this.db.exec(`ALTER TABLE matches ADD COLUMN playerD_id INTEGER`);
    } catch (error) {
      // Column may already exist, ignore error
    }
    
    try {
      this.db.exec(`ALTER TABLE matches ADD COLUMN teamA_score INTEGER`);
    } catch (error) {
      // Column may already exist, ignore error
    }
    
    try {
      this.db.exec(`ALTER TABLE matches ADD COLUMN teamB_score INTEGER`);
    } catch (error) {
      // Column may already exist, ignore error
    }
    
    try {
      this.db.exec(`ALTER TABLE matches ADD COLUMN winning_team TEXT`);
    } catch (error) {
      // Column may already exist, ignore error
    }
    
    try {
      this.db.exec(`ALTER TABLE matches ADD COLUMN scoreA INTEGER`);
    } catch (error) {
      // Column may already exist, ignore error
    }
    
    try {
      this.db.exec(`ALTER TABLE matches ADD COLUMN scoreB INTEGER`);
    } catch (error) {
      // Column may already exist, ignore error
    }
    
    try {
      this.db.exec(`ALTER TABLE matches ADD COLUMN winner_id INTEGER`);
    } catch (error) {
      // Column may already exist, ignore error
    }

    // Update existing records to have the new column values
    try {
      this.db.exec(`
        UPDATE matches 
        SET teamA_score = scoreA, 
            teamB_score = scoreB,
            winning_team = CASE WHEN scoreA > scoreB THEN 'A' ELSE 'B' END
        WHERE teamA_score IS NULL OR teamB_score IS NULL OR winning_team IS NULL
      `);
    } catch (error) {
      // Migration may fail if old columns don't exist, ignore
    }
    
    try {
      this.db.exec(`
        UPDATE matches 
        SET scoreA = teamA_score, 
            scoreB = teamB_score
        WHERE scoreA IS NULL OR scoreB IS NULL
      `);
    } catch (error) {
      // Migration may fail if columns don't exist, ignore
    }
    
    try {
      this.db.exec(`
        UPDATE matches 
        SET winner_id = CASE 
          WHEN winning_team = 'A' THEN playerA_id 
          WHEN winning_team = 'B' THEN playerB_id 
          ELSE NULL 
        END
        WHERE winner_id IS NULL
      `);
    } catch (error) {
      // Migration may fail if columns don't exist, ignore
    }

    // Create additional indexes after columns are added
    try {
      this.db.exec(`
        CREATE INDEX IF NOT EXISTS idx_matches_players_c_d ON matches (playerC_id, playerD_id);
        CREATE INDEX IF NOT EXISTS idx_matches_type ON matches (match_type);
      `);
    } catch (error) {
      // Indexes may fail if columns don't exist, ignore
    }
  }

  getDatabase(): Database.Database {
    return this.db;
  }

  getDatabasePath(): string {
    return this.dbPath;
  }

  close(): void {
    this.db.close();
  }
}