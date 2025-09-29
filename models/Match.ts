export interface Match {
  id?: number;
  player1Id: number;
  player2Id: number;
  player1Character: string;
  player2Character: string;
  player1Score: number;
  player2Score: number;
  winnerId: number;
  loserId: number;
  stage?: string;
  matchType: 'friendly' | 'tournament' | 'ranked';
  notes?: string;
  createdAt?: Date;
}

export class MatchModel {
  constructor(
    public player1Id: number,
    public player2Id: number,
    public player1Character: string,
    public player2Character: string,
    public player1Score: number,
    public player2Score: number,
    public matchType: 'friendly' | 'tournament' | 'ranked' = 'friendly',
    public stage?: string,
    public notes?: string,
    public id?: number,
    public createdAt?: Date
  ) {}

  get winnerId(): number {
    return this.player1Score > this.player2Score ? this.player1Id : this.player2Id;
  }

  get loserId(): number {
    return this.player1Score < this.player2Score ? this.player1Id : this.player2Id;
  }

  get isComplete(): boolean {
    return this.player1Score > 0 || this.player2Score > 0;
  }

  get gameCount(): number {
    return this.player1Score + this.player2Score;
  }

  toJSON(): Match {
    return {
      id: this.id,
      player1Id: this.player1Id,
      player2Id: this.player2Id,
      player1Character: this.player1Character,
      player2Character: this.player2Character,
      player1Score: this.player1Score,
      player2Score: this.player2Score,
      winnerId: this.winnerId,
      loserId: this.loserId,
      stage: this.stage,
      matchType: this.matchType,
      notes: this.notes,
      createdAt: this.createdAt,
    };
  }
}