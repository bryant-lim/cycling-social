'use client';

import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { Download, Share2, Bike, Award, X, AlertTriangle } from 'lucide-react';

interface ShareCardProps {
  username: string;
  trustScore: number;
  totalRides: number;
  liesCount: number;
  selectedRide?: {
    ride_title: string;
    intended_intensity: 'chill' | 'tempo' | 'hard' | 'race';
    actual_intensity: 'chill' | 'spicy' | 'attacked' | 'lied' | null;
    notes?: string;
    summary?: string;
    result_type?: string | null;
    created_at: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareCard: React.FC<ShareCardProps> = ({
  username,
  trustScore,
  totalRides,
  liesCount,
  selectedRide,
  isOpen,
  onClose,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setExporting(true);
    setExportError(null);

    try {
      // Force a slight delay to ensure fonts and assets are rendered
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        width: 360 * 2,
        height: 640 * 2,
        style: {
          transform: 'scale(2)',
          transformOrigin: 'top left',
          width: '360px',
          height: '640px',
        },
      });

      const link = document.createElement('a');
      link.download = `domestique-index-${username.toLowerCase()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Image export failed:', error);
      setExportError('Export failed. Please try again or take a screenshot!');
    } finally {
      setExporting(false);
    }
  };

  // Fun meme generator quotes
  const getLiesMeme = () => {
    if (liesCount === 0) return 'Has never told a recovery spin lie. A absolute saint.';
    if (trustScore < 30) return `Declared ${totalRides} recovery spins. Survived 0 of them.`;
    if (trustScore < 60) return 'Claims Zone 2 recovery but HR was clearly in Zone 5.';
    return 'Mostly honest, but light sprints at red lights remain common.';
  };

  const getBadgeDetails = (resultType?: string | null) => {
    switch (resultType) {
      case 'trustworthy':
        return { name: 'Trustworthy Cyclist 😌', desc: 'Declared chill and stayed chill.', icon: '😌' };
      case 'liar':
        return { name: 'Certified Liar 🤥', desc: 'Declared chill but went full gas.', icon: '🤥' };
      case 'zone2_criminal':
        return { name: 'Zone 2 Criminal 🚓', desc: 'Claimed recovery but suffered in Zone 5.', icon: '🚓' };
      case 'assassin':
        return { name: 'Coffee Ride Assassin 🥷', desc: 'Claimed coffee ride but did 100km+.', icon: '🥷' };
      case 'chaos':
        return { name: 'Chaos Rider 🌀', desc: 'Highly erratic ride declarations.', icon: '🌀' };
      case 'sandbagger':
        return { name: 'Sandbagger 🎒', desc: 'Declared hard but took it easy.', icon: '🎒' };
      default:
        return { name: 'Honest Domestique 🚴', desc: 'Stayed within intensity targets.', icon: '🚴' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
      
      {/* Modal Container */}
      <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white rounded-full p-1.5 bg-slate-800 hover:bg-slate-700 cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header Title */}
        <div className="mb-4">
          <h3 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-1.5">
            <Share2 className="h-5 w-5 text-cyber-lime" />
            Generate Share Card
          </h3>
          <p className="text-xs text-slate-400">
            Share your Domestique Index stats directly on Instagram Stories, Threads, or X.
          </p>
        </div>

        {/* Scrollable container for preview */}
        <div className="flex flex-col items-center justify-center overflow-y-auto max-h-[60vh] py-2">
          
          {/* THE EXPORTABLE CARD CONTAINER (9:16 Aspect Ratio) */}
          <div className="border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <div
              ref={cardRef}
              className="relative flex flex-col justify-between p-8 bg-slate-950 text-white select-none"
              style={{
                width: '360px',
                height: '640px', // Scaling down for preview display
                backgroundImage: 'radial-gradient(circle at 50% -10%, rgba(212, 255, 0, 0.15) 0%, transparent 70%)',
              }}
            >
              {selectedRide ? (
                /* ================= SPECIFIC RIDE SHAME CARD ================= */
                <div className="flex flex-col justify-between h-full">
                  {/* Card Watermark/Header */}
                  <div className="flex flex-col items-center justify-center gap-2 border-b border-white/5 pb-4">
                    <div className="flex items-center gap-1.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 border border-white/10 p-0.5 overflow-hidden">
                        <img src="/logo.png" alt="Domestique Index Logo" className="h-full w-full object-contain" />
                      </div>
                      <span className="font-extrabold text-sm tracking-tight text-white">
                        DOMESTIQUE<span className="text-cyber-lime">INDEX</span>
                      </span>
                    </div>
                    <span className="text-[9px] uppercase font-black tracking-widest text-red-400 bg-red-950/20 px-2 py-0.5 rounded border border-red-500/20">
                      RIDE CONFESSION
                    </span>
                  </div>

                  {/* Ride Details Header */}
                  <div className="my-2 text-center">
                    <p className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest">
                      {new Date(selectedRide.created_at).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    <h2 className="text-xl font-black text-white mt-1 tracking-tight">
                      "{selectedRide.ride_title}"
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Rider: <span className="text-white font-extrabold">{username}</span> ({trustScore}% Trust)
                    </p>
                  </div>

                  {/* Intention vs Reality Grid */}
                  <div className="space-y-3 my-2">
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-white/5 text-center">
                      <p className="text-[9px] uppercase font-black text-slate-400 tracking-wider">The Intention</p>
                      <p className="text-sm font-extrabold text-white mt-1 whitespace-nowrap">
                        {selectedRide.intended_intensity === 'chill' ? '😌 Chill Ride' : selectedRide.intended_intensity === 'tempo' ? '⚡ Tempo Ride' : selectedRide.intended_intensity === 'hard' ? '💀 Hard Ride' : '☠️ Race Simulation'}
                      </p>
                      {selectedRide.notes && (
                        <p className="text-xs text-slate-400 italic mt-1 font-medium break-words">"{selectedRide.notes}"</p>
                      )}
                    </div>

                    <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-500/20 text-center">
                      <p className="text-[9px] uppercase font-black text-red-400 tracking-wider">The Reality</p>
                      <p className="text-sm font-extrabold text-white mt-1 whitespace-nowrap">
                        {selectedRide.actual_intensity === 'chill' ? '😌 Stayed Chill' : selectedRide.actual_intensity === 'spicy' ? '⚡ Got Spicy' : selectedRide.actual_intensity === 'attacked' ? '💀 Everyone Attacked' : '☠️ I Lied'}
                      </p>
                      {selectedRide.summary && (
                        <p className="text-xs text-red-400 italic mt-1 font-medium break-words">"{selectedRide.summary}"</p>
                      )}
                    </div>
                  </div>

                  {/* Earned Badge for this ride */}
                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/5 text-center flex flex-col items-center justify-center">
                    <p className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Audit Rating</p>
                    <div className="flex flex-col items-center gap-1.5 mt-2">
                      <span className="text-3xl">{getBadgeDetails(selectedRide.result_type).icon}</span>
                      <div className="text-center">
                        <p className="text-xs font-black text-cyber-lime leading-tight">{getBadgeDetails(selectedRide.result_type).name}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5 leading-tight">{getBadgeDetails(selectedRide.result_type).desc}</p>
                      </div>
                    </div>
                  </div>


                </div>
              ) : (
                /* ================= GENERAL PROFILE SUMMARY CARD ================= */
                <div className="flex flex-col justify-between h-full">
                  {/* Card Watermark/Header */}
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 border border-white/10 p-0.5 overflow-hidden">
                        <img src="/logo.png" alt="Domestique Index Logo" className="h-full w-full object-contain" />
                      </div>
                      <span className="font-extrabold text-sm tracking-tight text-white">
                        DOMESTIQUE<span className="text-cyber-lime">INDEX</span>
                      </span>
                    </div>
                    <span className="text-[9px] uppercase font-black tracking-widest text-cyber-lime bg-cyber-lime/10 px-2 py-0.5 rounded border border-cyber-lime/20">
                      SHAME CARD
                    </span>
                  </div>

                  {/* Central Stats Dial area */}
                  <div className="flex flex-col items-center justify-center my-6">
                    <div className="relative flex items-center justify-center h-40 w-40">
                      {/* Glowing background ring */}
                      <div
                        className={`absolute inset-0 rounded-full animate-pulse-slow ${
                          trustScore < 40 ? 'bg-red-500/5' : 'bg-cyber-lime/5'
                        }`}
                      />
                      <svg className="h-full w-full transform -rotate-90 absolute inset-0">
                        {/* Base track */}
                        <circle
                          cx="80"
                          cy="80"
                          r="60"
                          stroke="rgba(255,255,255,0.03)"
                          strokeWidth="10"
                          fill="transparent"
                        />
                        {/* Active progress */}
                        <circle
                          cx="80"
                          cy="80"
                          r="60"
                          stroke="#d4ff00"
                          strokeWidth="10"
                          strokeDasharray={2 * Math.PI * 60}
                          strokeDashoffset={2 * Math.PI * 60 - (trustScore / 100) * (2 * Math.PI * 60)}
                          strokeLinecap="round"
                          fill="transparent"
                          style={{
                            filter: 'drop-shadow(0 0 6px rgba(212, 255, 0, 0.6))',
                          }}
                        />
                      </svg>
                      <div className="text-center z-10">
                        <span className="text-5xl font-black tracking-tighter text-white">
                          {trustScore}%
                        </span>
                        <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mt-0.5">
                          Trust Rating
                        </p>
                      </div>
                    </div>

                    <h2 className="text-2xl font-black text-white mt-5 tracking-tight text-center">
                      {username}
                    </h2>
                    
                    <div className="mt-2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-white/10 flex-nowrap whitespace-nowrap">
                      <Award className="h-3.5 w-3.5 text-cyber-lime flex-shrink-0" />
                      <span className="text-xs font-black tracking-wide text-cyber-lime whitespace-nowrap">
                        {trustScore < 40 ? '🤥 Serial Liar' : trustScore < 70 ? '🫣 Suspect' : '😌 Honest Rider'}
                      </span>
                    </div>
                  </div>

                  {/* Ride breakdown section */}
                  <div className="space-y-4">
                    <div className="rounded-2xl bg-slate-900/80 p-4 border border-white/5 text-center">
                      <p className="text-[11px] uppercase font-black tracking-widest text-slate-400">
                        Lie Statistics
                      </p>
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <div className="border-r border-white/5">
                          <p className="text-2xl font-black text-white">{totalRides}</p>
                          <p className="text-[9px] font-bold text-slate-400">Total Rides</p>
                        </div>
                        <div>
                          <p className="text-2xl font-black text-red-400">{liesCount}</p>
                          <p className="text-[9px] font-bold text-slate-400">Lies Logged</p>
                        </div>
                      </div>
                    </div>

                    {/* Meme Callout */}
                    <div className="p-4 rounded-2xl bg-red-950/20 border border-red-500/20 text-center">
                      <p className="text-xs text-red-400 font-extrabold leading-relaxed">
                        "{getLiesMeme()}"
                      </p>
                    </div>
                  </div>


                </div>
              )}
            </div>
          </div>

          {exportError && (
            <div className="mt-3 flex items-center gap-1 text-red-400 text-xs">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>{exportError}</span>
            </div>
          )}

        </div>

        {/* Footer actions */}
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-sm font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
          >
            Cancel
          </button>
          
          <button
            onClick={handleDownload}
            disabled={exporting}
            className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-extrabold text-dark-bg bg-cyber-lime hover:bg-cyber-lime-hover disabled:bg-slate-800 disabled:text-slate-500 rounded-xl transition-all cursor-pointer shadow-lg cyber-glow"
          >
            <Download className="h-4 w-4" />
            {exporting ? 'Exporting...' : 'Download Image'}
          </button>
        </div>

      </div>
    </div>
  );
};
