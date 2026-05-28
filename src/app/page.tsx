'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { TrustScoreDial } from '../components/TrustScoreDial';
import { BadgeCard } from '../components/BadgeCard';
import { ShareCard } from '../components/ShareCard';
import { supabase, mockSupabase, isDemoMode } from '../lib/supabaseClient';
import {
  calculateRideResult,
  generateRideTitle,
  IntendedIntensity,
  ActualOutcome
} from '../lib/rideCalculations';
import {
  Bike,
  PlusCircle,
  Coffee,
  CheckCircle2,
  Share2,
  History,
  Award,
  AlertCircle,
  Sparkles,
  Zap,
  Info,
  ChevronRight,
  Trash2
} from 'lucide-react';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface Ride {
  id: string;
  ride_title: string;
  intended_intensity: IntendedIntensity;
  actual_intensity: ActualOutcome | null;
  notes: string;
  summary: string;
  is_coffee_assassin_candidate: boolean;
  result_type: string | null;
  created_at: string;
}

export default function Home() {
  const { user, profile, loading: authLoading, refreshProfile, signInWithGoogle } = useAuth();
  
  // App state
  const [rides, setRides] = useState<Ride[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [earnedBadgeIds, setEarnedBadgeIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);

  // Active ride state (pre-ride declared, but not completed yet)
  const [activeRide, setActiveRide] = useState<Ride | null>(null);

  // Forms state
  const [intendedIntensity, setIntendedIntensity] = useState<IntendedIntensity>('chill');
  const [rideTitle, setRideTitle] = useState('');
  const [isTitleEdited, setIsTitleEdited] = useState(false);
  const [preRideNotes, setPreRideNotes] = useState('');
  const [isCoffeeAssassin, setIsCoffeeAssassin] = useState(false);

  const [actualOutcome, setActualOutcome] = useState<ActualOutcome>('chill');
  const [postRideSummary, setPostRideSummary] = useState('');

  // Date-Time auto-fill setup (handles timezone offsets correctly)
  const getLocalDateTimeString = () => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  const [rideDate, setRideDate] = useState(getLocalDateTimeString());
  const [activeTab, setActiveTab] = useState<'badges' | 'history'>('history');

  // Share Modal State
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [selectedShareRide, setSelectedShareRide] = useState<Ride | null>(null);

  const client = isDemoMode ? mockSupabase : supabase;

  // Initialize ride title
  useEffect(() => {
    if (!isTitleEdited) {
      setRideTitle(generateRideTitle(intendedIntensity));
    }
  }, [intendedIntensity, isTitleEdited]);

  // Load user data when authenticated
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) {
        setLoading(false);
        setLoadedUserId(null);
        return;
      }

      // Skip fetching if already loaded for this user to prevent tab focus locks/flickering
      if (user.id === loadedUserId) {
        return;
      }

      try {
        setLoading(true);
        // 1. Fetch all badges
        const { data: badgesData } = await client.from('badges').select('*');
        if (badgesData) setBadges(badgesData);

        // 2. Fetch earned user badges
        const { data: userBadgesData } = await client
          .from('user_badges')
          .select('badge_id')
          .eq('user_id', user.id);
        
        if (userBadgesData) {
          setEarnedBadgeIds(userBadgesData.map((ub: any) => ub.badge_id));
        }

        // 3. Fetch all user rides
        const { data: ridesData } = await client
          .from('rides')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (ridesData) {
          setRides(ridesData);
          
          // Check if there is an active uncompleted ride
          const active = ridesData.find((r: Ride) => r.actual_intensity === null);
          setActiveRide(active || null);
        }

        setLoadedUserId(user.id);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user, loadedUserId]);

  // Submit Pre-Ride Declaration
  const handlePreRideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { data, error } = await client
        .from('rides')
        .insert({
          user_id: user.id,
          ride_title: rideTitle,
          intended_intensity: intendedIntensity,
          notes: preRideNotes,
          is_coffee_assassin_candidate: isCoffeeAssassin,
          created_at: new Date(rideDate).toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Pre-ride insert error:', error);
      } else if (data) {
        setActiveRide(data);
        setRides((prev) => [data, ...prev]);
        
        // Reset pre-ride form
        setIsTitleEdited(false);
        setPreRideNotes('');
        setIsCoffeeAssassin(false);
        setRideDate(getLocalDateTimeString());
      }
    } catch (err) {
      console.error('Pre-ride submission failed:', err);
    }
  };

  // Submit Post-Ride Confirmation
  const handlePostRideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeRide) return;

    try {
      // 1. Calculate outcomes (Trust score impact and badges)
      const calculation = calculateRideResult(
        activeRide.intended_intensity,
        actualOutcome,
        activeRide.is_coffee_assassin_candidate
      );

      // 2. Compute new trust score
      const currentScore = profile?.trust_score ?? 100;
      const newScore = Math.max(0, Math.min(100, currentScore + calculation.trustChange));

      // 3. Update active ride in Supabase
      const { data: updatedRide } = await client
        .from('rides')
        .update({
          actual_intensity: actualOutcome,
          summary: postRideSummary,
          result_type: calculation.resultType,
        })
        .eq('id', activeRide.id)
        .select()
        .single();

      // 4. Update user's trust score
      await client
        .from('users')
        .update({ trust_score: newScore })
        .eq('id', user.id);

      // 5. Save unlocked badge if applicable
      if (calculation.earnedBadgeId) {
        // Only insert if not already unlocked
        if (!earnedBadgeIds.includes(calculation.earnedBadgeId)) {
          await client.from('user_badges').insert({
            user_id: user.id,
            badge_id: calculation.earnedBadgeId,
            earned_at: new Date().toISOString(),
          });
          setEarnedBadgeIds((prev) => [...prev, calculation.earnedBadgeId as string]);
        }
      }

      // 6. Refresh states
      setActiveRide(null);
      setPostRideSummary('');
      
      // Update local rides list
      setRides((prev) =>
        prev.map((r) => (r.id === activeRide.id ? updatedRide : r))
      );
      
      await refreshProfile();
    } catch (err) {
      console.error('Post-ride completion failed:', err);
    }
  };

  // Delete a ride and recalculate trust score/badges
  const handleRideDelete = async (rideId: string) => {
    if (!user) return;
    
    const confirmDelete = window.confirm("Are you sure you want to delete this ride? This will permanently recalculate your trust score and badges.");
    if (!confirmDelete) return;

    try {
      // 1. Delete ride from Supabase and request returned rows to check RLS blocks
      const { data: deletedRows, error } = await client.from('rides').delete().eq('id', rideId).select();
      if (error) {
        console.error('Delete ride error:', error);
        alert('Delete ride failed: ' + error.message);
        return;
      }

      // Check if delete was blocked by RLS policies on the live database
      if (!isDemoMode && (!deletedRows || deletedRows.length === 0)) {
        alert(
          'Delete succeeded silently at the HTTP level but zero database rows were deleted.\n\n' +
          'This usually means your live Supabase project is missing the RLS "delete" policy for the rides table.\n\n' +
          'Please execute the following command in your Supabase SQL Editor:\n\n' +
          'create policy "Users can delete their own rides"\n  on public.rides for delete\n  using (auth.uid() = user_id);'
        );
        return;
      }

      // 2. Filter local list of rides
      const updatedRides = rides.filter(r => r.id !== rideId);
      setRides(updatedRides);

      // Check if the deleted ride was active
      if (activeRide?.id === rideId) {
        setActiveRide(null);
      }

      // 3. Recalculate trust score and badges
      await recalculateUserProfileAndBadges(updatedRides);
    } catch (err) {
      console.error('Ride deletion failed:', err);
    }
  };

  const recalculateUserProfileAndBadges = async (remainingRides: Ride[]) => {
    if (!user) return;

    try {
      // 1. Calculate new trust score
      let newScore = 100;
      const chronological = [...remainingRides]
        .filter(r => r.actual_intensity !== null)
        .reverse();

      const newEarnedBadgeIds: string[] = [];

      for (const ride of chronological) {
        const calc = calculateRideResult(
          ride.intended_intensity,
          ride.actual_intensity as ActualOutcome,
          ride.is_coffee_assassin_candidate
        );
        newScore = Math.max(0, Math.min(100, newScore + calc.trustChange));
        
        if (calc.earnedBadgeId && !newEarnedBadgeIds.includes(calc.earnedBadgeId)) {
          newEarnedBadgeIds.push(calc.earnedBadgeId);
        }
      }

      // 2. Update user's trust score in DB
      await client
        .from('users')
        .update({ trust_score: newScore })
        .eq('id', user.id);

      // 3. Sync badges in DB
      // First, delete existing badges
      await client.from('user_badges').delete().eq('user_id', user.id);

      // Then insert the new set of badges
      if (newEarnedBadgeIds.length > 0) {
        const inserts = newEarnedBadgeIds.map(bid => ({
          user_id: user.id,
          badge_id: bid,
          earned_at: new Date().toISOString()
        }));
        await client.from('user_badges').insert(inserts);
      }

      // Update local state
      setEarnedBadgeIds(newEarnedBadgeIds);
      await refreshProfile();
    } catch (err) {
      console.error('Error recalculating profile:', err);
    }
  };

  // Count how many total lies (bad results) user has committed
  const liesCount = rides.filter(
    (r) => r.result_type && ['liar', 'zone2_criminal', 'assassin'].includes(r.result_type)
  ).length;

  const isPageLoading = authLoading || loading;

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col">
      <Header />

      {isPageLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <span className="h-10 w-10 border-4 border-cyber-lime border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 font-bold text-xs">Loading Domestique Index Metrics...</p>
          </div>
        </div>
      ) : !user ? (
        /* ================= LANDING SCREEN (UNAUTH) ================= */
        <main className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full relative">
          
          {/* Neon decorative background glow */}
          <div className="absolute top-1/4 left-1/4 h-[300px] w-[300px] rounded-full bg-cyber-lime/5 blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 h-[250px] w-[250px] rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <div className="space-y-6 text-center lg:text-left">
              <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-white leading-[1.1]">
                Declare santai. <br />
                <span className="text-cyber-lime text-glow">Ride like it's a Crit.</span>
              </h1>
              <p className="text-slate-400 text-lg sm:text-xl font-medium leading-relaxed max-w-lg mx-auto lg:mx-0">
                Cyclists say "easy spin" but average 40km/h. We hold you accountable. Log your intentions, reveal your lies, and earn badges of shame.
              </p>
              
              <div className="pt-4 flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
                <button
                  onClick={signInWithGoogle}
                  className="px-8 py-4 font-black text-dark-bg bg-cyber-lime hover:bg-cyber-lime-hover rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all text-base flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Bike className="h-5 w-5 stroke-[2.5]" />
                  Log My Ride
                </button>
              </div>
            </div>

            {/* High Fidelity Design Mock Card Showcase */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl relative">
                
                {/* Glowing ring dial preview */}
                <div className="flex flex-col items-center justify-center border border-white/5 rounded-2xl bg-slate-900/60 p-6 shadow-inner relative">
                  <div className="absolute inset-0 rounded-2xl bg-cyber-lime/5 blur-lg pointer-events-none" />
                  <div className="relative flex h-32 w-32 items-center justify-center rounded-full border-4 border-dashed border-cyber-lime/30">
                    <div className="text-center">
                      <span className="text-4xl font-black text-white tracking-tighter">12%</span>
                      <p className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Trust Score</p>
                    </div>
                  </div>
                  <h3 className="text-lg font-black text-white mt-4 text-center">Weekend_Dom_24</h3>
                  <span className="mt-2 text-xs px-2.5 py-0.5 rounded-full bg-red-950/40 border border-red-500/20 text-red-400 font-bold flex items-center gap-1">
                    🤥 Certified Liar
                  </span>
                </div>

                {/* Example lie list */}
                <div className="mt-4 space-y-3">
                  <div className="p-4 rounded-2xl bg-slate-900 border border-white/5 text-xs">
                    <p className="font-extrabold text-slate-200">Wednesday Coffee Spin</p>
                    <div className="flex justify-between items-center mt-2 text-[10px]">
                      <span className="text-slate-400">Intended: 😌 Chill</span>
                      <span className="text-red-400 font-black">Actual: ☠️ I Lied</span>
                    </div>
                    <p className="text-red-400/80 mt-1 italic font-semibold">
                      "Dropped Wout on the first 10% hill climb."
                    </p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </main>
      ) : (
        /* ================= DASHBOARD CLIENT VIEW ================= */
        <main className="flex-1 max-w-7xl w-full mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT COLUMN: USER STATUS & RATING */}
            <div className="space-y-6">
              
              {/* Trust Score circular Dial */}
              <TrustScoreDial score={profile?.trust_score ?? 100} />

              {/* Statistics Card */}
              <div className="p-6 rounded-2xl glass-panel relative overflow-hidden">
                <h3 className="font-extrabold text-sm text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-cyber-lime" />
                  Rider Stats
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <span className="text-3xl font-black text-white">{rides.length}</span>
                    <p className="text-[10px] font-bold text-slate-400 mt-1">Total Logs</p>
                  </div>
                  <div className="text-center border-x border-white/5">
                    <span className="text-3xl font-black text-red-400">{liesCount}</span>
                    <p className="text-[10px] font-bold text-slate-400 mt-1">Lies</p>
                  </div>
                  <div className="text-center">
                    <span className="text-3xl font-black text-cyber-lime">
                      {rides.length > 0
                        ? Math.round(((rides.length - liesCount) / rides.length) * 100)
                        : 100}%
                    </span>
                    <p className="text-[10px] font-bold text-slate-400 mt-1">Honesty</p>
                  </div>
                </div>

                {/* Generate share card button */}
                <button
                  onClick={() => {
                    setSelectedShareRide(null);
                    setIsShareOpen(true);
                  }}
                  className="w-full mt-6 py-3 font-extrabold text-sm text-dark-bg bg-cyber-lime hover:bg-cyber-lime-hover rounded-xl shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Share2 className="h-4 w-4" />
                  Share Lie Profile
                </button>
              </div>

            </div>

            {/* MIDDLE/RIGHT: FORM INPUTS & LOGGING */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* RIDE ACTIVE CONFIRMATION PANELS */}
              {activeRide ? (
                /* ================= POST-RIDE LOGGING PANEL ================= */
                <form
                  onSubmit={handlePostRideSubmit}
                  className="p-6 rounded-2xl glass-panel border border-red-500/20 shadow-2xl relative overflow-hidden"
                >
                  {/* Glowing warning border */}
                  <div className="absolute top-0 inset-x-0 h-1.5 bg-red-500 animate-pulse" />
                  
                  <div className="flex items-center gap-2 text-red-400">
                    <AlertCircle className="h-5 w-5 animate-bounce" />
                    <h3 className="font-extrabold text-base tracking-tight text-white">
                      Confirm Ride Outcome: <span className="text-red-400">"{activeRide.ride_title}"</span>
                    </h3>
                  </div>

                  <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
                    <span>Intended Intensity:</span>
                    <span className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded font-black border border-white/5">
                      {activeRide.intended_intensity === 'chill' ? '😌 Chill' : activeRide.intended_intensity === 'tempo' ? '⚡ Tempo' : activeRide.intended_intensity === 'hard' ? '💀 Hard' : '☠️ Race'}
                    </span>
                  </div>

                  {/* Intensity Choice buttons */}
                  <div className="mt-5 space-y-2">
                    <label className="text-xs font-bold text-slate-300">
                      What actually went down? Be honest (or confess):
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { id: 'chill', label: 'Stayed Chill 😌', desc: 'No lies. Genuine spin.' },
                        { id: 'spicy', label: 'Got Spicy ⚡', desc: 'Tempo or intervals.' },
                        { id: 'attacked', label: 'Attacked 💀', desc: 'Everyone sprinted.' },
                        { id: 'lied', label: 'I Lied ☠️', desc: 'Full gas race pace.' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setActualOutcome(item.id as ActualOutcome)}
                          className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                            actualOutcome === item.id
                              ? 'bg-red-500/10 border-red-500 text-white shadow'
                              : 'bg-slate-900/60 border-white/5 text-slate-400 hover:text-slate-200 hover:border-white/10'
                          }`}
                        >
                          <span className="text-sm font-extrabold">{item.label}</span>
                          <span className="text-[9px] text-slate-500 mt-1 leading-none">{item.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Summary notes */}
                  <div className="mt-4 space-y-1">
                    <label className="text-xs font-bold text-slate-300">Post-Ride Confession / Summary</label>
                    <input
                      type="text"
                      placeholder="e.g. Someone attacked at the first stop sign. Accidental race pace."
                      value={postRideSummary}
                      onChange={(e) => setPostRideSummary(e.target.value)}
                      className="w-full bg-slate-950/60 border border-white/5 hover:border-white/10 focus:border-red-500 outline-none rounded-xl px-4 py-3 text-sm text-slate-200 transition-all"
                    />
                  </div>

                  <div className="mt-5 flex gap-3">
                    <button
                      type="submit"
                      className="flex-1 py-3 text-sm font-black text-white bg-red-500 hover:bg-red-600 rounded-xl transition-all cursor-pointer shadow-lg shadow-red-950/40 text-center"
                    >
                      Expose My Lie
                    </button>
                  </div>
                </form>
              ) : (
                /* ================= PRE-RIDE LOGGING PANEL ================= */
                <form
                  onSubmit={handlePreRideSubmit}
                  className="p-6 rounded-2xl glass-panel border border-white/5 relative overflow-hidden"
                >
                  <h3 className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                    <PlusCircle className="h-5 w-5 text-cyber-lime" />
                    Declare Pre-Ride Intention
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Declare what kind of ride you intend to do. We will track if you lie.
                  </p>

                  {/* Ride Intensity Choice */}
                  <div className="mt-5 space-y-2">
                    <label className="text-xs font-bold text-slate-300">Intended Intensity</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { id: 'chill', label: 'Chill Ride 😌', desc: 'Zone 2 / recovery' },
                        { id: 'tempo', label: 'Tempo Ride ⚡', desc: 'Solid sweet spot' },
                        { id: 'hard', label: 'Hard Ride 💀', desc: 'KOM smash session' },
                        { id: 'race', label: 'Race Sim ☠️', desc: 'Crit practice speed' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setIntendedIntensity(item.id as IntendedIntensity)}
                          className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                            intendedIntensity === item.id
                              ? 'bg-cyber-lime/10 border-cyber-lime text-white'
                              : 'bg-slate-900/60 border-white/5 text-slate-400 hover:text-slate-200 hover:border-white/10'
                          }`}
                        >
                          <span className="text-sm font-extrabold">{item.label}</span>
                          <span className="text-[9px] text-slate-500 mt-1 leading-none">{item.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Autogenerated Ride Title input */}
                  <div className="mt-4 space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-300">Ride Title</label>
                      <button
                        type="button"
                        onClick={() => {
                          setRideTitle(generateRideTitle(intendedIntensity));
                          setIsTitleEdited(false);
                        }}
                        className="text-[10px] text-cyber-lime font-bold hover:underline"
                      >
                        Re-generate
                      </button>
                    </div>
                    <input
                      type="text"
                      value={rideTitle}
                      onChange={(e) => {
                        setRideTitle(e.target.value);
                        setIsTitleEdited(true);
                      }}
                      className="w-full bg-slate-950/60 border border-white/5 hover:border-white/10 focus:border-cyber-lime outline-none rounded-xl px-4 py-3 text-sm text-slate-200 transition-all"
                    />
                  </div>

                  {/* Pre-ride notes */}
                  <div className="mt-4 space-y-1">
                    <label className="text-xs font-bold text-slate-300">Optional Notes</label>
                    <input
                      type="text"
                      placeholder="e.g. Keeping heart rate low today. No attacking."
                      value={preRideNotes}
                      onChange={(e) => setPreRideNotes(e.target.value)}
                      className="w-full bg-slate-950/60 border border-white/5 hover:border-white/10 focus:border-cyber-lime outline-none rounded-xl px-4 py-3 text-sm text-slate-200 transition-all"
                    />
                  </div>

                  {/* Ride Date input (for backlogging) */}
                  <div className="mt-4 space-y-1">
                    <label className="text-xs font-bold text-slate-300">Ride Date & Time</label>
                    <input
                      type="datetime-local"
                      value={rideDate}
                      onChange={(e) => setRideDate(e.target.value)}
                      className="w-full bg-slate-950/60 border border-white/5 hover:border-white/10 focus:border-cyber-lime outline-none rounded-xl px-4 py-3 text-sm text-slate-200 transition-all cursor-pointer"
                    />
                  </div>

                  {/* Special toggle candidate (Coffee Assassin) */}
                  <div className="mt-4 flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-white/5">
                    <div className="flex items-center gap-2">
                      <Coffee className="h-4 w-4 text-cyber-lime" />
                      <div>
                        <p className="text-xs font-bold text-white">Croissant / Coffee Ride?</p>
                        <p className="text-[9px] text-slate-500">Toggling this increases penalties if you go full gas.</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={isCoffeeAssassin}
                      onChange={(e) => setIsCoffeeAssassin(e.target.checked)}
                      className="h-4.5 w-4.5 rounded border-white/10 bg-slate-950 text-cyber-lime accent-cyber-lime focus:ring-cyber-lime"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-5 py-3 font-extrabold text-sm text-dark-bg bg-cyber-lime hover:bg-cyber-lime-hover rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="h-4 w-4 stroke-[2.5]" />
                    Declare Intention
                  </button>
                </form>
              )}

              {/* TABS CONTAINER FOR BADGES & HISTORY */}
              <div className="space-y-6">
                          <div className="flex border-b border-white/5 pb-1 gap-6">
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`font-extrabold text-sm uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b-2 transition-all cursor-pointer ${
                      activeTab === 'history'
                        ? 'border-cyber-lime text-cyber-lime font-black'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <History className="h-4 w-4" />
                    Ride History
                  </button>

                  <button
                    onClick={() => setActiveTab('badges')}
                    className={`font-extrabold text-sm uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b-2 transition-all cursor-pointer ${
                      activeTab === 'badges'
                        ? 'border-cyber-lime text-cyber-lime font-black'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Award className="h-4 w-4" />
                    Unlocked Badges
                  </button>
                </div>

                {activeTab === 'badges' ? (
                  /* Badges Content */
                  badges.length === 0 ? (
                    <div className="p-6 rounded-2xl glass-panel text-center text-xs text-slate-500">
                      No badges found. Setup schema.sql in Supabase or run in Demo mode to seed.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {badges.map((badge) => (
                        <BadgeCard
                          key={badge.id}
                          badge={badge}
                          isEarned={earnedBadgeIds.includes(badge.id)}
                        />
                      ))}
                    </div>
                  )
                ) : (
                  /* Ride History Content */
                  rides.length === 0 ? (
                    <div className="p-8 rounded-2xl glass-panel text-center text-slate-500 font-bold text-xs">
                      No rides declared yet. Complete your first pre-ride intention to begin!
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {rides.map((ride) => {
                        const isCompleted = ride.actual_intensity !== null;
                        
                        let resultLabel = 'Declared';
                        let resultColor = 'bg-slate-900 border-white/5 text-slate-400';
                        
                        if (isCompleted) {
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
                        } else {
                          resultLabel = '🚴 Ride in Progress';
                          resultColor = 'bg-cyber-lime/10 border-cyber-lime/20 text-cyber-lime animate-pulse';
                        }

                        return (
                          <div
                            key={ride.id}
                            className={`p-5 rounded-2xl border glass-panel flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all hover:border-white/10 ${
                              !isCompleted ? 'border-cyber-lime/20 shadow-lg shadow-cyber-lime/5' : ''
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-extrabold text-sm text-white tracking-tight">
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
                                
                                {isCompleted && (
                                  <>
                                    <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
                                    <span className="text-slate-400">Actual:</span>
                                    <span className="bg-slate-800 text-slate-200 px-1.5 py-0.5 rounded font-black border border-white/5">
                                      {ride.actual_intensity === 'chill' ? '😌 Stayed Chill' : ride.actual_intensity === 'spicy' ? '⚡ Got Spicy' : ride.actual_intensity === 'attacked' ? '💀 Attacked' : '☠️ I Lied'}
                                    </span>
                                  </>
                                )}
                              </div>

                              {ride.notes && (
                                <p className="text-[11px] text-slate-400 italic">
                                  Declared Notes: "{ride.notes}"
                                </p>
                              )}
                              {ride.summary && (
                                <p className="text-[11px] text-red-400 font-semibold italic">
                                  Confession Summary: "{ride.summary}"
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-black uppercase tracking-wider ${resultColor}`}>
                                {resultLabel}
                              </span>
                              <div className="flex items-center gap-1">
                                {isCompleted && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedShareRide(ride);
                                      setIsShareOpen(true);
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-cyber-lime hover:bg-slate-800 rounded-lg border border-transparent hover:border-white/10 transition-all cursor-pointer"
                                    title="Share Ride Confession"
                                  >
                                    <Share2 className="h-4 w-4" />
                                  </button>
                                )}
                                
                                <button
                                  type="button"
                                  onClick={() => handleRideDelete(ride.id)}
                                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/20 rounded-lg border border-transparent hover:border-red-950/50 transition-all cursor-pointer"
                                  title="Delete Ride"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Social Share generator Modal */}
          {isShareOpen && (
            <ShareCard
              username={profile?.username || 'cyclist'}
              trustScore={profile?.trust_score ?? 100}
              totalRides={rides.filter(r => r.actual_intensity !== null).length}
              liesCount={liesCount}
              selectedRide={selectedShareRide}
              isOpen={isShareOpen}
              onClose={() => {
                setIsShareOpen(false);
                setSelectedShareRide(null);
              }}
            />
          )}

        </main>
      )}

      {/* FOOTER */}
      <footer className="mt-auto py-6 border-t border-dark-border text-center text-[10px] font-bold tracking-widest text-slate-600">
        &copy; {new Date().getFullYear()} Domestique Index by Weekend Domestique
      </footer>
    </div>
  );
}
