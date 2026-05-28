'use client';

import React from 'react';
import { ShieldCheck, Flame, Skull, HelpCircle } from 'lucide-react';

interface TrustScoreDialProps {
  score: number;
}

export const TrustScoreDial: React.FC<TrustScoreDialProps> = ({ score }) => {
  // Ensure score is within bounds
  const clampedScore = Math.max(0, Math.min(100, score));
  
  // Circle math
  const radius = 60;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  // Humor status rating
  let statusText = 'Unknown';
  let statusColor = 'text-slate-400';
  let Icon = HelpCircle;

  if (clampedScore >= 90) {
    statusText = '😌 Highly Trustworthy';
    statusColor = 'text-cyber-lime';
    Icon = ShieldCheck;
  } else if (clampedScore >= 70) {
    statusText = '⚡ Spicy but Honest';
    statusColor = 'text-amber-400';
    Icon = ShieldCheck;
  } else if (clampedScore >= 40) {
    statusText = '🫣 Highly Suspect';
    statusColor = 'text-orange-400';
    Icon = Flame;
  } else {
    statusText = '🤥 Certified Liar';
    statusColor = 'text-red-500';
    Icon = Skull;
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 rounded-2xl glass-panel relative overflow-hidden cyber-glow transition-all duration-300">
      
      {/* Background neon effect */}
      <div className="absolute -top-12 -left-12 h-24 w-24 rounded-full bg-cyber-lime/5 blur-xl pointer-events-none" />

      {/* SVG Circle Gauge */}
      <div className="relative flex items-center justify-center h-44 w-44">
        <svg className="h-full w-full transform -rotate-90">
          {/* Base track */}
          <circle
            cx="88"
            cy="88"
            r={radius}
            stroke="rgba(255,255,255,0.03)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Active progress */}
          <circle
            cx="88"
            cy="88"
            r={radius}
            stroke="#d4ff00"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
            style={{
              filter: 'drop-shadow(0 0 6px rgba(212, 255, 0, 0.6))',
            }}
          />
        </svg>

        {/* Center label */}
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-4xl font-extrabold tracking-tighter text-white">
            {clampedScore}%
          </span>
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
            Trust Rating
          </span>
        </div>
      </div>

      {/* Trust Rating Description */}
      <div className="mt-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/60 border border-white/5">
        <Icon className={`h-4 w-4 ${statusColor}`} />
        <span className={`text-xs font-black tracking-wide ${statusColor}`}>
          {statusText}
        </span>
      </div>
    </div>
  );
};
