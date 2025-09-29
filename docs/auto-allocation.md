# Auto Court Allocation

The auto court allocation feature automatically assigns queued players to available courts based on configurable rules, making court management stress-free and efficient.

## Features

### Allocation Modes

1. **FIFO + Skill Filter** (`fifo`)
   - Takes players in queue order (first-in-first-out)
   - Only pairs players within the specified skill threshold
   - Maintains queue fairness while ensuring competitive matches

2. **Balanced Matching** (`balanced`)
   - Finds the best skill matches for competitive games
   - For singles: matches highest rating with closest compatible rating
   - For doubles: creates balanced teams by mixing high and low ratings within skill range

### Configuration Options

- **Skill Threshold**: Maximum Elo difference allowed between matched players (default: ±200)
- **Match Type**: Singles (2 players) or Doubles (4 players)
- **Mode**: FIFO or Balanced allocation strategy

## Usage

1. **Add players to queue**: Use the manual "Add to Queue" buttons or drag players to the queue
2. **Configure allocation rules**: Set your preferred mode, skill threshold, and match type
3. **Click "Auto Allocate Courts"**: The algorithm will automatically fill available courts

## Algorithm Behavior

### FIFO with Skill Filtering
```
For each available court:
  1. Take the first player in queue
  2. Find compatible players within skill threshold
  3. Allocate required number of players (2 for singles, 4 for doubles)
  4. Remove allocated players from queue
```

### Balanced Matching
```
For singles:
  1. Sort players by rating (highest first)  
  2. For each player, find best skill match within threshold
  3. Allocate the most competitive pair

For doubles:
  1. Find skill group within threshold
  2. Create balanced teams: highest + lowest vs 2nd highest + 2nd lowest
```

## API Reference

### `allocateCourts(courts, queue, rules)`

**Parameters:**
- `courts`: Array of Court objects
- `queue`: Array of QueueEntry objects  
- `rules`: AllocationRule configuration

**Returns:**
```typescript
{
  allocatedCourts: Array<{courtId: number, players: Player[]}>,
  remainingQueue: QueueEntry[],
  skippedPlayers: Array<{player: Player, reason: string}>
}
```

**Example:**
```typescript
const rules = {
  mode: 'fifo',
  skillThreshold: 200,
  matchType: 'singles'
};

const result = allocateCourts(courts, queue, rules);
// result.allocatedCourts contains court assignments
// result.remainingQueue contains unallocated players
```

## Testing

The allocation algorithm includes comprehensive unit tests covering:

- ✅ FIFO allocation with skill filtering
- ✅ Balanced matching for singles and doubles  
- ✅ Edge cases (empty queue, no courts, insufficient players)
- ✅ Player deduplication across courts
- ✅ Rule validation

Run tests with:
```bash
npm test courtAllocation.test.ts
```

## Benefits

- **Automation**: Eliminates manual court assignment work
- **Fairness**: FIFO mode respects queue order
- **Competition**: Balanced mode creates competitive matches
- **Skill Protection**: Prevents mismatched games via skill thresholds
- **Flexibility**: Configurable rules for different scenarios
- **Safety**: Validates inputs and prevents duplicate assignments