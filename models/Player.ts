export interface Player {
  id?: number;
  name: string;
  tag: string;
  mainCharacter: string;
  secondaryCharacter?: string;
  elo: number;
  wins: number;
  losses: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class PlayerModel {
  constructor(
    public name: string,
    public tag: string,
    public mainCharacter: string,
    public secondaryCharacter?: string,
    public elo: number = 1200,
    public wins: number = 0,
    public losses: number = 0,
    public id?: number,
    public createdAt?: Date,
    public updatedAt?: Date
  ) {}

  get winRate(): number {
    const totalGames = this.wins + this.losses;
    return totalGames === 0 ? 0 : (this.wins / totalGames) * 100;
  }

  get totalGames(): number {
    return this.wins + this.losses;
  }

  updateElo(newElo: number): void {
    this.elo = Math.round(newElo);
    this.updatedAt = new Date();
  }

  recordWin(): void {
    this.wins++;
    this.updatedAt = new Date();
  }

  recordLoss(): void {
    this.losses++;
    this.updatedAt = new Date();
  }

  toJSON(): Player {
    return {
      id: this.id,
      name: this.name,
      tag: this.tag,
      mainCharacter: this.mainCharacter,
      secondaryCharacter: this.secondaryCharacter,
      elo: this.elo,
      wins: this.wins,
      losses: this.losses,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}