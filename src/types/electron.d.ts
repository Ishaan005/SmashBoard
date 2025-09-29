import { Player } from '../../db/adapter';

interface MatchWithDetails {
  id?: number;
  playerA_id: number;
  playerB_id: number;
  scoreA: number;
  scoreB: number;
  winner_id: number;
  created_at?: string;
  playerA_name?: string;
  playerB_name?: string;
  winner_name?: string;
}

// Database API interface
interface DatabaseAPI {
  addPlayer: (name: string, tag?: string, mainCharacter?: string, secondaryCharacter?: string) => Promise<{ success: boolean; player?: Player; error?: string }>;
  getPlayers: () => Promise<Player[]>;
  getPlayerById: (playerId: number) => Promise<Player | null>;
  getPlayerStats: (playerId: number) => Promise<{ totalMatches: number; wins: number; losses: number; winRate: number }>;
  recordMatch: (playerA_id: number, playerB_id: number, scoreA: number, scoreB: number) => Promise<{ success: boolean; match?: MatchWithDetails; error?: string }>;
  getMatches: () => Promise<MatchWithDetails[]>;
  getLeaderboard: () => Promise<Player[]>;
}

interface ElectronAPI {
  // New organized database API
  db: DatabaseAPI;
  
  // Legacy API for backward compatibility
  getPlayers: () => Promise<Player[]>;
  addPlayer: (playerData: { name: string; tag?: string; mainCharacter?: string; secondaryCharacter?: string }) => Promise<{ success: boolean; player?: Player; error?: string }>;
  getMatches: () => Promise<MatchWithDetails[]>;
  addMatch: (matchData: { playerA_id: number; playerB_id: number; scoreA: number; scoreB: number }) => Promise<{ success: boolean; match?: MatchWithDetails; error?: string }>;
  getLeaderboard: () => Promise<Player[]>;
  getPlayerStats: (playerId: number) => Promise<{ totalMatches: number; wins: number; losses: number; winRate: number }>;
  getPlayerById: (playerId: number) => Promise<Player | null>;
  
  // App operations
  getVersion: () => string;
  getPlatform: () => string;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};