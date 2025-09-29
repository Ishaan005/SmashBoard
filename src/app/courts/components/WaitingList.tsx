import React from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import PlayerPeg from './PlayerPeg';
import type { QueueEntry, Player } from './types';

interface WaitingListProps {
  queue: QueueEntry[];
  players: Player[];
  onAddToQueue: (playerId: number) => void;
  onRemoveFromQueue: (queueId: number) => void;
}

export default function WaitingList({ queue, players, onAddToQueue, onRemoveFromQueue }: WaitingListProps) {
  const getSkillLevelFromRating = (rating: number) => {
    if (rating < 1000) return 'Beginner';
    if (rating < 1400) return 'Intermediate';
    if (rating < 1800) return 'Advanced';
    return 'Expert';
  };

  const getSkillLevelColor = (skillLevel: string) => {
    switch (skillLevel) {
      case 'Beginner': return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      case 'Intermediate': return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100';
      case 'Advanced': return 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100';
      case 'Expert': return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  const availablePlayers = players.filter(player => !queue.some(entry => entry.player.id === player.id));

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Queue ({queue.length})</h2>

        {queue.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4 flex items-center justify-center">
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-500 dark:text-gray-400">Q</span>
              </div>
            </div>
            <p className="text-gray-500 dark:text-gray-400 mb-4">No players in queue</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">Drag players from the available list or click &ldquo;Add to Queue&rdquo;</p>
          </div>
        ) : (
          <SortableContext items={queue.map(entry => `queue-queue-${entry.player.id}`)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {queue.map((entry, index) => (
                <PlayerPeg
                  key={`queue-${entry.id}`}
                  player={entry.player}
                  dragData={{ type: 'queue', player: entry.player, queueId: entry.id }}
                  showRemove={true}
                  onRemove={() => onRemoveFromQueue(entry.id)}
                  position={index + 1}
                  context="queue"
                />
              ))}
            </div>
          </SortableContext>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Available Players</h2>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {availablePlayers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">All players are in queue or on courts</p>
            </div>
          ) : (
            availablePlayers.map((player) => (
              <div key={player.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-600">
                <div className="flex items-center space-x-3">
                  <div>
                    <span className="font-medium text-gray-800 dark:text-white">{player.name}</span>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${getSkillLevelColor(getSkillLevelFromRating(player.rating))}`}>{getSkillLevelFromRating(player.rating)}</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Rating: {player.rating}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => onAddToQueue(player.id!)} className="text-blue-500 hover:text-blue-700 px-3 py-1 rounded bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800">Add to Queue</button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
