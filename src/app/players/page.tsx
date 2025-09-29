'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';

interface Player {
  id?: number;
  name: string;
  tag?: string;
  mainCharacter?: string;
  secondaryCharacter?: string;
  rating: number;
  level: number;
  wins: number;
  losses: number;
  createdAt?: Date;
  updatedAt?: Date;
}

type SortField = 'name' | 'rating' | 'level' | 'wins' | 'losses' | 'createdAt';
type SortDirection = 'asc' | 'desc';

const DEMO_PLAYERS: Player[] = [
  {
    id: 1,
    name: 'Alice Johnson',
    tag: 'AJ',
    mainCharacter: 'Singles',
    rating: 1350,
    level: 14,
    wins: 25,
    losses: 8,
    createdAt: new Date('2024-01-15')
  },
  {
    id: 2,
    name: 'Bob Smith',
    tag: 'BS',
    mainCharacter: 'Doubles',
    rating: 1220,
    level: 12,
    wins: 18,
    losses: 12,
    createdAt: new Date('2024-01-20')
  },
  {
    id: 3,
    name: 'Carol Wang',
    tag: 'CW',
    mainCharacter: 'Mixed',
    rating: 1180,
    level: 11,
    wins: 15,
    losses: 10,
    createdAt: new Date('2024-02-01')
  }
];

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('rating');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Player | null>(null);

  // Detect if running in Electron renderer via presence of electronAPI
  const isElectron = typeof window !== 'undefined' && !!window.electronAPI;

  const [formData, setFormData] = useState({
    name: '',
    tag: '',
    mainCharacter: '',
    secondaryCharacter: ''
  });
  
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Diagnostics info for display
  const [diagInfo, setDiagInfo] = useState<{ dbPath: string; playerCount: number | null } | null>(null);

  const loadPlayers = useCallback(async (): Promise<Player[]> => {
    if (typeof window === 'undefined' || !window.electronAPI) {
      return [];
    }

    setLoading(true);
    try {
      const playersData = await window.electronAPI.db.getPlayers();
      setPlayers(playersData);
      return playersData;
    } catch (error) {
      console.error('Error loading players:', error);
      showMessage('error', 'Failed to load players');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Add a small delay to ensure preload script has fully loaded
    const checkElectronAPI = async () => {
      console.log('PlayersPage electronAPI:', window.electronAPI);
      console.log('PlayersPage isElectron flag:', (window as typeof window & { isElectron?: boolean }).isElectron);
      console.log('All window properties:', Object.keys(window));
      
      // Write to log file for debugging
      try {
        const logData = {
          timestamp: new Date().toISOString(),
          hasElectronAPI: !!window.electronAPI,
          hasIsElectronFlag: !!(window as typeof window & { isElectron?: boolean }).isElectron,
          windowKeys: Object.keys(window).slice(0, 20) // First 20 keys only
        };
        console.log('DEBUG LOG:', JSON.stringify(logData, null, 2));
      } catch (e) {
        console.error('Failed to create debug log:', e);
      }
      
      // Try multiple detection methods
      const hasElectronAPI = typeof window !== 'undefined' && !!window.electronAPI;
      const hasElectronFlag = typeof window !== 'undefined' && !!(window as typeof window & { isElectron?: boolean }).isElectron;
      const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
      
      console.log('Detection results:', { hasElectronAPI, hasElectronFlag, userAgent });
      
      if (hasElectronAPI && window.electronAPI?.diagnostics) {
        try {
          const status = await window.electronAPI.diagnostics.getStatus();
          console.log('Database diagnostics:', status.dbPath, 'playerCount:', status.playerCount);
          setDiagInfo({ dbPath: status.dbPath, playerCount: status.playerCount });
        } catch (err) {
          console.error('Diagnostics error:', err);
          setDiagInfo({ dbPath: 'Error loading diagnostics', playerCount: null });
        }
      } else if (!hasElectronAPI) {
        console.warn('PlayersPage: running in demo mode - no electronAPI');
        setDiagInfo({ dbPath: 'Demo mode - no database', playerCount: null });
      }
      if (isElectron) {
        const data = await loadPlayers();
        if (data.length === 0) {
          setPlayers([...DEMO_PLAYERS]);
        }
      } else {
        setPlayers([...DEMO_PLAYERS]);
        setLoading(false);
      }
    };

    // Try immediately and also after a delay
    checkElectronAPI();
    setTimeout(checkElectronAPI, 500);
  }, [loadPlayers, isElectron]);

  // Filtered and sorted players
  const filteredAndSortedPlayers = useMemo(() => {
    const filtered = players.filter(player => 
      player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (player.tag && player.tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return filtered.sort((a, b) => {
      let aVal: string | number = a[sortField as keyof Player] as string | number;
      let bVal: string | number = b[sortField as keyof Player] as string | number;

      // Handle date sorting
      if (sortField === 'createdAt') {
        aVal = new Date(aVal || 0).getTime();
        bVal = new Date(bVal || 0).getTime();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [players, searchQuery, sortField, sortDirection]);

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Player name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Player name must be at least 2 characters';
    } else {
      // Check for unique name (excluding current editing player)
      const existingPlayer = players.find(p => 
        p.name.toLowerCase() === formData.name.trim().toLowerCase() && 
        p.id !== editingPlayer?.id
      );
      if (existingPlayer) {
        errors.name = 'Player name must be unique';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || submitting) return;

    if (editingPlayer) {
      await handleUpdatePlayer();
    } else {
      await handleAddPlayer();
    }
  };

  const handleAddPlayer = async () => {
    if (!isElectron) {
      // Mock add for development
      const newPlayer: Player = {
        id: Math.max(...players.map(p => p.id || 0)) + 1,
        name: formData.name.trim(),
        tag: formData.tag.trim() || undefined,
        mainCharacter: formData.mainCharacter.trim() || undefined,
        secondaryCharacter: formData.secondaryCharacter.trim() || undefined,
        rating: 1200,
        level: 12,
        wins: 0,
        losses: 0,
        createdAt: new Date()
      };
      setPlayers(prev => [...prev, newPlayer]);
      resetForm();
      showMessage('success', 'Player added successfully!');
      return;
    }

    try {
      setSubmitting(true);
      const result = await window.electronAPI.db.addPlayer(
        formData.name.trim(),
        formData.tag.trim() || undefined,
        formData.mainCharacter.trim() || undefined,
        formData.secondaryCharacter.trim() || undefined
      );

      if (result.success) {
        showMessage('success', 'Player added successfully!');
        resetForm();
        await loadPlayers();
      } else {
        showMessage('error', result.error || 'Failed to add player');
      }
    } catch (error) {
      console.error('Error adding player:', error);
      showMessage('error', 'Failed to add player');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatePlayer = async () => {
    if (!editingPlayer) return;

    // For development mode, update locally
    if (!isElectron) {
      setPlayers(prev => prev.map(p => 
        p.id === editingPlayer.id 
          ? { ...p, name: formData.name.trim(), tag: formData.tag.trim() || undefined }
          : p
      ));
      resetForm();
      showMessage('success', 'Player updated successfully!');
      return;
    }

    try {
      setSubmitting(true);
      // Note: We'd need to add updatePlayer to the API
      // For now, we'll use a mock update
      setPlayers(prev => prev.map(p => 
        p.id === editingPlayer.id 
          ? { ...p, name: formData.name.trim(), tag: formData.tag.trim() || undefined }
          : p
      ));
      resetForm();
      showMessage('success', 'Player updated successfully!');
    } catch (error) {
      console.error('Error updating player:', error);
      showMessage('error', 'Failed to update player');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditPlayer = (player: Player) => {
    setEditingPlayer(player);
    setFormData({
      name: player.name,
      tag: player.tag || '',
      mainCharacter: player.mainCharacter || '',
      secondaryCharacter: player.secondaryCharacter || ''
    });
  };

  const handleDeletePlayer = async (player: Player) => {
    if (!isElectron) {
      // Mock delete for development
      setPlayers(prev => prev.filter(p => p.id !== player.id));
      setShowDeleteConfirm(null);
      showMessage('success', 'Player deleted successfully!');
      return;
    }

    try {
      if (!player.id) {
        showMessage('error', 'Invalid player ID');
        return;
      }

      const result = await window.electronAPI.db.deletePlayer(player.id);
      
      if (result.success) {
        setPlayers(prev => prev.filter(p => p.id !== player.id));
        setShowDeleteConfirm(null);
        showMessage('success', 'Player deleted successfully!');
      } else {
        showMessage('error', result.error || 'Failed to delete player');
      }
    } catch (error) {
      console.error('Error deleting player:', error);
      showMessage('error', 'Failed to delete player');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', tag: '', mainCharacter: '', secondaryCharacter: '' });
    setEditingPlayer(null);
    setFormErrors({});
    setSubmitting(false);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 1400) return 'text-purple-600 dark:text-purple-400 font-bold';
    if (rating >= 1200) return 'text-blue-600 dark:text-blue-400 font-semibold';
    if (rating >= 1000) return 'text-green-600 dark:text-green-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getWinRate = (wins: number, losses: number) => {
    const total = wins + losses;
    if (total === 0) return '0.0%';
    return ((wins / total) * 100).toFixed(1) + '%';
  };

  const formatDate = (date?: Date) => {
    if (!date) return 'Unknown';
    return new Date(date).toLocaleDateString();
  };

  const getLevelBadge = (level: number) => {
    if (level <= 5) {
      return <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-full text-xs">Beginner</span>;
    } else if (level <= 10) {
      return <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 rounded-full text-xs">Intermediate</span>;
    } else if (level <= 15) {
      return <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 rounded-full text-xs">Advanced</span>;
    } else {
      return <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300 rounded-full text-xs">Pro</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
                Players Management
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Manage badminton players, view rankings, and track statistics
              </p>
            </div>
            <div className="flex items-center space-x-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  isElectron
                    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300'
                    : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300'
                }`}>
                  <div className={`w-2 h-2 rounded-full mr-2 ${isElectron ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                  {isElectron ? 'Connected' : 'Demo Mode'}
                </span>
              <Link
                href="/"
                className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                ← Home
              </Link>
            </div>
          </div>
        </div>

        {/* Toast Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg border ${
            message.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/50 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
              : 'bg-red-50 dark:bg-red-900/50 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
          }`}>
            <div className="flex">
              <div className={`w-5 h-5 rounded-full mr-2 mt-0.5 flex items-center justify-center ${
                message.type === 'success' ? 'bg-green-500' : 'bg-red-500'
              }`}>
                <span className="text-white text-xs font-bold">
                  {message.type === 'success' ? '✓' : '!'}
                </span>
              </div>
              {message.text}
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Add/Edit Player Form */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                {editingPlayer ? 'Edit Player' : 'Add New Player'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Player Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                      formErrors.name 
                        ? 'border-red-300 dark:border-red-600' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Enter player name"
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tag/Nickname
                  </label>
                  <input
                    type="text"
                    name="tag"
                    value={formData.tag}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Optional tag"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Preferred Style
                  </label>
                  <select
                    name="mainCharacter"
                    value={formData.mainCharacter}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select style</option>
                    <option value="Singles">Singles</option>
                    <option value="Doubles">Doubles</option>
                    <option value="Mixed">Mixed Doubles</option>
                    <option value="All-rounder">All-rounder</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Secondary Style
                  </label>
                  <select
                    name="secondaryCharacter"
                    value={formData.secondaryCharacter}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select secondary</option>
                    <option value="Singles">Singles</option>
                    <option value="Doubles">Doubles</option>
                    <option value="Mixed">Mixed Doubles</option>
                  </select>
                </div>

                <div className="flex space-x-2 pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    {submitting ? 'Saving...' : (editingPlayer ? 'Update Player' : 'Add Player')}
                  </button>
                  {editingPlayer && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Players Table */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
              {/* Search and controls */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                    All Players ({filteredAndSortedPlayers.length})
                  </h2>
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search players..."
                        className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <button
                      onClick={loadPlayers}
                      className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                    >
                      Refresh
                    </button>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-300">Loading players...</p>
                  </div>
                ) : filteredAndSortedPlayers.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-gray-600 dark:text-gray-300 text-lg mb-2">No players found</p>
                    <p className="text-gray-500 dark:text-gray-400">
                      {searchQuery ? 'Try adjusting your search' : 'Add your first player to get started!'}
                    </p>
                  </div>
                ) : (
                  <table className="min-w-full bg-white dark:bg-gray-800">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th 
                          onClick={() => handleSort('name')}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                        >
                          Player {getSortIcon('name')}
                        </th>
                        <th 
                          onClick={() => handleSort('rating')}
                          className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                        >
                          Rating {getSortIcon('rating')}
                        </th>
                        <th 
                          onClick={() => handleSort('level')}
                          className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                        >
                          Level {getSortIcon('level')}
                        </th>
                        <th 
                          onClick={() => handleSort('wins')}
                          className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                        >
                          Record {getSortIcon('wins')}
                        </th>
                        <th 
                          onClick={() => handleSort('createdAt')}
                          className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                        >
                          Joined {getSortIcon('createdAt')}
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredAndSortedPlayers.map((player, index) => (
                        <tr 
                          key={player.id} 
                          className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                            index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'
                          }`}
                        >
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {player.name}
                              </div>
                              {player.tag && (
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  @{player.tag}
                                </div>
                              )}
                              {player.mainCharacter && (
                                <div className="text-xs text-gray-400 dark:text-gray-500">
                                  {player.mainCharacter}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className={`text-lg font-semibold ${getRatingColor(player.rating)}`}>
                              {player.rating}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex flex-col items-center">
                              <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                                {player.level}
                              </div>
                              {getLevelBadge(player.level)}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="text-sm">
                              <div className="text-green-600 dark:text-green-400 font-medium">
                                {player.wins}W
                              </div>
                              <div className="text-red-600 dark:text-red-400 font-medium">
                                {player.losses}L
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {getWinRate(player.wins, player.losses)}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center text-sm text-gray-600 dark:text-gray-300">
                            {formatDate(player.createdAt)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex justify-center space-x-2">
                              <button
                                onClick={() => handleEditPlayer(player)}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => setShowDeleteConfirm(player)}
                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Confirm Delete
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Are you sure you want to delete <strong>{showDeleteConfirm.name}</strong>? 
                This action cannot be undone and will remove all associated match history.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => handleDeletePlayer(showDeleteConfirm)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Delete Player
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}