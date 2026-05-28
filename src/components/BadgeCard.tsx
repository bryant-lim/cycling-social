'use client';

import React from 'react';
import { Lock, Award } from 'lucide-react';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface BadgeCardProps {
  badge: Badge;
  isEarned: boolean;
  earnedAt?: string;
}

export const BadgeCard: React.FC<BadgeCardProps> = ({ badge, isEarned, earnedAt }) => {
  return (
    <div
      className={`relative flex flex-col items-center justify-between p-5 rounded-2xl border transition-all duration-300 ${
        isEarned
          ? 'bg-slate-900/90 border-cyber-lime/30 hover:border-cyber-lime/60 shadow-xl cyber-glow-hover hover:scale-[1.02]'
          : 'bg-slate-900/40 border-white/5 opacity-50 grayscale select-none'
      }`}
    >
      {/* Icon/Emoji */}
      <div
        className={`flex h-16 w-16 items-center justify-center rounded-2xl text-4xl mb-3 transition-transform duration-500 ${
          isEarned ? 'bg-cyber-lime/10 animate-bounce-slow' : 'bg-slate-800'
        }`}
      >
        {badge.icon}
      </div>

      {/* Title & Info */}
      <div className="text-center flex-1">
        <h4 className="font-extrabold text-sm text-white tracking-tight flex items-center justify-center gap-1">
          {badge.name}
          {isEarned && (
            <span title="Earned Badge">
              <Award className="h-3.5 w-3.5 text-cyber-lime stroke-[2.5]" />
            </span>
          )}
        </h4>
        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed max-w-[150px] mx-auto">
          {badge.description}
        </p>
      </div>

      {/* Status indicator */}
      <div className="mt-4 w-full pt-3 border-t border-white/5 flex justify-center items-center">
        {isEarned ? (
          <span className="text-[9px] uppercase font-black tracking-widest text-cyber-lime">
            {earnedAt ? `Unlocked ${new Date(earnedAt).toLocaleDateString()}` : 'Unlocked'}
          </span>
        ) : (
          <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 flex items-center gap-1">
            <Lock className="h-2.5 w-2.5" />
            Locked
          </span>
        )}
      </div>
    </div>
  );
};
