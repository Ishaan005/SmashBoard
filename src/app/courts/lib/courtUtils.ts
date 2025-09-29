import type { Player, Court, QueueEntry } from '../components/types';

export function getSkillLevelColor(skillLevel: string) {
  switch (skillLevel) {
    case 'Beginner': return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
    case 'Intermediate': return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100';
    case 'Advanced': return 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100';
    case 'Expert': return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
  }
}

export function getSkillLevelFromRating(rating: number) {
  if (rating < 1000) return 'Beginner';
  if (rating < 1400) return 'Intermediate';
  if (rating < 1800) return 'Advanced';
  return 'Expert';
}

export function formatMatchDuration(startTime: string, currentTime: Date) {
  const start = new Date(startTime);
  const diffMs = currentTime.getTime() - start.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);
  if (diffMins < 1) {
    return `${Math.max(0, diffSecs)}s`;
  } else {
    return `${Math.max(0, diffMins)}m ${diffSecs}s`;
  }
}

export function generateWhatsAppMessage(courts: Court[], queue: QueueEntry[], matchType: 'singles' | 'doubles', currentTime: Date) {
  const courtStatus = courts
    .filter(court => court.isActive)
    .map(court => {
      const duration = court.currentMatch ? formatMatchDuration(court.currentMatch.startTime, currentTime) : '0s';
      if (court.currentMatch?.matchType === 'doubles') {
        return `${court.name}: ${court.currentMatch.player1.name} & ${court.currentMatch.player3?.name} vs ${court.currentMatch.player2.name} & ${court.currentMatch.player4?.name} (${duration}) - Doubles`;
      } else {
        return `${court.name}: ${court.currentMatch?.player1.name} vs ${court.currentMatch?.player2.name} (${duration}) - Singles`;
      }
    })
    .join('\n');

  const queueStatus = queue.length > 0 
    ? `\nQueue (${queue.length}): ${queue.map(entry => entry.player.name).join(', ')}`
    : '\nQueue: Empty';

  const message = `🏸 SmashBoard Court Status\n\n${courtStatus || 'All courts available'}${queueStatus}\n\nMode: ${matchType === 'doubles' ? 'Doubles (2v2)' : 'Singles (1v1)'}`;
  return message;
}

export function suggestOpponent(player: Player, players: Player[], queue: QueueEntry[], courts: Court[]) {
  const similarPlayers = players
    .filter(p => p.id !== player.id)
    .filter(p => Math.abs(p.rating - player.rating) <= 200)
    .filter(p => !queue.find(entry => entry.player.id === p.id))
    .filter(p => !courts.some(court => 
      court.currentMatch?.player1.id === p.id || court.currentMatch?.player2.id === p.id
    ))
    .sort((a, b) => Math.abs(a.rating - player.rating) - Math.abs(b.rating - player.rating));
  return similarPlayers.slice(0, 3);
}
