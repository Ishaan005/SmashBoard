import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import PlayerPeg from './PlayerPeg';
import ScoreTracker from './ScoreTracker';
import type { Player, DragData } from './types';

interface CourtZoneProps {
  courtNumber: number;
  isActive: boolean;
  matchType: 'singles' | 'doubles';
  players: Player[];
  duration: string;
  currentMatch?: {
    matchType: 'singles' | 'doubles';
    player1: Player;
    player2: Player;
    player3?: Player;
    player4?: Player;
    startTime: string;
  };
  onStartMatch: () => void;
  onEndMatch: () => void;
  onRemovePlayer: (playerId: number) => void;
  onChangeMatchType: (type: 'singles' | 'doubles') => void;
  onMatchComplete: (player1Score: number, player2Score: number, winnerId?: number) => void;
  children?: React.ReactNode;
}

export default function CourtZone({
  courtNumber,
  isActive,
  matchType,
  players,
  duration,
  currentMatch,
  onStartMatch,
  onEndMatch,
  onRemovePlayer,
  onChangeMatchType,
  onMatchComplete,
  children,
}: CourtZoneProps) {
  const { isOver, setNodeRef } = useDroppable({ id: `court-${courtNumber}` });

  const requiredPlayers = matchType === 'singles' ? 2 : 4;
  const hasEnoughPlayers = players.length >= requiredPlayers;
  const isOverCapacity = players.length > requiredPlayers;

  return (
    <div
      ref={setNodeRef}
      className={`
        relative bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 min-h-[300px]
        border-2 transition-all duration-200
        ${isOver ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'}
        ${isActive ? 'ring-2 ring-green-400' : ''}
        ${isOverCapacity ? 'ring-2 ring-red-400' : ''}
      `}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Court {courtNumber}</h3>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onChangeMatchType('singles')}
            className={`px-3 py-1 text-sm rounded ${
              matchType === 'singles'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
            }`}
          >
            Singles
          </button>
          <button
            onClick={() => onChangeMatchType('doubles')}
            className={`px-3 py-1 text-sm rounded ${
              matchType === 'doubles'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
            }`}
          >
            Doubles
          </button>
        </div>
      </div>

      {isActive && (
        <div className="flex items-center justify-between mb-4 p-2 bg-green-100 dark:bg-green-900/30 rounded">
          <span className="text-green-700 dark:text-green-300 font-medium">Match in progress</span>
          <span className="text-green-600 dark:text-green-400 font-mono">{duration}</span>
        </div>
      )}

      {/* Score Tracking for Active Matches */}
      {isActive && currentMatch && (
        <div className="mb-4">
          <ScoreTracker
            matchType={matchType}
            player1={currentMatch.player1}
            player2={currentMatch.player2}
            onMatchComplete={onMatchComplete}
          />
        </div>
      )}

      <div className="mb-4">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>Players ({players.length}/{requiredPlayers})</span>
          {isOverCapacity && <span className="text-red-500 font-medium">Over capacity!</span>}
          {hasEnoughPlayers && !isOverCapacity && !isActive && (
            <span className="text-green-500 font-medium">Ready to start</span>
          )}
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              isOverCapacity ? 'bg-red-500' : hasEnoughPlayers ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min((players.length / requiredPlayers) * 100, 100)}%` }}
          />
        </div>
      </div>

      <div className={`grid gap-3 mb-4 ${matchType === 'singles' ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {players.map((player, index) => (
          <PlayerPeg
            key={`court-${courtNumber}-player-${player.id}-${index}`}
            player={player}
            dragData={{ type: 'player', player } as DragData}
            showRemove={!isActive}
            onRemove={() => onRemovePlayer(player.id!)}
            position={index + 1}
            isInCourt={true}
            context={`court-${courtNumber}`}
          />
        ))}

        {Array.from({ length: Math.max(0, requiredPlayers - players.length) }).map((_, index) => (
          <div
            key={`empty-${index}`}
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-3 min-h-[80px] flex items-center justify-center"
          >
            <span className="text-gray-400 dark:text-gray-500 text-sm">Drop player here</span>
          </div>
        ))}
      </div>

      <div className="flex space-x-2">
        {!isActive && hasEnoughPlayers && !isOverCapacity && (
          <button onClick={onStartMatch} className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">Start Match</button>
        )}

        {isActive && (
          <button onClick={onEndMatch} className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">End Match</button>
        )}

        {!hasEnoughPlayers && (
          <div className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-4 py-2 rounded-lg text-center">
            Need {requiredPlayers - players.length} more player{requiredPlayers - players.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {children}
    </div>
  );
}
