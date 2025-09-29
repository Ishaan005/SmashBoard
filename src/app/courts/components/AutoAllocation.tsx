import React, { useState } from 'react';
import { allocateCourts, validateAllocationRules } from '../lib/courtAllocation';
import type { Player, Court, QueueEntry, AllocationRule } from './types';

interface AutoAllocationProps {
  courts: Court[];
  queue: QueueEntry[];
  onAllocate: (allocations: Array<{ courtId: number; players: Player[] }>) => void;
  defaultMatchType?: 'singles' | 'doubles';
}

export default function AutoAllocation({ 
  courts, 
  queue, 
  onAllocate, 
  defaultMatchType = 'doubles' 
}: AutoAllocationProps) {
  const [rules, setRules] = useState<AllocationRule>({
    mode: 'fifo',
    skillThreshold: 200,
    matchType: defaultMatchType
  });
  
  const [isAllocating, setIsAllocating] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const availableCourts = courts.filter(court => !court.isActive);
  const playersNeeded = rules.matchType === 'singles' ? 2 : 4;
  const maxPossibleAllocations = Math.min(
    availableCourts.length,
    Math.floor(queue.length / playersNeeded)
  );

  const handleAutoAllocate = async () => {
    setIsAllocating(true);
    setLastResult(null);
    
    try {
      // Validate rules first
      const validationErrors = validateAllocationRules(rules);
      if (validationErrors.length > 0) {
        setLastResult(`Validation errors: ${validationErrors.join(', ')}`);
        return;
      }

      // Run allocation algorithm
      const result = allocateCourts(courts, queue, rules);
      
      if (result.allocatedCourts.length > 0) {
        // Apply allocations
        onAllocate(result.allocatedCourts);
        
        const skippedInfo = result.skippedPlayers.length > 0 
          ? ` (${result.skippedPlayers.length} players skipped due to skill mismatch)`
          : '';
        
        setLastResult(
          `✅ Allocated ${result.allocatedCourts.length} court${result.allocatedCourts.length !== 1 ? 's' : ''} with ${result.allocatedCourts.length * playersNeeded} players${skippedInfo}`
        );
      } else {
        setLastResult('⚠️ No valid allocations found with current rules. Try adjusting skill threshold or check queue.');
      }
    } catch (error) {
      setLastResult(`❌ Error during allocation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAllocating(false);
    }
  };

  const canAllocate = queue.length >= playersNeeded && availableCourts.length > 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-1">
            Auto Court Allocation
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Automatically assign queued players to available courts
          </p>
        </div>
        
        <div className="text-right">
          <div className="text-lg font-semibold text-gray-800 dark:text-white">
            {maxPossibleAllocations}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            courts ready
          </div>
        </div>
      </div>

      {/* Configuration */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Allocation Mode
          </label>
          <select
            value={rules.mode}
            onChange={(e) => setRules(prev => ({ ...prev, mode: e.target.value as 'fifo' | 'balanced' }))}
            className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="fifo">FIFO + Skill Filter</option>
            <option value="balanced">Balanced Matching</option>
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {rules.mode === 'fifo' 
              ? 'Queue order with skill compatibility'
              : 'Best skill matches for competitive games'
            }
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Skill Threshold (±Elo)
          </label>
          <input
            type="number"
            min="0"
            max="1000"
            step="50"
            value={rules.skillThreshold}
            onChange={(e) => setRules(prev => ({ ...prev, skillThreshold: parseInt(e.target.value) || 0 }))}
            className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Only match players within this Elo range
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Match Type
          </label>
          <select
            value={rules.matchType}
            onChange={(e) => setRules(prev => ({ ...prev, matchType: e.target.value as 'singles' | 'doubles' }))}
            className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="singles">Singles (2 players)</option>
            <option value="doubles">Doubles (4 players)</option>
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {playersNeeded} players per court
          </p>
        </div>
      </div>

      {/* Status Info */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-gray-800 dark:text-white">
              {queue.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              In Queue
            </div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-800 dark:text-white">
              {availableCourts.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Available Courts
            </div>
          </div>
          <div>
            <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
              {maxPossibleAllocations * playersNeeded}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Players Can Place
            </div>
          </div>
        </div>
      </div>

      {/* Result Display */}
      {lastResult && (
        <div className={`p-3 rounded-lg mb-4 text-sm ${
          lastResult.startsWith('✅') ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
          lastResult.startsWith('⚠️') ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
          'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
        }`}>
          {lastResult}
        </div>
      )}

      {/* Action Button */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {canAllocate 
            ? `Ready to allocate up to ${maxPossibleAllocations} court${maxPossibleAllocations !== 1 ? 's' : ''}`
            : queue.length < playersNeeded 
              ? `Need ${playersNeeded - queue.length} more player${playersNeeded - queue.length !== 1 ? 's' : ''} in queue`
              : 'No available courts'
          }
        </div>
        
        <button
          onClick={handleAutoAllocate}
          disabled={!canAllocate || isAllocating}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            canAllocate && !isAllocating
              ? 'bg-blue-500 hover:bg-blue-600 text-white'
              : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
          }`}
        >
          {isAllocating ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Allocating...
            </span>
          ) : (
            'Auto Allocate Courts'
          )}
        </button>
      </div>
    </div>
  );
}