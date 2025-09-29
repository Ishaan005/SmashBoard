import { allocateCourts } from '../src/app/courts/lib/courtAllocation';
import type { Player, Court, QueueEntry, AllocationRule } from '../src/app/courts/components/types';

describe('Auto Allocation Integration', () => {
  // Helper functions
  const createPlayer = (id: number, name: string, rating: number): Player => ({
    id, name, rating, level: 1, wins: 0, losses: 0
  });

  const createQueueEntry = (player: Player, timestamp = Date.now()): QueueEntry => ({
    id: timestamp + player.id!,
    player,
    joinedAt: new Date(timestamp)
  });

  const createCourt = (id: number, isActive = false): Court => ({
    id, name: `Court ${id}`, isActive, matchType: 'doubles', currentPlayers: []
  });

  it('should handle realistic tournament scenario', () => {
    // Simulate a tournament with mixed skill levels
    const players = [
      createPlayer(1, 'Expert Alice', 1800),
      createPlayer(2, 'Expert Bob', 1750),
      createPlayer(3, 'Advanced Charlie', 1600),
      createPlayer(4, 'Advanced Diana', 1650),
      createPlayer(5, 'Intermediate Eve', 1400),
      createPlayer(6, 'Intermediate Frank', 1450),
      createPlayer(7, 'Beginner Grace', 1200),
      createPlayer(8, 'Beginner Henry', 1250),
    ];

    const queue = players.map(p => createQueueEntry(p));
    const courts = [createCourt(1), createCourt(2), createCourt(3)];

    // Test FIFO allocation
    const fifoRules: AllocationRule = {
      mode: 'fifo',
      skillThreshold: 300,
      matchType: 'doubles'
    };

    const fifoResult = allocateCourts(courts, queue, fifoRules);
    
    // Should allocate 2 courts (8 players / 4 per court = 2 courts)
    expect(fifoResult.allocatedCourts.length).toBe(2);
    expect(fifoResult.remainingQueue.length).toBe(0);
    
    // Verify no player duplication
    const allPlayers = fifoResult.allocatedCourts.flatMap(c => c.players);
    const uniqueIds = new Set(allPlayers.map(p => p.id));
    expect(allPlayers.length).toBe(uniqueIds.size);

    // Test Balanced allocation
    const balancedRules: AllocationRule = {
      mode: 'balanced',
      skillThreshold: 300,
      matchType: 'doubles'
    };

    const balancedResult = allocateCourts(courts, queue, balancedRules);
    
    // Should also allocate courts successfully
    expect(balancedResult.allocatedCourts.length).toBeGreaterThan(0);
    
    // Check that skill differences are within threshold for each court
    balancedResult.allocatedCourts.forEach(court => {
      const ratings = court.players.map(p => p.rating);
      const maxRating = Math.max(...ratings);
      const minRating = Math.min(...ratings);
      expect(maxRating - minRating).toBeLessThanOrEqual(300);
    });
  });

  it('should respect active courts and only use available ones', () => {
    const players = [
      createPlayer(1, 'P1', 1500),
      createPlayer(2, 'P2', 1520),
    ];

    const queue = players.map(p => createQueueEntry(p));
    const courts = [
      createCourt(1, true),  // Active court - should be ignored
      createCourt(2, false), // Available court - should be used
    ];

    const rules: AllocationRule = {
      mode: 'fifo',
      skillThreshold: 200,
      matchType: 'singles'
    };

    const result = allocateCourts(courts, queue, rules);
    
    // Should only allocate to court 2
    expect(result.allocatedCourts).toHaveLength(1);
    expect(result.allocatedCourts[0].courtId).toBe(2);
  });

  it('should handle insufficient players gracefully', () => {
    const players = [createPlayer(1, 'Lonely Player', 1500)];
    const queue = players.map(p => createQueueEntry(p));
    const courts = [createCourt(1)];

    const rules: AllocationRule = {
      mode: 'fifo',
      skillThreshold: 200,
      matchType: 'singles' // Needs 2 players, but only 1 available
    };

    const result = allocateCourts(courts, queue, rules);
    
    expect(result.allocatedCourts).toHaveLength(0);
    expect(result.remainingQueue).toHaveLength(1);
  });
});