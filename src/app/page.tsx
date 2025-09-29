'use client';

import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    // Check if running in Electron for any initialization needed
    if (typeof window !== 'undefined' && window.electronAPI) {
      console.log('Running in Electron environment');
    }
  }, []);

  return (
    <div className="font-sans min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 dark:text-white mb-4">
            SmashBoard
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-2">
            The Ultimate Badminton Club Manager
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Track players, manage matches, courts, and calculate ELO ratings for fair play
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Player Management */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
                Player Management
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Add and manage badminton players with ELO ratings and skill levels.
            </p>
            <a href="/players">
              <button className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                Manage Players
              </button>
            </a>
          </div>

          {/* Match Recording */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
                Match Recording
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Record match results and automatically update ELO ratings.
            </p>
            <a href="/matches">
              <button className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                Record Match
              </button>
            </a>
          </div>

          {/* Leaderboard */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
                Leaderboard
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              View player rankings and statistics based on ELO ratings.
            </p>
            <a href="/leaderboard">
              <button className="bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                View Rankings
              </button>
            </a>
          </div>

          {/* Court Management */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
                Court Management
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Manage court allocations, queues, and match scheduling.
            </p>
            <a href="/courts">
              <button className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                Manage Courts
              </button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}