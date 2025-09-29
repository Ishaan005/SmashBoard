import { contextBridge, ipcRenderer } from 'electron';
import { Player } from '../db/adapter';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Database operations - organized as requested
  db: {
    // Player operations
    addPlayer: (name: string, tag?: string, mainCharacter?: string, secondaryCharacter?: string) => 
      ipcRenderer.invoke('db:addPlayer', { name, tag, mainCharacter, secondaryCharacter }),
    getPlayers: () => ipcRenderer.invoke('db:getPlayers'),
    getPlayerById: (playerId: number) => ipcRenderer.invoke('db:getPlayerById', playerId),
    getPlayerStats: (playerId: number) => ipcRenderer.invoke('db:getPlayerStats', playerId),
    deletePlayer: (playerId: number) => ipcRenderer.invoke('db:deletePlayer', playerId),
    
    // Match operations
    recordMatch: (playerA_id: number, playerB_id: number, scoreA: number, scoreB: number) => 
      ipcRenderer.invoke('db:addMatch', { playerA_id, playerB_id, scoreA, scoreB }),
    recordDoublesMatch: (playerA_id: number, playerC_id: number, playerB_id: number, playerD_id: number, teamA_score: number, teamB_score: number) => 
      ipcRenderer.invoke('db:addDoublesMatch', { playerA_id, playerC_id, playerB_id, playerD_id, teamA_score, teamB_score }),
    getMatches: () => ipcRenderer.invoke('db:getMatches'),
    
    // Leaderboard operations
    getLeaderboard: () => ipcRenderer.invoke('db:getLeaderboard'),
  },

  // Legacy API for backward compatibility
  getPlayers: () => ipcRenderer.invoke('db:getPlayers'),
  addPlayer: (playerData: { name: string; tag?: string; mainCharacter?: string; secondaryCharacter?: string }) => 
    ipcRenderer.invoke('db:addPlayer', playerData),
  getMatches: () => ipcRenderer.invoke('db:getMatches'),
  addMatch: (matchData: { playerA_id: number; playerB_id: number; scoreA: number; scoreB: number }) => 
    ipcRenderer.invoke('db:addMatch', matchData),
  addDoublesMatch: (matchData: { playerA_id: number; playerC_id: number; playerB_id: number; playerD_id: number; teamA_score: number; teamB_score: number }) => 
    ipcRenderer.invoke('db:addDoublesMatch', matchData),
  getLeaderboard: () => ipcRenderer.invoke('db:getLeaderboard'),
  getPlayerStats: (playerId: number) => ipcRenderer.invoke('db:getPlayerStats', playerId),
  getPlayerById: (playerId: number) => ipcRenderer.invoke('db:getPlayerById', playerId),

  // App operations
  getVersion: () => process.versions.electron,
  getPlatform: () => process.platform,
});

// Database API interface
export interface DatabaseAPI {
  addPlayer: (name: string, tag?: string, mainCharacter?: string, secondaryCharacter?: string) => Promise<{ success: boolean; player?: Player; error?: string }>;
  getPlayers: () => Promise<Player[]>;
  getPlayerById: (playerId: number) => Promise<Player | null>;
  getPlayerStats: (playerId: number) => Promise<{ totalMatches: number; wins: number; losses: number; winRate: number }>;
  deletePlayer: (playerId: number) => Promise<{ success: boolean; error?: string }>;
  recordMatch: (playerA_id: number, playerB_id: number, scoreA: number, scoreB: number) => Promise<{ success: boolean; match?: any; error?: string }>;
  recordDoublesMatch: (playerA_id: number, playerC_id: number, playerB_id: number, playerD_id: number, teamA_score: number, teamB_score: number) => Promise<{ success: boolean; match?: any; error?: string }>;
  getMatches: () => Promise<any[]>;
  getLeaderboard: () => Promise<Player[]>;
}

// TypeScript type definition for the exposed API
export interface ElectronAPI {
  // New organized database API
  db: DatabaseAPI;
  
  // Legacy API for backward compatibility
  getPlayers: () => Promise<Player[]>;
  addPlayer: (playerData: { name: string; tag?: string; mainCharacter?: string; secondaryCharacter?: string }) => Promise<{ success: boolean; player?: Player; error?: string }>;
  getMatches: () => Promise<any[]>;
  addMatch: (matchData: { playerA_id: number; playerB_id: number; scoreA: number; scoreB: number }) => Promise<{ success: boolean; match?: any; error?: string }>;
  addDoublesMatch: (matchData: { playerA_id: number; playerC_id: number; playerB_id: number; playerD_id: number; teamA_score: number; teamB_score: number }) => Promise<{ success: boolean; match?: any; error?: string }>;
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