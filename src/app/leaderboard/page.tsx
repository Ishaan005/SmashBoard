'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Player } from '../../../db/adapter';

export default function LeaderboardPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLeaderboard = async () => {
    try {
      if (typeof window !== 'undefined' && window.electronAPI) {
        const result = await window.electronAPI.getLeaderboard();
        setPlayers(result.slice(0, 20)); // Top 20 players
      }
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const getLevelBadge = (level: number) => {
    if (level <= 5) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
          Beginner
        </span>
      );
    } else if (level <= 10) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
          Intermediate
        </span>
      );
    } else if (level <= 15) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
          Advanced
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
          Pro
        </span>
      );
    }
  };

  const getRankDisplay = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="flex items-center">
          <span className="text-2xl mr-1">🥇</span>
          <span className="font-bold text-yellow-600 dark:text-yellow-400">#{rank}</span>
        </div>
      );
    } else if (rank === 2) {
      return (
        <div className="flex items-center">
          <span className="text-2xl mr-1">🥈</span>
          <span className="font-bold text-gray-500 dark:text-gray-400">#{rank}</span>
        </div>
      );
    } else if (rank === 3) {
      return (
        <div className="flex items-center">
          <span className="text-2xl mr-1">🥉</span>
          <span className="font-bold text-amber-600 dark:text-amber-400">#{rank}</span>
        </div>
      );
    } else {
      return (
        <span className="text-gray-600 dark:text-gray-400 font-medium">#{rank}</span>
      );
    }
  };

  const getWinRate = (wins: number, losses: number): string => {
    const total = wins + losses;
    if (total === 0) return '0.0%';
    return ((wins / total) * 100).toFixed(1) + '%';
  };

  const getRowStyling = (rank: number, index: number) => {
    let baseClasses = "border-b border-gray-100 dark:border-gray-700 ";
    
    // Striped rows
    if (index % 2 === 0) {
      baseClasses += "bg-gray-50 dark:bg-gray-700/30 ";
    } else {
      baseClasses += "bg-white dark:bg-gray-800 ";
    }
    
    // Bold styling for top 3
    if (rank <= 3) {
      baseClasses += "font-semibold ";
      if (rank === 1) {
        baseClasses += "bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 ";
      } else if (rank === 2) {
        baseClasses += "bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/30 dark:to-gray-600/30 ";
      } else if (rank === 3) {
        baseClasses += "bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 ";
      }
    }
    
    return baseClasses;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Loading leaderboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
              Leaderboard
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Top {players.length} players ranked by ELO rating
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={loadLeaderboard}
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Refresh
            </button>
            <Link
              href="/"
              className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-100 dark:bg-red-900/50 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Stats Summary */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-2xl mr-3 w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-blue-600 dark:text-blue-300">P</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800 dark:text-white">{players.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Total Players</div>
              </div>
            </div>
          </div>
          
          {players.length > 0 && (
            <>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="text-2xl mr-3 w-8 h-8 bg-yellow-100 dark:bg-yellow-800 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-300">★</span>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-800 dark:text-white">{players[0]?.rating || 0}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Highest Rating</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="text-2xl mr-3 w-8 h-8 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-green-600 dark:text-green-300">W</span>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-800 dark:text-white">
                      {Math.round(players.reduce((sum, p) => sum + p.rating, 0) / players.length)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Average Rating</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="text-2xl mr-3 w-8 h-8 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-purple-600 dark:text-purple-300">M</span>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-800 dark:text-white">
                      {players.reduce((sum, p) => sum + p.wins + p.losses, 0)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Total Matches</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Leaderboard Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              Rankings
            </h2>
          </div>
          
          {players.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4 flex items-center justify-center">
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-500 dark:text-gray-400">L</span>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-lg">No players found</p>
              <p className="text-gray-500 dark:text-gray-400">Add some players to see the leaderboard!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Player
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Level
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Record
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Win Rate
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((player, index) => {
                    const rank = index + 1;
                    return (
                      <tr key={player.id} className={getRowStyling(rank, index)}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getRankDisplay(rank)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <div className={`text-sm ${rank <= 3 ? 'font-bold' : 'font-medium'} text-gray-900 dark:text-white`}>
                              {player.name}
                            </div>
                            {player.tag && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                @{player.tag}
                              </div>
                            )}
                            {player.mainCharacter && (
                              <div className="text-xs text-gray-400 dark:text-gray-500">
                                Mains: {player.mainCharacter}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className={`text-2xl ${rank <= 3 ? 'font-bold' : 'font-semibold'} text-gray-900 dark:text-white`}>
                            {player.rating}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex flex-col items-center">
                            <div className={`text-lg ${rank <= 3 ? 'font-bold' : 'font-medium'} text-gray-900 dark:text-white mb-1`}>
                              {player.level}
                            </div>
                            {getLevelBadge(player.level)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex flex-col items-center">
                            <div className={`text-sm ${rank <= 3 ? 'font-bold' : 'font-medium'} text-green-600 dark:text-green-400`}>
                              {player.wins}W
                            </div>
                            <div className={`text-sm ${rank <= 3 ? 'font-bold' : 'font-medium'} text-red-600 dark:text-red-400`}>
                              {player.losses}L
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className={`text-sm ${rank <= 3 ? 'font-bold' : 'font-medium'} text-gray-900 dark:text-white`}>
                            {getWinRate(player.wins, player.losses)}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Level Badges</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              {getLevelBadge(1)}
              <span className="text-sm text-gray-600 dark:text-gray-300">Levels 1-5</span>
            </div>
            <div className="flex items-center space-x-2">
              {getLevelBadge(8)}
              <span className="text-sm text-gray-600 dark:text-gray-300">Levels 6-10</span>
            </div>
            <div className="flex items-center space-x-2">
              {getLevelBadge(13)}
              <span className="text-sm text-gray-600 dark:text-gray-300">Levels 11-15</span>
            </div>
            <div className="flex items-center space-x-2">
              {getLevelBadge(20)}
              <span className="text-sm text-gray-600 dark:text-gray-300">Level 16+</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}