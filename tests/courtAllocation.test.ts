import { allocateCourts, validateAllocationRules } from '../src/app/courts/lib/courtAllocation';
import type { Player, Court, QueueEntry, AllocationRule } from '../src/app/courts/components/types';

// Test data setup
const createPlayer = (id: number, name: string, rating: number): Player => ({
  id,
  name,
  rating,
  level: 1,
  wins: 0,
  losses: 0
});

const createQueueEntry = (player: Player, timestamp = Date.now()): QueueEntry => ({
  id: timestamp + player.id!,
  player,
  joinedAt: new Date(timestamp)
});

const createCourt = (id: number, isActive = false): Court => ({
  id,
  name: `Court ${id}`,
  isActive,
  matchType: 'doubles',
  currentPlayers: []
});

describe('Court Allocation Algorithm', () => {
  describe('FIFO with skill filtering', () => {
    it('should allocate players in queue order when skills are compatible', () => {
      const players = [
        createPlayer(1, 'Alice', 1200),
        createPlayer(2, 'Bob', 1250),
        createPlayer(3, 'Charlie', 1180),
        createPlayer(4, 'Diana', 1220)
      ];
      
      const queue = players.map(p => createQueueEntry(p));
      const courts = [createCourt(1), createCourt(2)];
      
      const rules: AllocationRule = {
        mode: 'fifo',
        skillThreshold: 200,
        matchType: 'singles'
      };
      
      const result = allocateCourts(courts, queue, rules);
      
      expect(result.allocatedCourts).toHaveLength(2);
      expect(result.allocatedCourts[0].players).toHaveLength(2);
      expect(result.allocatedCourts[0].players[0].name).toBe('Alice');
      expect(result.remainingQueue).toHaveLength(0); // All 4 players allocated to 2 courts
    });

    it('should skip players outside skill threshold', () => {
      const players = [
        createPlayer(1, 'Beginner', 800),   // Too low skill
        createPlayer(2, 'Expert', 1800),    // High skill
        createPlayer(3, 'Advanced', 1750),  // Compatible with Expert
        createPlayer(4, 'Intermediate', 1200) // Too low for Expert group
      ];
      
      const queue = players.map(p => createQueueEntry(p));
      const courts = [createCourt(1)];
      
      const rules: AllocationRule = {
        mode: 'fifo',
        skillThreshold: 200,
        matchType: 'singles'
      };
      
      const result = allocateCourts(courts, queue, rules);
      
      // Should not allocate Beginner (800) with Expert (1800) - difference is 1000
      expect(result.allocatedCourts).toHaveLength(0);
      expect(result.remainingQueue).toHaveLength(4);
    });

    it('should handle doubles allocation with 4 players', () => {
      const players = [
        createPlayer(1, 'Player1', 1200),
        createPlayer(2, 'Player2', 1250),
        createPlayer(3, 'Player3', 1180),
        createPlayer(4, 'Player4', 1220),
        createPlayer(5, 'Player5', 1300),
        createPlayer(6, 'Player6', 1280)
      ];
      
      const queue = players.map(p => createQueueEntry(p));
      const courts = [createCourt(1)];
      
      const rules: AllocationRule = {
        mode: 'fifo',
        skillThreshold: 200,
        matchType: 'doubles'
      };
      
      const result = allocateCourts(courts, queue, rules);
      
      expect(result.allocatedCourts).toHaveLength(1);
      expect(result.allocatedCourts[0].players).toHaveLength(4);
      expect(result.remainingQueue).toHaveLength(2);
    });
  });

  describe('Balanced allocation', () => {
    it('should create balanced matches for singles', () => {
      const players = [
        createPlayer(1, 'High', 1500),
        createPlayer(2, 'VeryHigh', 1600),
        createPlayer(3, 'Medium', 1400),
        createPlayer(4, 'Low', 1300)
      ];
      
      const queue = players.map(p => createQueueEntry(p));
      const courts = [createCourt(1)];
      
      const rules: AllocationRule = {
        mode: 'balanced',
        skillThreshold: 300,
        matchType: 'singles'
      };
      
      const result = allocateCourts(courts, queue, rules);
      
      expect(result.allocatedCourts).toHaveLength(1);
      expect(result.allocatedCourts[0].players).toHaveLength(2);
      
      // Should match players with similar skill levels
      const [p1, p2] = result.allocatedCourts[0].players;
      expect(Math.abs(p1.rating - p2.rating)).toBeLessThanOrEqual(300);
    });

    it('should create balanced teams for doubles', () => {
      const players = [
        createPlayer(1, 'Expert1', 1800),
        createPlayer(2, 'Expert2', 1750),
        createPlayer(3, 'Intermediate1', 1400),
        createPlayer(4, 'Intermediate2', 1450)
      ];
      
      const queue = players.map(p => createQueueEntry(p));
      const courts = [createCourt(1)];
      
      const rules: AllocationRule = {
        mode: 'balanced',
        skillThreshold: 400,
        matchType: 'doubles'
      };
      
      const result = allocateCourts(courts, queue, rules);
      
      expect(result.allocatedCourts).toHaveLength(1);
      expect(result.allocatedCourts[0].players).toHaveLength(4);
      
      // All players should be within skill threshold
      const players_allocated = result.allocatedCourts[0].players;
      const maxRating = Math.max(...players_allocated.map(p => p.rating));
      const minRating = Math.min(...players_allocated.map(p => p.rating));
      expect(maxRating - minRating).toBeLessThanOrEqual(400);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty queue', () => {
      const courts = [createCourt(1)];
      const rules: AllocationRule = {
        mode: 'fifo',
        skillThreshold: 200,
        matchType: 'singles'
      };
      
      const result = allocateCourts(courts, [], rules);
      
      expect(result.allocatedCourts).toHaveLength(0);
      expect(result.remainingQueue).toHaveLength(0);
    });

    it('should handle no available courts', () => {
      const players = [createPlayer(1, 'Alice', 1200), createPlayer(2, 'Bob', 1250)];
      const queue = players.map(p => createQueueEntry(p));
      const courts = [createCourt(1, true)]; // Active court
      
      const rules: AllocationRule = {
        mode: 'fifo',
        skillThreshold: 200,
        matchType: 'singles'
      };
      
      const result = allocateCourts(courts, queue, rules);
      
      expect(result.allocatedCourts).toHaveLength(0);
      expect(result.remainingQueue).toHaveLength(2);
    });

    it('should not duplicate players across courts', () => {
      const players = [
        createPlayer(1, 'P1', 1200),
        createPlayer(2, 'P2', 1250),
        createPlayer(3, 'P3', 1180),
        createPlayer(4, 'P4', 1220)
      ];
      
      const queue = players.map(p => createQueueEntry(p));
      const courts = [createCourt(1), createCourt(2)];
      
      const rules: AllocationRule = {
        mode: 'fifo',
        skillThreshold: 200,
        matchType: 'singles'
      };
      
      const result = allocateCourts(courts, queue, rules);
      
      const allAllocatedPlayers = result.allocatedCourts.flatMap(court => court.players);
      const playerIds = allAllocatedPlayers.map(p => p.id);
      const uniquePlayerIds = new Set(playerIds);
      
      expect(playerIds.length).toBe(uniquePlayerIds.size); // No duplicates
    });
  });

  describe('Rule validation', () => {
    it('should validate allocation rules correctly', () => {
      const validRules: AllocationRule = {
        mode: 'fifo',
        skillThreshold: 200,
        matchType: 'singles'
      };
      
      expect(validateAllocationRules(validRules)).toHaveLength(0);
    });

    it('should catch invalid skill threshold', () => {
      const invalidRules: AllocationRule = {
        mode: 'fifo',
        skillThreshold: -100,
        matchType: 'singles'
      };
      
      const errors = validateAllocationRules(invalidRules);
      expect(errors).toContain('Skill threshold must be non-negative');
    });

    it('should catch invalid mode', () => {
      const invalidRules = {
        mode: 'invalid',
        skillThreshold: 200,
        matchType: 'singles'
      } as unknown as AllocationRule;
      
      const errors = validateAllocationRules(invalidRules);
      expect(errors).toContain('Mode must be either "fifo" or "balanced"');
    });
  });
});