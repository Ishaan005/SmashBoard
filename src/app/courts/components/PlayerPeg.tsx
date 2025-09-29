import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Player, DragData } from './types';

interface PlayerPegProps {
  player: Player;
  isDragging?: boolean;
  dragData: DragData;
  showRemove?: boolean;
  onRemove?: () => void;
  position?: number;
  isInCourt?: boolean;
  context?: string;
}

export default function PlayerPeg({ player, isDragging, dragData, showRemove, onRemove, position, isInCourt, context }: PlayerPegProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: context ? `${context}-${dragData.type}-${player.id}` : `${dragData.type}-${player.id}`,
    data: dragData,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

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

  return (
    <div
      ref={setNodeRef}
      style={style as React.CSSProperties}
      className={
        `relative bg-white dark:bg-gray-700 rounded-lg shadow-md p-3 cursor-grab
        ${isDragging ? 'opacity-50 scale-105 rotate-2' : ''}
        ${isInCourt ? 'border-2 border-blue-400' : 'border border-gray-200 dark:border-gray-600'}
        hover:shadow-lg transition-all duration-200
        ${position !== undefined ? 'mb-2' : ''}`
      }
    >
      {position !== undefined && (
        <div className="absolute -top-2 -left-2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
          {position}
        </div>
      )}

      <div
        {...attributes}
        {...listeners}
        className="flex-1 min-w-0"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 dark:text-white truncate">
              {player.name}
            </div>
            <div className="flex items-center space-x-1 mt-1">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSkillLevelColor(getSkillLevelFromRating(player.rating))}`}>
                {getSkillLevelFromRating(player.rating)}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {player.rating}
              </span>
              {player.elo && player.elo !== player.rating && (
                <span className="text-xs text-blue-500 dark:text-blue-400">
                  ELO: {Math.round(player.elo)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {showRemove && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onRemove();
          }}
          className="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold transition-colors shadow-md"
          title={isInCourt ? "Remove from court (back to queue)" : "Remove from queue (back to available players)"}
        >
          ✕
        </button>
      )}
    </div>
  );
}
