import type { Player, Court, QueueEntry } from '../components/types';

export interface AllocationRule {
  mode: 'fifo' | 'balanced';
  skillThreshold: number; // Elo difference threshold (default ±200)
  matchType: 'singles' | 'doubles';
}

export interface AllocationResult {
  allocatedCourts: Array<{
    courtId: number;
    players: Player[];
  }>;
  remainingQueue: QueueEntry[];
  skippedPlayers: Array<{
    player: Player;
    reason: string;
  }>;
}

/**
 * Auto court allocation algorithm
 * Assigns waiting players to courts based on configurable rules
 */
export function allocateCourts(
  courts: Court[],
  queue: QueueEntry[],
  rules: AllocationRule
): AllocationResult {
  const availableCourts = courts.filter(court => !court.isActive);
  const playersNeededPerCourt = rules.matchType === 'singles' ? 2 : 4;
  
  const result: AllocationResult = {
    allocatedCourts: [],
    remainingQueue: [...queue],
    skippedPlayers: []
  };

  // Process each available court
  for (const court of availableCourts) {
    if (result.remainingQueue.length < playersNeededPerCourt) {
      break; // Not enough players for this court
    }

    let courtPlayers: Player[] = [];

    if (rules.mode === 'fifo') {
      courtPlayers = allocateCourtFIFO(result.remainingQueue, playersNeededPerCourt, rules.skillThreshold);
    } else if (rules.mode === 'balanced') {
      courtPlayers = allocateCourtBalanced(result.remainingQueue, playersNeededPerCourt, rules.skillThreshold);
    }

    if (courtPlayers.length === playersNeededPerCourt) {
      // Successfully allocated players to this court
      result.allocatedCourts.push({
        courtId: court.id,
        players: courtPlayers
      });

      // Remove allocated players from remaining queue
      result.remainingQueue = result.remainingQueue.filter(entry => 
        !courtPlayers.some(player => player.id === entry.player.id)
      );
    }
  }

  return result;
}

/**
 * FIFO allocation with skill filtering
 * Takes players in queue order, but only pairs within skill threshold
 */
function allocateCourtFIFO(
  queue: QueueEntry[],
  playersNeeded: number,
  skillThreshold: number
): Player[] {
  if (queue.length < playersNeeded) return [];

  const players: Player[] = [];
  const availableEntries = [...queue];

  // Take the first player
  const firstEntry = availableEntries.shift()!;
  players.push(firstEntry.player);

  // For singles: find one compatible opponent
  if (playersNeeded === 2) {
    const compatibleEntry = availableEntries.find(entry => 
      Math.abs(entry.player.rating - firstEntry.player.rating) <= skillThreshold
    );
    
    if (compatibleEntry) {
      players.push(compatibleEntry.player);
    }
  }
  
  // For doubles: find 3 more compatible players
  else if (playersNeeded === 4) {
    const compatibleEntries = availableEntries.filter(entry => 
      Math.abs(entry.player.rating - firstEntry.player.rating) <= skillThreshold
    );
    
    // Take next 3 compatible players in queue order
    for (let i = 0; i < Math.min(3, compatibleEntries.length); i++) {
      players.push(compatibleEntries[i].player);
    }
  }

  return players.length === playersNeeded ? players : [];
}

/**
 * Balanced allocation
 * Matches highest rating with closest rating for competitive games
 */
function allocateCourtBalanced(
  queue: QueueEntry[],
  playersNeeded: number,
  skillThreshold: number
): Player[] {
  if (queue.length < playersNeeded) return [];

  const availablePlayers = queue.map(entry => entry.player);
  const players: Player[] = [];

  if (playersNeeded === 2) {
    // Singles: find best skill match
    const sortedByRating = [...availablePlayers].sort((a, b) => b.rating - a.rating);
    
    for (const player1 of sortedByRating) {
      const opponent = availablePlayers.find(player2 => 
        player2.id !== player1.id &&
        Math.abs(player2.rating - player1.rating) <= skillThreshold
      );
      
      if (opponent) {
        players.push(player1, opponent);
        break;
      }
    }
  }
  
  else if (playersNeeded === 4) {
    // Doubles: create balanced teams
    const sortedByRating = [...availablePlayers].sort((a, b) => b.rating - a.rating);
    
    // Try to find 4 players within skill range
    const skillGroup = getSkillGroup(sortedByRating, skillThreshold);
    
    if (skillGroup.length >= 4) {
      // Create balanced teams: mix high and low ratings
      const team1 = [skillGroup[0], skillGroup[3] || skillGroup[2]]; // Highest + lowest
      const team2 = [skillGroup[1], skillGroup[2] || skillGroup[1]]; // 2nd highest + 2nd lowest
      
      players.push(...team1, ...team2.slice(0, 2)); // Ensure exactly 4 players
    }
  }

  return players.length === playersNeeded ? players : [];
}

/**
 * Get a group of players within skill threshold of each other
 */
function getSkillGroup(sortedPlayers: Player[], skillThreshold: number): Player[] {
  if (sortedPlayers.length === 0) return [];
  
  const anchor = sortedPlayers[0];
  return sortedPlayers.filter(player => 
    Math.abs(player.rating - anchor.rating) <= skillThreshold
  );
}

/**
 * Validate allocation rules
 */
export function validateAllocationRules(rules: AllocationRule): string[] {
  const errors: string[] = [];
  
  if (rules.skillThreshold < 0) {
    errors.push('Skill threshold must be non-negative');
  }
  
  if (rules.skillThreshold > 1000) {
    errors.push('Skill threshold should be reasonable (≤1000 Elo)');
  }
  
  if (!['fifo', 'balanced'].includes(rules.mode)) {
    errors.push('Mode must be either "fifo" or "balanced"');
  }
  
  if (!['singles', 'doubles'].includes(rules.matchType)) {
    errors.push('Match type must be either "singles" or "doubles"');
  }
  
  return errors;
}