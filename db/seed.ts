import { dbAdapter } from './adapter';

/**
 * Seed script to populate the database with sample players and matches
 */
export class DatabaseSeeder {
  
  /**
   * Seed the database with sample data
   */
  static seed(): void {
    console.log('🌱 Seeding database with sample data...');

    try {
      // Sample players data
      const samplePlayers = [
        { name: 'Alex "Armada" Rodriguez', tag: 'Armada', mainCharacter: 'Fox', secondaryCharacter: 'Peach' },
        { name: 'Juan "Hungrybox" Martinez', tag: 'Hungrybox', mainCharacter: 'Jigglypuff' },
        { name: 'Joseph "Mango" Marquez', tag: 'Mango', mainCharacter: 'Fox', secondaryCharacter: 'Falco' },
        { name: 'Jason "Mew2King" Zimmerman', tag: 'Mew2King', mainCharacter: 'Marth', secondaryCharacter: 'Sheik' },
        { name: 'William "Leffen" Hjelte', tag: 'Leffen', mainCharacter: 'Fox' },
        { name: 'Zachary "PPMD" Scuderi', tag: 'PPMD', mainCharacter: 'Marth', secondaryCharacter: 'Falco' },
        { name: 'Jeffrey "Axe" Williamson', tag: 'Axe', mainCharacter: 'Pikachu' },
        { name: 'Kevin "PPMD" Nanney', tag: 'PewPewU', mainCharacter: 'Marth' },
        { name: 'Johnny "S2J" Kim', tag: 'S2J', mainCharacter: 'Captain Falcon' },
        { name: 'Weston "Westballz" Dennis', tag: 'Westballz', mainCharacter: 'Falco' },
        { name: 'Daniel "ChuDat" Rodriguez', tag: 'ChuDat', mainCharacter: 'Ice Climbers' },
        { name: 'Adam "Armada" Lindgren', tag: 'Swedish Delight', mainCharacter: 'Sheik' }
      ];

      // Add players to database
      const addedPlayers = samplePlayers.map(playerData => {
        const existingPlayer = dbAdapter.getPlayerByName(playerData.name);
        if (existingPlayer) {
          console.log(`⏭️  Player ${playerData.name} already exists, skipping...`);
          return existingPlayer;
        }

        const player = dbAdapter.addPlayer(
          playerData.name,
          playerData.tag,
          playerData.mainCharacter,
          playerData.secondaryCharacter
        );
        console.log(`✅ Added player: ${player.name} (${player.tag})`);
        return player;
      });

      console.log(`\nAdded ${addedPlayers.length} players to the database`);

      // Seed some sample matches
      console.log('\n⚔️  Seeding sample matches...');
      
      const sampleMatches = [
        { playerA: 'Armada', playerB: 'Hungrybox', scoreA: 3, scoreB: 1 },
        { playerA: 'Mango', playerB: 'Mew2King', scoreA: 3, scoreB: 2 },
        { playerA: 'Leffen', playerB: 'PPMD', scoreA: 2, scoreB: 3 },
        { playerA: 'Axe', playerB: 'PewPewU', scoreA: 3, scoreB: 0 },
        { playerA: 'S2J', playerB: 'Westballz', scoreA: 1, scoreB: 3 },
        { playerA: 'Hungrybox', playerB: 'Mango', scoreA: 3, scoreB: 2 },
        { playerA: 'Mew2King', playerB: 'Armada', scoreA: 2, scoreB: 3 },
        { playerA: 'PPMD', playerB: 'Leffen', scoreA: 3, scoreB: 1 },
      ];

      let matchesAdded = 0;
      for (const matchData of sampleMatches) {
        const playerA = addedPlayers.find(p => p.tag === matchData.playerA);
        const playerB = addedPlayers.find(p => p.tag === matchData.playerB);

        if (playerA && playerB && playerA.id && playerB.id) {
          const match = dbAdapter.recordMatch(
            playerA.id,
            playerB.id,
            matchData.scoreA,
            matchData.scoreB
          );
          console.log(`⚔️  Match recorded: ${matchData.playerA} ${matchData.scoreA}-${matchData.scoreB} ${matchData.playerB}`);
          matchesAdded++;
        }
      }

      console.log(`\nAdded ${matchesAdded} sample matches`);

      // Show final leaderboard
      console.log('\nCurrent Leaderboard:');
      const leaderboard = dbAdapter.getLeaderboard();
      leaderboard.slice(0, 10).forEach((player, index) => {
        const winRate = player.wins + player.losses > 0 
          ? ((player.wins / (player.wins + player.losses)) * 100).toFixed(1)
          : '0.0';
        console.log(`${(index + 1).toString().padStart(2)}. ${player.tag?.padEnd(15)} | Rating: ${player.rating.toString().padStart(4)} | Level: ${player.level} | Record: ${player.wins}W-${player.losses}L (${winRate}%)`);
      });

      console.log('\n✅ Database seeding completed successfully!');

    } catch (error) {
      console.error('❌ Error seeding database:', error);
      throw error;
    }
  }

  /**
   * Clear all data from the database
   */
  static clearDatabase(): void {
    console.log('🧹 Clearing database...');
    
    const db = dbAdapter['db']; // Access private db property
    db.exec('DELETE FROM matches');
    db.exec('DELETE FROM players');
    db.exec('DELETE FROM sqlite_sequence WHERE name IN ("players", "matches")');
    
    console.log('✅ Database cleared successfully!');
  }

  /**
   * Reset and reseed the database
   */
  static resetAndSeed(): void {
    DatabaseSeeder.clearDatabase();
    DatabaseSeeder.seed();
  }
}

// If this file is run directly, seed the database
if (require.main === module) {
  DatabaseSeeder.seed();
}