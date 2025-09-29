 'use client';
import { useEffect, useState, useCallback } from 'react';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import type { Player, Court, QueueEntry, DragData } from '../components/types';

type CourtsDebugState = {
  lastPlayerLoad?: {
    timestamp: string;
    count?: number;
    error?: string;
    source: 'electron' | 'fallback';
  };
  status?: {
    loading: boolean;
    playerCount: number;
    attempts: number;
    lastError: string | null;
    fallbackTriggered: boolean;
    lastUpdated: string;
  };
};

declare global {
  interface Window {
    __SMASHBOARD_DEBUG__?: CourtsDebugState;
  }
}

const mergeDebugState = (patch: Partial<CourtsDebugState>) => {
  if (typeof window === 'undefined' || !patch) {
    return;
  }

  const prevState = window.__SMASHBOARD_DEBUG__ ?? {};
  window.__SMASHBOARD_DEBUG__ = {
    ...prevState,
    ...patch,
  };
};

export function useCourtsManager(numCourtsDefault = 4, matchTypeDefault: 'singles' | 'doubles' = 'doubles') {
  const isElectronEnvironment = typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('electron');

  // State
  const [players, setPlayers] = useState<Player[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [numCourts, setNumCourts] = useState(numCourtsDefault);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [matchType, setMatchType] = useState<'singles' | 'doubles'>(matchTypeDefault);
  const [loadInfo, setLoadInfo] = useState({
    attempts: 0,
    lastStarted: null as string | null,
    lastFinished: null as string | null,
    lastCount: null as number | null,
    lastError: null as string | null,
    fromElectron: false,
    fallbackTriggered: false,
  });

  // Effects
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const savedCourts = localStorage.getItem('smashboard-courts');
    const savedQueue = localStorage.getItem('smashboard-queue');
    if (savedCourts) {
      try {
        setCourts(JSON.parse(savedCourts));
      } catch {}
    }
    if (savedQueue) {
      try {
        setQueue(JSON.parse(savedQueue));
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (courts.length > 0) {
      localStorage.setItem('smashboard-courts', JSON.stringify(courts));
    }
  }, [courts]);

  useEffect(() => {
    localStorage.setItem('smashboard-queue', JSON.stringify(queue));
  }, [queue]);

  useEffect(() => {
    mergeDebugState({
      status: {
        loading,
        playerCount: players.length,
        attempts: loadInfo.attempts,
        lastError: loadInfo.lastError,
        fallbackTriggered: loadInfo.fallbackTriggered,
        lastUpdated: new Date().toISOString(),
      }
    });
  }, [loading, players.length, loadInfo.attempts, loadInfo.lastError, loadInfo.fallbackTriggered]);

  useEffect(() => {
    const savedCourts = localStorage.getItem('smashboard-courts');
    if (!savedCourts) {
      const initialCourts: Court[] = [];
      for (let i = 1; i <= numCourts; i++) {
        initialCourts.push({
          id: i,
          name: `Court ${i}`,
          isActive: false,
          matchType: 'doubles',
          currentPlayers: [],
        });
      }
      setCourts(initialCourts);
    } else {
      setCourts(prev => {
        const currentCourts = [...prev];
        while (currentCourts.length < numCourts) {
          currentCourts.push({
            id: currentCourts.length + 1,
            name: `Court ${currentCourts.length + 1}`,
            isActive: false,
            matchType: 'doubles',
            currentPlayers: [],
          });
        }
        if (currentCourts.length > numCourts) {
          return currentCourts.slice(0, numCourts);
        }
        return currentCourts;
      });
    }
  }, [numCourts]);

  const loadPlayers = useCallback(async () => {
    if (typeof window === 'undefined' || !window.electronAPI) {
      return;
    }

    try {
      setLoading(true);
      setLoadInfo(prev => ({
        ...prev,
        attempts: prev.attempts + 1,
        lastStarted: new Date().toISOString(),
        lastError: null,
        fromElectron: true,
      }));
      const playersData = await window.electronAPI.db.getPlayers();
      const playersWithElo = playersData.map((player: Player & { rating: number }) => ({
        ...player,
        elo: player.rating
      }));
      setPlayers(playersWithElo);
      setError(null);
      setLoadInfo(prev => ({
        ...prev,
        lastFinished: new Date().toISOString(),
        lastCount: playersWithElo.length,
      }));
      console.info('[Courts] Loaded players', playersWithElo.length);
      mergeDebugState({
        lastPlayerLoad: {
          timestamp: new Date().toISOString(),
          count: playersWithElo.length,
          source: 'electron',
        }
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[Courts] Failed to load players', err);
      setError(`Failed to load players: ${message}`);
      setLoadInfo(prev => ({
        ...prev,
        lastFinished: new Date().toISOString(),
        lastError: message,
      }));
      mergeDebugState({
        lastPlayerLoad: {
          timestamp: new Date().toISOString(),
          error: message,
          source: 'electron',
        }
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    let cancelled = false;
    let hasLoadedFromElectron = false;
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleFallback = () => {
      if (isElectronEnvironment || fallbackTimer !== null) {
        return;
      }
      fallbackTimer = setTimeout(() => {
        if (cancelled || hasLoadedFromElectron) {
          return;
        }
        setLoading(false);
        setLoadInfo(prev => ({
          ...prev,
          fallbackTriggered: true,
          lastFinished: new Date().toISOString(),
        }));
      }, 1500);
    };

    const attemptLoad = () => {
      if (cancelled || hasLoadedFromElectron) {
        return;
      }

      if (window.electronAPI) {
        hasLoadedFromElectron = true;
        if (fallbackTimer !== null) {
          clearTimeout(fallbackTimer);
          fallbackTimer = null;
        }
        loadPlayers().catch(() => {});
        return;
      }

      scheduleFallback();
      setTimeout(attemptLoad, isElectronEnvironment ? 250 : 200);
    };

    attemptLoad();

    return () => {
      cancelled = true;
      if (fallbackTimer !== null) {
        clearTimeout(fallbackTimer);
      }
    };
  }, [isElectronEnvironment, loadPlayers]);

  // Handlers

  // Drag and Drop functionality
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    console.log('Drag started:', active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeData = active.data.current as DragData | undefined;
    const overId = String(over.id);
    if (!activeData || !activeData.player) return;
    if (overId.startsWith('court-')) {
      const courtNumber = parseInt(overId.replace('court-', ''));
      const court = courts.find(c => c.id === courtNumber);
      if (!court || court.isActive) return;
      const currentPlayers = court.currentPlayers || [];
      const requiredPlayers = court.matchType === 'doubles' ? 4 : 2;
      if (currentPlayers.length >= requiredPlayers) return;
      const newPlayer = activeData.player;
      if (currentPlayers.some(p => p.id === newPlayer.id)) return;
      const updatedPlayers = [...currentPlayers, newPlayer];
      setCourts(prev => prev.map(c => c.id === courtNumber ? { ...c, currentPlayers: updatedPlayers } : c));
      if (activeData.type === 'queue' && activeData.queueId) {
        setQueue(prev => prev.filter(entry => entry.id !== activeData.queueId));
      }
    }
  };

  const removePlayerFromCourt = (courtId: number, playerId: number) => {
    const court = courts.find(c => c.id === courtId);
    const player = court?.currentPlayers?.find(p => p.id === playerId);
    setCourts(prev => prev.map(court => court.id === courtId ? { ...court, currentPlayers: (court.currentPlayers || []).filter(p => p.id !== playerId) } : court));
    if (player) {
      const newQueueEntry: QueueEntry = { id: Date.now(), player, joinedAt: new Date() };
      setQueue(prev => [...prev, newQueueEntry]);
    }
  };

  const changeCourtMatchType = (courtId: number, matchType: 'singles' | 'doubles') => {
    setCourts(prev => prev.map(court => court.id === courtId ? { ...court, matchType, currentPlayers: matchType === 'singles' ? (court.currentPlayers || []).slice(0, 2) : court.currentPlayers } : court));
  };

  const startCourtMatch = (courtId: number) => {
    const court = courts.find(c => c.id === courtId);
    if (!court || !court.currentPlayers || court.isActive) return;
    const players = court.currentPlayers;
    const requiredPlayers = court.matchType === 'doubles' ? 4 : 2;
    if (players.length !== requiredPlayers) return;
    const match = court.matchType === 'doubles'
      ? { matchType: 'doubles' as const, player1: players[0], player2: players[2] || players[1], player3: players[1], player4: players[3] || players[2], startTime: new Date().toISOString() }
      : { matchType: 'singles' as const, player1: players[0], player2: players[1], startTime: new Date().toISOString() };
    setCourts(prev => prev.map(court => court.id === courtId ? { ...court, isActive: true, currentMatch: match, currentPlayers: [] } : court));
  };

  const endCourtMatch = (courtId: number) => {
    setCourts(prev => prev.map(court => court.id === courtId ? { ...court, isActive: false, currentMatch: undefined } : court));
  };

  const handleMatchComplete = async (courtId: number, player1Score: number, player2Score: number) => {
    const court = courts.find(c => c.id === courtId);
    if (!court?.currentMatch) return;
    const match = court.currentMatch;
    try {
      if (typeof window !== 'undefined' && window.electronAPI) {
        if (match.matchType === 'singles') {
          // Singles match
          const player1 = match.player1;
          const player2 = match.player2;
          await window.electronAPI.db.recordMatch(player1.id!, player2.id!, player1Score, player2Score);
        } else if (match.matchType === 'doubles') {
          // Doubles match
          const player1 = match.player1;
          const player2 = match.player2;
          const player3 = match.player3;
          const player4 = match.player4;
          // Only proceed if all players are defined
          if (player1 && player2 && player3 && player4) {
            // Assume player1/player3 are Team A, player2/player4 are Team B
            await window.electronAPI.db.recordDoublesMatch(
              player1.id!, player3.id!, player2.id!, player4.id!, player1Score, player2Score
            );
          } else {
            setError('Doubles match requires four players.');
          }
        }
        await loadPlayers();
      }
    } catch (err) {
      console.error('Failed to save match:', err);
      setError('Failed to save match');
    }
    setCourts(prev => prev.map(court => court.id === courtId ? { ...court, isActive: false, currentMatch: undefined } : court));
  };

  const addToQueue = (playerId: number) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return;
    const newQueueEntry: QueueEntry = { id: Date.now(), player, joinedAt: new Date() };
    setQueue(prev => [...prev, newQueueEntry]);
  };

  const removeFromQueue = (queueEntryId: number) => {
    setQueue(prev => prev.filter(entry => entry.id !== queueEntryId));
  };

  const handleAutoAllocation = (allocations: Array<{ courtId: number; players: Player[] }>) => {
    setCourts(prev => prev.map(court => {
      const allocation = allocations.find(alloc => alloc.courtId === court.id);
      if (allocation) {
        return { ...court, currentPlayers: allocation.players, matchType: allocation.players.length === 2 ? 'singles' : 'doubles' };
      }
      return court;
    }));
    const allocatedPlayerIds = allocations.flatMap(alloc => alloc.players.map(player => player.id));
    setQueue(prev => prev.filter(entry => !allocatedPlayerIds.includes(entry.player.id)));
  };

  const clearAllCourts = () => {
    setCourts(prev => prev.map(court => ({ ...court, isActive: false, currentMatch: undefined })));
    setQueue([]);
  };

  const resetCourtSystem = () => {
    if (confirm('Are you sure you want to reset all courts and queue? This action cannot be undone.')) {
      localStorage.removeItem('smashboard-courts');
      localStorage.removeItem('smashboard-queue');
      const initialCourts: Court[] = [];
      for (let i = 1; i <= numCourts; i++) {
        initialCourts.push({ id: i, name: `Court ${i}`, isActive: false, matchType: 'doubles', currentPlayers: [] });
      }
      setCourts(initialCourts);
      setQueue([]);
    }
  };

  return {
    players,
    setPlayers,
    courts,
    setCourts,
    queue,
    setQueue,
    numCourts,
    setNumCourts,
    loading,
    setLoading,
    error,
    setError,
    currentTime,
    setCurrentTime,
    matchType,
    setMatchType,
    loadPlayers,
  loadInfo,
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
  };
}
