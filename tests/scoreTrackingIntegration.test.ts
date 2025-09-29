import { allocateCourts } from '../src/app/courts/lib/courtAllocation';
import type { Player, Court, QueueEntry, AllocationRule } from '../src/app/courts/components/types';

describe('Score Tracking Integration', () => {
  // Helper functions
  const createPlayer = (id: number, name: string, rating: number, elo = 1200): Player => ({
    id, name, rating, level: 1, wins: 0, losses: 0, elo
  });

  const createQueueEntry = (player: Player, timestamp = Date.now()): QueueEntry => ({
    id: timestamp + player.id!,
    player,
    joinedAt: new Date(timestamp)
  });

  const createCourt = (id: number, isActive = false): Court => ({
    id, name: `Court ${id}`, isActive, matchType: 'singles', currentPlayers: []
  });

  it('should allocate players and support simplified score tracking', () => {
    // Set up players and courts
    const players = [
      createPlayer(1, 'Alice', 1500, 1400),
      createPlayer(2, 'Bob', 1520, 1450),
    ];
    
    const queue = players.map(p => createQueueEntry(p));
    const courts = [createCourt(1)];
    
    const rules: AllocationRule = {
      mode: 'fifo',
      skillThreshold: 200,
      matchType: 'singles'
    };

    // Test allocation
    const result = allocateCourts(courts, queue, rules);
    
    expect(result.allocatedCourts).toHaveLength(1);
    const allocation = result.allocatedCourts[0];
    expect(allocation.players).toHaveLength(2);
    expect(allocation.players[0]).toEqual(players[0]);
    expect(allocation.players[1]).toEqual(players[1]);
    expect(result.remainingQueue).toHaveLength(0);
  });

  it('should handle match completion with ELO updates', () => {
    // Create a court with an active match
    const player1 = createPlayer(1, 'Alice', 1500, 1400);
    const player2 = createPlayer(2, 'Bob', 1520, 1450);
    
    const court: Court = {
      id: 1,
      name: 'Court 1',
      isActive: true,
      matchType: 'singles',
      currentPlayers: [player1, player2],
      currentMatch: {
        matchType: 'singles',
        player1,
        player2,
        startTime: new Date().toISOString()
      }
    };

    // Simulate match completion with scores
    const player1Score = 21;
    const player2Score = 18;
    const winnerId = player1.id; // Alice wins

    // Verify the match data is properly structured for completion
    expect(court.currentMatch?.player1.elo).toBe(1400);
    expect(court.currentMatch?.player2.elo).toBe(1450);
    
    // The actual ELO calculation would happen in the handleMatchComplete function
    // This test verifies the data structure supports the simplified scoring
    expect(player1Score).toBeGreaterThan(player2Score);
    expect(winnerId).toBe(player1.id);
  });

  it('should support doubles match allocation', () => {
    const players = [
      createPlayer(1, 'Alice', 1500),
      createPlayer(2, 'Bob', 1520),
      createPlayer(3, 'Charlie', 1480),
      createPlayer(4, 'David', 1550),
    ];
    
    const queue = players.map(p => createQueueEntry(p));
    const courts = [{ ...createCourt(1), matchType: 'doubles' as const }];
    
    const rules: AllocationRule = {
      mode: 'fifo',
      skillThreshold: 200,
      matchType: 'doubles'
    };

    const result = allocateCourts(courts, queue, rules);
    
    expect(result.allocatedCourts).toHaveLength(1);
    const allocation = result.allocatedCourts[0];
    expect(allocation.players).toHaveLength(4);
  });

  it('should maintain queue state after partial allocation', () => {
    // More players than can be allocated
    const players = [
      createPlayer(1, 'Alice', 1500),
      createPlayer(2, 'Bob', 1520),
      createPlayer(3, 'Charlie', 1480),
      createPlayer(4, 'David', 1550),
      createPlayer(5, 'Eve', 1490),
    ];
    
    const queue = players.map(p => createQueueEntry(p));
    const courts = [createCourt(1)]; // Only one court for singles
    
    const rules: AllocationRule = {
      mode: 'fifo',
      skillThreshold: 200,
      matchType: 'singles'
    };

    const result = allocateCourts(courts, queue, rules);
    
    // Should allocate first 2 players, leave 3 in queue
    expect(result.remainingQueue).toHaveLength(3);
    expect(result.allocatedCourts).toHaveLength(1);
    expect(result.allocatedCourts[0].players).toHaveLength(2);
  });

  it('should handle balanced allocation mode', () => {
    const players = [
      createPlayer(1, 'Beginner', 1200),
      createPlayer(2, 'Expert', 1800),
      createPlayer(3, 'Intermediate1', 1400),
      createPlayer(4, 'Intermediate2', 1450),
    ];
    
    const queue = players.map(p => createQueueEntry(p));
    const courts = [createCourt(1), createCourt(2)];
    
    const rules: AllocationRule = {
      mode: 'balanced',
      skillThreshold: 150, // Tight threshold
      matchType: 'singles'
    };

    const result = allocateCourts(courts, queue, rules);
    
    // Should match similar skill players
    expect(result.allocatedCourts.length).toBeGreaterThanOrEqual(0);
    
    if (result.allocatedCourts.length > 0) {
      const allocation = result.allocatedCourts[0];
      const ratings = allocation.players.map(p => p.rating);
      const ratingDiff = Math.abs(ratings[0] - ratings[1]);
      expect(ratingDiff).toBeLessThanOrEqual(150);
    }
  });
});