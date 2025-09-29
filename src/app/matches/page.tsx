'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Player } from '../../../db/adapter';

interface ExtendedMatch {
  id?: number;
  matchType?: 'singles' | 'doubles';
  playerA_id: number;
  playerB_id: number;
  playerC_id?: number;
  playerD_id?: number;
  scoreA?: number;
  scoreB?: number;
  teamA_score?: number;
  teamB_score?: number;
  winner_id?: number;
  winning_team?: 'A' | 'B';
  created_at?: string;
  playerA_name: string;
  playerB_name: string;
  playerC_name?: string;
  playerD_name?: string;
  winner_name?: string;
}

export default function MatchesPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<ExtendedMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'singles' | 'doubles'>('singles');

  // Singles form state
  const [selectedPlayerA, setSelectedPlayerA] = useState<string>('');
  const [selectedPlayerB, setSelectedPlayerB] = useState<string>('');
  const [scoreA, setScoreA] = useState<string>('');
  const [scoreB, setScoreB] = useState<string>('');

  // Doubles form state  
  const [teamA_playerA, setTeamA_playerA] = useState<string>('');
  const [teamA_playerC, setTeamA_playerC] = useState<string>('');
  const [teamB_playerB, setTeamB_playerB] = useState<string>('');
  const [teamB_playerD, setTeamB_playerD] = useState<string>('');
  const [teamA_score, setTeamA_score] = useState<string>('');
  const [teamB_score, setTeamB_score] = useState<string>('');

  const loadPlayers = async () => {
    try {
      if (typeof window !== 'undefined' && window.electronAPI) {
        const result = await window.electronAPI.getPlayers();
        setPlayers(result);
      }
    } catch (err) {
      console.error('Failed to load players:', err);
      setError('Failed to load players');
    }
  };

  const loadMatches = async () => {
    try {
      if (typeof window !== 'undefined' && window.electronAPI) {
        const result = await window.electronAPI.getMatches();
        setMatches(result);
      }
    } catch (err) {
      console.error('Failed to load matches:', err);
      setError('Failed to load matches');
    }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    await Promise.all([loadPlayers(), loadMatches()]);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSinglesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!selectedPlayerA || !selectedPlayerB) {
      setError('Please select both players');
      return;
    }

    if (selectedPlayerA === selectedPlayerB) {
      setError('Please select different players');
      return;
    }

    const scoreANum = parseInt(scoreA);
    const scoreBNum = parseInt(scoreB);

    if (isNaN(scoreANum) || isNaN(scoreBNum) || scoreANum < 0 || scoreBNum < 0) {
      setError('Please enter valid scores (0 or greater)');
      return;
    }

    if (scoreANum === scoreBNum) {
      setError('Matches cannot end in a tie');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      if (typeof window !== 'undefined' && window.electronAPI) {
        const matchData = {
          playerA_id: parseInt(selectedPlayerA),
          playerB_id: parseInt(selectedPlayerB),
          scoreA: scoreANum,
          scoreB: scoreBNum
        };

        await window.electronAPI.addMatch(matchData);
        
        // Clear form
        setSelectedPlayerA('');
        setSelectedPlayerB('');
        setScoreA('');
        setScoreB('');
        
        setSuccess('Singles match recorded successfully! ELO ratings have been updated.');
        
        // Reload data to show updated ratings and matches
        await loadData();
      }
    } catch (err) {
      console.error('Failed to record match:', err);
      setError('Failed to record match. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDoublesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!teamA_playerA || !teamA_playerC || !teamB_playerB || !teamB_playerD) {
      setError('Please select all four players');
      return;
    }

    const allPlayers = [teamA_playerA, teamA_playerC, teamB_playerB, teamB_playerD];
    const uniquePlayers = new Set(allPlayers);
    if (uniquePlayers.size !== 4) {
      setError('Please select four different players');
      return;
    }

    const teamA_scoreNum = parseInt(teamA_score);
    const teamB_scoreNum = parseInt(teamB_score);

    if (isNaN(teamA_scoreNum) || isNaN(teamB_scoreNum) || teamA_scoreNum < 0 || teamB_scoreNum < 0) {
      setError('Please enter valid scores (0 or greater)');
      return;
    }

    if (teamA_scoreNum === teamB_scoreNum) {
      setError('Matches cannot end in a tie');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      if (typeof window !== 'undefined' && window.electronAPI) {
        const matchData = {
          playerA_id: parseInt(teamA_playerA),
          playerC_id: parseInt(teamA_playerC),
          playerB_id: parseInt(teamB_playerB),
          playerD_id: parseInt(teamB_playerD),
          teamA_score: teamA_scoreNum,
          teamB_score: teamB_scoreNum
        };

        await window.electronAPI.addDoublesMatch(matchData);
        
        // Clear form
        setTeamA_playerA('');
        setTeamA_playerC('');
        setTeamB_playerB('');
        setTeamB_playerD('');
        setTeamA_score('');
        setTeamB_score('');
        
        setSuccess('Doubles match recorded successfully! ELO ratings have been updated.');
        
        // Reload data to show updated ratings and matches
        await loadData();
      }
    } catch (err) {
      console.error('Failed to record doubles match:', err);
      setError('Failed to record doubles match. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getWinnerDisplay = (match: ExtendedMatch) => {
    if (match.matchType === 'doubles') {
      if (match.winning_team === 'A') {
        return (
          <span className="text-green-600 dark:text-green-400 font-semibold">
            Team A ({match.playerA_name}, {match.playerC_name})
          </span>
        );
      } else {
        return (
          <span className="text-green-600 dark:text-green-400 font-semibold">
            Team B ({match.playerB_name}, {match.playerD_name})
          </span>
        );
      }
    } else {
      // Singles match
      if (match.winner_id === match.playerA_id || match.winning_team === 'A') {
        return (
          <span className="text-green-600 dark:text-green-400 font-semibold">
            {match.playerA_name}
          </span>
        );
      } else {
        return (
          <span className="text-green-600 dark:text-green-400 font-semibold">
            {match.playerB_name}
          </span>
        );
      }
    }
  };

  const getMatchDisplay = (match: ExtendedMatch) => {
    if (match.matchType === 'doubles') {
      return {
        players: `${match.playerA_name} & ${match.playerC_name} vs ${match.playerB_name} & ${match.playerD_name}`,
        score: `${match.teamA_score || match.scoreA} - ${match.teamB_score || match.scoreB}`,
        type: 'Doubles'
      };
    } else {
      return {
        players: `${match.playerA_name} vs ${match.playerB_name}`,
        score: `${match.scoreA || match.teamA_score} - ${match.scoreB || match.teamB_score}`,
        type: 'Singles'
      };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Loading matches...</p>
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
              Match Recording
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Record singles and doubles match results with automatic ELO rating updates
            </p>
          </div>
          <Link
            href="/"
            className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            ← Back to Home
          </Link>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('singles')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'singles'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                Singles (1v1)
              </button>
              <button
                onClick={() => setActiveTab('doubles')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'doubles'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                Doubles (2v2)
              </button>
            </nav>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-100 dark:bg-green-900/50 border border-green-400 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-100 dark:bg-red-900/50 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Match Recording Form */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">
              Record New {activeTab === 'singles' ? 'Singles' : 'Doubles'} Match
            </h2>
            
            {activeTab === 'singles' ? (
              <form onSubmit={handleSinglesSubmit} className="space-y-6">
                {/* Player A Selection */}
                <div>
                  <label htmlFor="playerA" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Player A
                  </label>
                  <select
                    id="playerA"
                    value={selectedPlayerA}
                    onChange={(e) => setSelectedPlayerA(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    disabled={submitting}
                  >
                    <option value="">Select Player A</option>
                    {players.map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.tag ? `${player.tag} (${player.name})` : player.name} - Rating: {player.rating}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Player B Selection */}
                <div>
                  <label htmlFor="playerB" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Player B
                  </label>
                  <select
                    id="playerB"
                    value={selectedPlayerB}
                    onChange={(e) => setSelectedPlayerB(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    disabled={submitting}
                  >
                    <option value="">Select Player B</option>
                    {players
                      .filter(player => player.id?.toString() !== selectedPlayerA)
                      .map((player) => (
                        <option key={player.id} value={player.id}>
                          {player.tag ? `${player.tag} (${player.name})` : player.name} - Rating: {player.rating}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Scores */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="scoreA" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Player A Score
                    </label>
                    <input
                      type="number"
                      id="scoreA"
                      value={scoreA}
                      onChange={(e) => setScoreA(e.target.value)}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="0"
                      disabled={submitting}
                    />
                  </div>
                  <div>
                    <label htmlFor="scoreB" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Player B Score
                    </label>
                    <input
                      type="number"
                      id="scoreB"
                      value={scoreB}
                      onChange={(e) => setScoreB(e.target.value)}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="0"
                      disabled={submitting}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting || !selectedPlayerA || !selectedPlayerB || !scoreA || !scoreB}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  {submitting ? 'Recording Match...' : 'Submit Singles Match'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleDoublesSubmit} className="space-y-6">
                {/* Team A Players */}
                <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-4">Team A</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="teamA_playerA" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Player 1
                      </label>
                      <select
                        id="teamA_playerA"
                        value={teamA_playerA}
                        onChange={(e) => setTeamA_playerA(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        disabled={submitting}
                      >
                        <option value="">Select Player</option>
                        {players.map((player) => (
                          <option key={player.id} value={player.id}>
                            {player.tag ? `${player.tag} (${player.name})` : player.name} - {player.rating}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="teamA_playerC" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Player 2 (Partner)
                      </label>
                      <select
                        id="teamA_playerC"
                        value={teamA_playerC}
                        onChange={(e) => setTeamA_playerC(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        disabled={submitting}
                      >
                        <option value="">Select Partner</option>
                        {players
                          .filter(player => player.id?.toString() !== teamA_playerA)
                          .map((player) => (
                            <option key={player.id} value={player.id}>
                              {player.tag ? `${player.tag} (${player.name})` : player.name} - {player.rating}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Team B Players */}
                <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-4">Team B</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="teamB_playerB" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Player 1
                      </label>
                      <select
                        id="teamB_playerB"
                        value={teamB_playerB}
                        onChange={(e) => setTeamB_playerB(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        disabled={submitting}
                      >
                        <option value="">Select Player</option>
                        {players
                          .filter(player => 
                            player.id?.toString() !== teamA_playerA && 
                            player.id?.toString() !== teamA_playerC
                          )
                          .map((player) => (
                            <option key={player.id} value={player.id}>
                              {player.tag ? `${player.tag} (${player.name})` : player.name} - {player.rating}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="teamB_playerD" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Player 2 (Partner)
                      </label>
                      <select
                        id="teamB_playerD"
                        value={teamB_playerD}
                        onChange={(e) => setTeamB_playerD(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        disabled={submitting}
                      >
                        <option value="">Select Partner</option>
                        {players
                          .filter(player => 
                            player.id?.toString() !== teamA_playerA && 
                            player.id?.toString() !== teamA_playerC &&
                            player.id?.toString() !== teamB_playerB
                          )
                          .map((player) => (
                            <option key={player.id} value={player.id}>
                              {player.tag ? `${player.tag} (${player.name})` : player.name} - {player.rating}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Team Scores */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="teamA_score" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Team A Score
                    </label>
                    <input
                      type="number"
                      id="teamA_score"
                      value={teamA_score}
                      onChange={(e) => setTeamA_score(e.target.value)}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="0"
                      disabled={submitting}
                    />
                  </div>
                  <div>
                    <label htmlFor="teamB_score" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Team B Score
                    </label>
                    <input
                      type="number"
                      id="teamB_score"
                      value={teamB_score}
                      onChange={(e) => setTeamB_score(e.target.value)}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="0"
                      disabled={submitting}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting || !teamA_playerA || !teamA_playerC || !teamB_playerB || !teamB_playerD || !teamA_score || !teamB_score}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  {submitting ? 'Recording Match...' : 'Submit Doubles Match'}
                </button>
              </form>
            )}
          </div>

          {/* Match Preview */}
          {activeTab === 'singles' ? (
            selectedPlayerA && selectedPlayerB && scoreA && scoreB && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">
                  Singles Match Preview
                </h2>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-center flex-1">
                      <div className="font-semibold text-gray-800 dark:text-white">
                        {players.find(p => p.id?.toString() === selectedPlayerA)?.tag || 
                         players.find(p => p.id?.toString() === selectedPlayerA)?.name}
                      </div>
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {scoreA}
                      </div>
                    </div>
                    
                    <div className="text-2xl font-bold text-gray-400 mx-4">VS</div>
                    
                    <div className="text-center flex-1">
                      <div className="font-semibold text-gray-800 dark:text-white">
                        {players.find(p => p.id?.toString() === selectedPlayerB)?.tag || 
                         players.find(p => p.id?.toString() === selectedPlayerB)?.name}
                      </div>
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {scoreB}
                      </div>
                    </div>
                  </div>
                  
                  {scoreA !== scoreB && scoreA !== '' && scoreB !== '' && (
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
                      <div className="text-lg font-semibold text-green-800 dark:text-green-300">
                        Winner: {parseInt(scoreA) > parseInt(scoreB) 
                          ? (players.find(p => p.id?.toString() === selectedPlayerA)?.tag || 
                             players.find(p => p.id?.toString() === selectedPlayerA)?.name)
                          : (players.find(p => p.id?.toString() === selectedPlayerB)?.tag || 
                             players.find(p => p.id?.toString() === selectedPlayerB)?.name)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          ) : (
            teamA_playerA && teamA_playerC && teamB_playerB && teamB_playerD && teamA_score && teamB_score && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">
                  Doubles Match Preview
                </h2>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-center flex-1">
                      <div className="font-semibold text-blue-600 dark:text-blue-400 mb-2">Team A</div>
                      <div className="text-sm space-y-1">
                        <div className="font-medium text-gray-800 dark:text-white">
                          {players.find(p => p.id?.toString() === teamA_playerA)?.tag || 
                           players.find(p => p.id?.toString() === teamA_playerA)?.name}
                        </div>
                        <div className="font-medium text-gray-800 dark:text-white">
                          {players.find(p => p.id?.toString() === teamA_playerC)?.tag || 
                           players.find(p => p.id?.toString() === teamA_playerC)?.name}
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                        {teamA_score}
                      </div>
                    </div>
                    
                    <div className="text-2xl font-bold text-gray-400 mx-4">VS</div>
                    
                    <div className="text-center flex-1">
                      <div className="font-semibold text-red-600 dark:text-red-400 mb-2">Team B</div>
                      <div className="text-sm space-y-1">
                        <div className="font-medium text-gray-800 dark:text-white">
                          {players.find(p => p.id?.toString() === teamB_playerB)?.tag || 
                           players.find(p => p.id?.toString() === teamB_playerB)?.name}
                        </div>
                        <div className="font-medium text-gray-800 dark:text-white">
                          {players.find(p => p.id?.toString() === teamB_playerD)?.tag || 
                           players.find(p => p.id?.toString() === teamB_playerD)?.name}
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400 mt-2">
                        {teamB_score}
                      </div>
                    </div>
                  </div>
                  
                  {teamA_score !== teamB_score && teamA_score !== '' && teamB_score !== '' && (
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
                      <div className="text-lg font-semibold text-green-800 dark:text-green-300">
                        Winning Team: {parseInt(teamA_score) > parseInt(teamB_score) ? 'Team A' : 'Team B'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          )}
        </div>

        {/* Recent Matches Table */}
        <div className="mt-12 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">
            Recent Matches
          </h2>
          
          {matches.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4 flex items-center justify-center">
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-500 dark:text-gray-400">M</span>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-lg">No matches recorded yet</p>
              <p className="text-gray-500 dark:text-gray-400">Record your first match above to get started!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                      Date
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                      Type
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                      Match
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                      Score
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                      Winner
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {matches.slice(0, 20).map((match, index) => {
                    const matchDisplay = getMatchDisplay(match);
                    return (
                      <tr 
                        key={match.id} 
                        className={`border-b border-gray-100 dark:border-gray-700 ${
                          index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-700/30' : ''
                        }`}
                      >
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-300 text-sm">
                          {formatDate(match.created_at || '')}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            match.matchType === 'doubles' 
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
                          }`}>
                            {matchDisplay.type}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-800 dark:text-white text-sm">
                            {matchDisplay.players}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="font-bold text-gray-800 dark:text-white">
                            {matchDisplay.score}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {getWinnerDisplay(match)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}