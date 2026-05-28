'use client';

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { isDemoMode } from '../lib/supabaseClient';
import { LogIn, LogOut, ShieldCheck, Zap, Bike } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, profile, signInWithGoogle, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-dark-border glass-panel">
      <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Branding Logo */}
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 border border-white/10 p-1 overflow-hidden">
            <img src="/logo.png" alt="Domestique Index Logo" className="h-full w-full object-contain" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-white">
              DOMESTIQUE<span className="text-cyber-lime">INDEX</span>
            </span>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-4">

          {user ? (
            <div className="flex items-center gap-3">
              {/* Profile Card */}
              <div className="flex items-center gap-2.5 rounded-xl bg-slate-900/80 px-3 py-1.5 border border-white/5">
                <img
                  src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${profile?.username || 'cyclist'}`}
                  alt="avatar"
                  className="h-8 w-8 rounded-lg bg-slate-800 border border-white/10"
                />
                <div className="hidden md:block text-left">
                  <p className="text-xs font-bold text-slate-200">
                    {profile?.username || 'Rider'}
                  </p>
                  <p className="text-[10px] text-cyber-lime font-extrabold flex items-center gap-0.5">
                    <ShieldCheck className="h-3 w-3 stroke-[2.5]" />
                    {profile?.trust_score ?? 100}% Trust
                  </p>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={signOut}
                className="flex items-center justify-center p-2.5 text-slate-400 hover:text-red-400 rounded-xl hover:bg-red-950/20 border border-transparent hover:border-red-950/50 transition-all cursor-pointer"
                title="Log Out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            /* Login Button */
            <button
              onClick={signInWithGoogle}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-dark-bg bg-cyber-lime hover:bg-cyber-lime-hover rounded-xl shadow-lg cyber-glow hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <LogIn className="h-4 w-4 stroke-[2.5]" />
              Login
            </button>
          )}

        </div>
      </div>
    </header>
  );
};
