export interface Player {
  id?: number;
  name: string;
  rating: number;
  level: number;
  wins: number;
  losses: number;
  elo?: number;
  tag?: string;
  mainCharacter?: string;
  secondaryCharacter?: string;
}

export interface Court {
  id: number;
  name: string;
  isActive: boolean;
  matchType?: 'singles' | 'doubles';
  currentPlayers?: Player[];
  currentMatch?: {
    matchType: 'singles' | 'doubles';
    player1: Player;
    player2: Player;
    player3?: Player;
    player4?: Player;
    startTime: string;
  };
}

export interface QueueEntry {
  id: number;
  player: Player;
  joinedAt: Date;
  preferredOpponent?: Player;
}

export interface DragData {
  type: 'player' | 'queue';
  player: Player;
  queueId?: number;
}

export interface AllocationRule {
  mode: 'fifo' | 'balanced';
  skillThreshold: number; // Elo difference threshold (default ±200)
  matchType: 'singles' | 'doubles';
}
