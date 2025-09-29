import React, { useState } from 'react';
import type { Player } from './types';

interface ScoreTrackerProps {
  matchType: 'singles' | 'doubles';
  player1: Player;
  player2: Player;
  player3?: Player;
  player4?: Player;
  onMatchComplete: (player1Score: number, player2Score: number, winnerId?: number) => void;
}

export default function ScoreTracker({
  matchType,
  player1,
  player2,
  player3,
  player4,
  onMatchComplete
}: ScoreTrackerProps) {
  const [player1Score, setPlayer1Score] = useState(0);
  const [player2Score, setPlayer2Score] = useState(0);
  
  // Team compositions for display
  const team1Name = matchType === 'singles' 
    ? player1.name 
    : `${player1.name} & ${player3?.name || 'Unknown'}`;
  const team2Name = matchType === 'singles' 
    ? player2.name 
    : `${player2.name} & ${player4?.name || 'Unknown'}`;

  const handleCompleteMatch = () => {
    const winnerId = player1Score > player2Score ? player1.id : 
                    player2Score > player1Score ? player2.id : undefined;
    
    onMatchComplete(player1Score, player2Score, winnerId);
  };

  const resetScores = () => {
    setPlayer1Score(0);
    setPlayer2Score(0);
  };

  const canComplete = player1Score > 0 || player2Score > 0;
  const hasWinner = player1Score !== player2Score;

  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-4">
      <div className="text-center">
        <h4 className="font-semibold text-gray-800 dark:text-white mb-1">Match Score</h4>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {matchType === 'singles' ? 'Singles Match' : 'Doubles Match'}
        </div>
      </div>

      {/* Score Input Section */}
      <div className="grid grid-cols-2 gap-4">
        {/* Player/Team 1 Score */}
        <div className="text-center">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
            {team1Name}
          </div>
          <input
            type="number"
            min="0"
            max="99"
            value={player1Score === 0 ? '' : player1Score}
            onChange={(e) => setPlayer1Score(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-full text-2xl font-bold text-center border-2 border-blue-300 dark:border-blue-600 rounded-lg p-2 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 focus:ring-2 focus:ring-blue-500"
            placeholder="0"
          />
        </div>

        {/* Player/Team 2 Score */}
        <div className="text-center">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
            {team2Name}
          </div>
          <input
            type="number"
            min="0"
            max="99"
            value={player2Score === 0 ? '' : player2Score}
            onChange={(e) => setPlayer2Score(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-full text-2xl font-bold text-center border-2 border-red-300 dark:border-red-600 rounded-lg p-2 bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 focus:ring-2 focus:ring-red-500"
            placeholder="0"
          />
        </div>
      </div>

      {/* Quick Score Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Quick Set</div>
          <div className="flex justify-center space-x-1">
            {[11, 15, 21].map(score => (
              <button
                key={score}
                onClick={() => setPlayer1Score(score)}
                className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 rounded"
              >
                {score}
              </button>
            ))}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Quick Set</div>
          <div className="flex justify-center space-x-1">
            {[11, 15, 21].map(score => (
              <button
                key={score}
                onClick={() => setPlayer2Score(score)}
                className="px-2 py-1 text-xs bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-700 dark:text-red-300 rounded"
              >
                {score}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <button
          onClick={resetScores}
          className="flex-1 px-3 py-2 text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-lg"
        >
          Reset
        </button>
        
        <button
          onClick={handleCompleteMatch}
          disabled={!canComplete}
          className={`flex-1 px-3 py-2 text-sm rounded-lg font-medium transition-colors ${
            canComplete
              ? 'bg-green-500 hover:bg-green-600 text-white'
              : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
          }`}
        >
          Complete Match
        </button>
      </div>

      {/* Match Result Preview */}
      {canComplete && (
        <div className="text-center text-sm text-gray-600 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-600">
          {hasWinner ? (
            <div>
              <span className="font-medium">
                {player1Score > player2Score ? team1Name : team2Name}
              </span>
              {' '}wins {Math.max(player1Score, player2Score)} - {Math.min(player1Score, player2Score)}
            </div>
          ) : (
            <div>Draw: {player1Score} - {player2Score}</div>
          )}
        </div>
      )}
    </div>
  );
}