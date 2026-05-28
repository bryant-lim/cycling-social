'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase, mockSupabase, isDemoMode } from '../../../lib/supabaseClient';
import { TrustScoreDial } from '../../../components/TrustScoreDial';
import { BadgeCard } from '../../../components/BadgeCard';
import { Bike, ShieldCheck, Flame, Skull, History, Award, AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface UserProfile {
  id: string;
  username: string;
  trust_score: number;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface Ride {
  id: string;
  ride_title: string;
  intended_intensity: 'chill' | 'tempo' | 'hard' | 'race';
  actual_intensity: 'chill' | 'spicy' | 'attacked' | 'lied' | null;
  notes: string;
  summary: string;
  result_type: string;
  created_at: string;
}

export default function PublicProfile() {
  const params = useParams();
  const username = decodeURIComponent(params.username as string);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [rides, setRides] = useState<Ride[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [earnedBadgeIds, setEarnedBadgeIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const client = isDemoMode ? mockSupabase : supabase;

  useEffect(() => {
    const fetchPublicProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch all badges for reference
        const { data: badgesData } = await client.from('badges').select('*');
        if (badgesData) setBadges(badgesData);

        // 2. Fetch user profile by username
        const { data: userProfile, error: profileErr } = await client
          .from('users')
          .select('*')
          .eq('username', username)
          .single();

        if (profileErr || !userProfile) {
          setError(`Rider "${username}" not found in the Domestique Index database!`);
          return;
        }

        setProfile(userProfile);

        // 3. Fetch user's completed rides
        const { data: ridesData } = await client
          .from('rides')
          .select('*')
          .eq('user_id', userProfile.id)
          .order('created_at', { ascending: false });

        if (ridesData) {
          // Filter to completed/confessed rides only for public viewing
          setRides(ridesData.filter((r: Ride) => r.actual_intensity !== null));
        }

        // 4. Fetch user's earned badges
        const { data: userBadgesData } = await client
          .from('user_badges')
          .select('badge_id')
          .eq('user_id', userProfile.id);

        if (userBadgesData) {
          setEarnedBadgeIds(userBadgesData.map((ub: any) => ub.badge_id));
        }

      } catch (err) {
        console.error('Error fetching public profile:', err);
        setError('Failed to query the database. Try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchPublicProfile();
    }
  }, [username]);

  // Compute stats
  const liesCount = rides.filter(
    (r) => r.result_type && ['liar', 'zone2_criminal', 'assassin'].includes(r.result_type)
  ).length;

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col">
      
      {/* Mini navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-dark-border glass-panel">
        <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 border border-white/10 p-0.5 shadow overflow-hidden">
              <img src="/logo.png" alt="Domestique Index Logo" className="h-full w-full object-contain" />
            </div>
            <span className="font-extrabold text-sm tracking-tight text-white">
              DOMESTIQUE<span className="text-cyber-lime">INDEX</span>
            </span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-extrabold text-cyber-lime border border-cyber-lime/10 hover:border-cyber-lime/30 bg-cyber-lime/5 rounded-xl transition-all"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Dashboard
          </Link>
        </div>
      </header>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <span className="h-10 w-10 border-4 border-cyber-lime border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 font-bold text-xs">Querying Public Lie Indexes...</p>
          </div>
        </div>
      ) : error || !profile ? (
        /* Error Screen */
        <main className="flex-1 flex items-center justify-center p-6 text-center max-w-md mx-auto">
          <div className="space-y-4 rounded-3xl border border-white/5 bg-slate-900/60 p-8 glass-panel relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-red-500" />
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto animate-pulse" />
            <h2 className="text-2xl font-black text-white leading-tight">Cyclist Not Found!</h2>
            <p className="text-slate-400 text-sm">{error || 'This user does not exist.'}</p>
            <Link
              href="/"
              className="mt-6 inline-flex py-3 px-6 text-sm font-extrabold text-dark-bg bg-cyber-lime hover:bg-cyber-lime-hover rounded-xl shadow-lg transition-all"
            >
              Start My Own Domestique Index Log
            </Link>
          </div>
        </main>
      ) : (
        /* Public Profile Stats Layout */
        <main className="flex-1 max-w-7xl w-full mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="text-center md:text-left space-y-2">
            <span className="inline-block text-[10px] uppercase font-black tracking-widest text-cyber-lime bg-cyber-lime/10 px-2 py-0.5 rounded border border-cyber-lime/20">
              Public Lie Audit
            </span>
            <h1 className="text-4xl font-black text-white tracking-tight">
              {profile.username}'s Domestique Index Log
            </h1>
            <p className="text-slate-400 text-sm">
              Auditing transparency metrics and recovery spin credibility for {profile.username}.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Dial & stats */}
            <div className="space-y-6">
              <TrustScoreDial score={profile.trust_score} />

              <div className="p-6 rounded-2xl glass-panel text-center">
                <h3 className="font-extrabold text-xs text-slate-400 uppercase tracking-widest mb-4">
                  Shame Metrics
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <span className="text-3xl font-black text-white">{rides.length}</span>
                    <p className="text-[9px] font-bold text-slate-400 mt-1">Audit Rides</p>
                  </div>
                  <div className="border-x border-white/5">
                    <span className="text-3xl font-black text-red-400">{liesCount}</span>
                    <p className="text-[9px] font-bold text-slate-400 mt-1">Confirmed Lies</p>
                  </div>
                  <div>
                    <span className="text-3xl font-black text-cyber-lime">
                      {rides.length > 0
                        ? Math.round(((rides.length - liesCount) / rides.length) * 100)
                        : 100}%
                    </span>
                    <p className="text-[9px] font-bold text-slate-400 mt-1">Honesty %</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right badges cabinet & completed ride lists */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Badges Locker */}
              <div className="space-y-4">
                <h3 className="font-extrabold text-sm text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-cyber-lime" />
                  Unlocked Badges
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {badges.map((badge) => (
                    <BadgeCard
                      key={badge.id}
                      badge={badge}
                      isEarned={earnedBadgeIds.includes(badge.id)}
                    />
                  ))}
                </div>
              </div>

              {/* Confession History */}
              <div className="space-y-4">
                <h3 className="font-extrabold text-sm text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <History className="h-4 w-4 text-cyber-lime" />
                  Confessed Rides Audit
                </h3>

                {rides.length === 0 ? (
                  <div className="p-8 rounded-2xl glass-panel text-center text-slate-500 font-bold text-xs">
                    {profile.username} has not confessed any rides yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {rides.map((ride) => {
                      let resultLabel = 'Audit';
                      let resultColor = 'bg-slate-900 border-white/5 text-slate-400';
                      
                      if (ride.result_type === 'trustworthy') {
                        resultLabel = '😌 Trustworthy';
                        resultColor = 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400';
                      } else if (ride.result_type === 'liar') {
                        resultLabel = '🤥 Certified Liar';
                        resultColor = 'bg-red-950/20 border-red-500/20 text-red-400';
                      } else if (ride.result_type === 'zone2_criminal') {
                        resultLabel = '🚓 Zone 2 Criminal';
                        resultColor = 'bg-orange-950/20 border-orange-500/20 text-orange-400';
                      } else if (ride.result_type === 'assassin') {
                        resultLabel = '🥷 Coffee Assassin';
                        resultColor = 'bg-red-950/40 border-red-500/30 text-red-400';
                      } else if (ride.result_type === 'sandbagger') {
                        resultLabel = '🎒 Sandbagger';
                        resultColor = 'bg-blue-950/20 border-blue-500/20 text-blue-400';
                      } else {
                        resultLabel = '🌀 Chaos / Neutral';
                        resultColor = 'bg-slate-900 border-white/5 text-slate-400';
                      }

                      return (
                        <div
                          key={ride.id}
                          className="p-5 rounded-2xl border border-white/5 glass-panel flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-white/10 transition-all"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-extrabold text-sm text-white">
                                {ride.ride_title}
                              </h4>
                              <span className="text-[10px] text-slate-500 font-bold">
                                {new Date(ride.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-slate-400">Intended:</span>
                              <span className="bg-slate-800 text-slate-200 px-1.5 py-0.5 rounded font-black border border-white/5">
                                {ride.intended_intensity === 'chill' ? '😌 Chill' : ride.intended_intensity === 'tempo' ? '⚡ Tempo' : ride.intended_intensity === 'hard' ? '💀 Hard' : '☠️ Race'}
                              </span>
                              <span className="text-slate-600">→</span>
                              <span className="text-slate-400">Actual:</span>
                              <span className="bg-slate-800 text-slate-200 px-1.5 py-0.5 rounded font-black border border-white/5">
                                {ride.actual_intensity === 'chill' ? '😌 Stayed Chill' : ride.actual_intensity === 'spicy' ? '⚡ Got Spicy' : ride.actual_intensity === 'attacked' ? '💀 Attacked' : '☠️ I Lied'}
                              </span>
                            </div>

                            {ride.notes && (
                              <p className="text-[11px] text-slate-500 italic">
                                Notes: "{ride.notes}"
                              </p>
                            )}
                            {ride.summary && (
                              <p className="text-[11px] text-red-400 font-semibold italic">
                                Confession: "{ride.summary}"
                              </p>
                            )}
                          </div>

                          <div>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-black uppercase tracking-wider ${resultColor}`}>
                              {resultLabel}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

              </div>

            </div>

          </div>

        </main>
      )}

      {/* FOOTER */}
      <footer className="mt-auto py-6 border-t border-dark-border text-center text-[10px] font-bold tracking-widest text-slate-600">
        &copy; {new Date().getFullYear()} Domestique Index by Weekend Domestique
      </footer>
    </div>
  );
}
