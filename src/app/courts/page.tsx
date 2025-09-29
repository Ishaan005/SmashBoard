 'use client';

import {
  formatMatchDuration,
  generateWhatsAppMessage
} from './lib/courtUtils';
import Link from 'next/link';
import type { Court } from './components/types';
import { useCourtsManager } from './hooks/useCourtsManager';
import AutoAllocation from './components/AutoAllocation';
import CourtZone from './components/CourtZone';
import WaitingList from './components/WaitingList';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';

export default function CourtsPage() {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );
  const {
    players,
    courts,
    queue,
    numCourts,
    setNumCourts,
    matchType,
    setMatchType,
    loading,
    error,
    currentTime,
    handleDragStart,
    handleDragEnd,
    removePlayerFromCourt,
    changeCourtMatchType,
    startCourtMatch,
    endCourtMatch,
    handleMatchComplete,
    addToQueue,
    removeFromQueue,
    handleAutoAllocation,
    clearAllCourts,
    resetCourtSystem,
  } = useCourtsManager();

  const copyToClipboard = async () => {
    const message = generateWhatsAppMessage(courts, queue, matchType, currentTime);
    try {
      await navigator.clipboard.writeText(message);
      alert('Court status copied to clipboard!');
    } catch (clipboardErr) {
      console.error('Failed to copy to clipboard:', clipboardErr);
      alert('Failed to copy to clipboard. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading courts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="container mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
              Court Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage court allocations, queues, and match scheduling
            </p>
          </div>
          <div className="flex flex-wrap gap-3 mt-4 md:mt-0">
            <button
              onClick={clearAllCourts}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Clear All Courts
            </button>
            <button
              onClick={resetCourtSystem}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Reset System
            </button>
            <button
              onClick={copyToClipboard}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Copy to WhatsApp
            </button>
            <Link 
              href="/"
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Court Configuration */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            Court Configuration
          </h2>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-gray-700 dark:text-gray-300">
                Number of Courts:
              </label>
              <select
                value={numCourts}
                onChange={(e) => setNumCourts(parseInt(e.target.value))}
                className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-gray-700 dark:text-gray-300">
                Match Type:
              </label>
              <select
                value={matchType}
                onChange={(e) => setMatchType(e.target.value as 'singles' | 'doubles')}
                className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
              >
                <option value="doubles">Doubles (2v2)</option>
                <option value="singles">Singles (1v1)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Auto Allocation */}
        <AutoAllocation
          courts={courts}
          queue={queue}
          onAllocate={handleAutoAllocation}
          defaultMatchType={matchType}
        />

        {/* Drag and Drop Court Management */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {/* Courts Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {courts.map((court: Court) => (
              <CourtZone
                key={court.id}
                courtNumber={court.id}
                isActive={court.isActive}
                matchType={court.matchType || 'singles'}
                players={court.currentPlayers || []}
                duration={court.isActive && court.currentMatch ? formatMatchDuration(court.currentMatch.startTime, currentTime) : ''}
                currentMatch={court.currentMatch}
                onStartMatch={() => startCourtMatch(court.id)}
                onEndMatch={() => endCourtMatch(court.id)}
                onRemovePlayer={(playerId: number) => removePlayerFromCourt(court.id, playerId)}
                onChangeMatchType={(type: 'singles' | 'doubles') => changeCourtMatchType(court.id, type)}
                onMatchComplete={(player1Score: number, player2Score: number) => handleMatchComplete(court.id, player1Score, player2Score)}
              />
            ))}
          </div>

          {/* Waiting List and Available Players */}
          <WaitingList
            queue={queue}
            players={players}
            onAddToQueue={addToQueue}
            onRemoveFromQueue={removeFromQueue}
          />
        </DndContext>
      </div>
    </div>
  );
}