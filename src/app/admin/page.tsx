'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Header } from '../../components/Header';
import { supabase, mockSupabase, isDemoMode } from '../../lib/supabaseClient';
import {
  ShieldAlert,
  Users,
  Bike,
  Activity,
  UserCheck,
  Search,
  ArrowLeft,
  Lock,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Award
} from 'lucide-react';
import Link from 'next/link';

interface UserTelemetry {
  id: string;
  username: string;
  email: string;
  is_admin: boolean;
  trust_score: number;
  created_at: string;
  totalRides: number;
  liesCount: number;
  truthsCount: number;
}

export default function AdminDashboard() {
  const { user, profile, loading: authLoading, signInWithGoogle, refreshProfile } = useAuth();
  
  const [loadingData, setLoadingData] = useState(true);
  const [users, setUsers] = useState<UserTelemetry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const client = isDemoMode ? mockSupabase : supabase;

  const fetchTelemetry = async () => {
    try {
      setLoadingData(true);
      setError(null);

      // 1. Fetch all users
      const { data: usersData, error: usersError } = await client
        .from('users')
        .select('*');

      if (usersError) throw usersError;

      // 2. Fetch all rides to compute per-user telemetry
      const { data: ridesData, error: ridesError } = await client
        .from('rides')
        .select('*');

      if (ridesError) throw ridesError;

      // 3. Map and calculate telemetry
      const mappedUsers = (usersData || []).map((u: any) => {
        const userRides = (ridesData || []).filter((r: any) => r.user_id === u.id);
        const completedRides = userRides.filter((r: any) => r.actual_intensity !== null);
        
        const liesCount = completedRides.filter((r: any) => 
          r.result_type && ['liar', 'zone2_criminal', 'assassin'].includes(r.result_type)
        ).length;

        const truthsCount = completedRides.filter((r: any) =>
          r.result_type && ['trustworthy', 'sandbagger'].includes(r.result_type)
        ).length;

        return {
          ...u,
          totalRides: userRides.length,
          liesCount,
          truthsCount,
        };
      });

      // Sort users by registration date (latest first)
      mappedUsers.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setUsers(mappedUsers);
    } catch (err: any) {
      console.error('Telemetry query failed:', err);
      setError(err?.message || 'Failed to sync platform telemetry. Please run database migrations.');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (user && profile?.is_admin) {
      fetchTelemetry();
    } else {
      setLoadingData(false);
    }
  }, [user, profile]);

  // Demo Mode developer admin bypass helper
  const handleDemoAdminBypass = () => {
    if (!isDemoMode || !user) return;
    
    // Update local storage user profile to is_admin: true
    const currentStoredUser = localStorage.getItem('domestique_index_demo_user');
    if (currentStoredUser) {
      const parsed = JSON.parse(currentStoredUser);
      parsed.is_admin = true;
      localStorage.setItem('domestique_index_demo_user', JSON.stringify(parsed));
      
      // Update entry inside registered users list
      const storedUsersList = localStorage.getItem('domestique_index_demo_users');
      if (storedUsersList) {
        const list = JSON.parse(storedUsersList);
        const index = list.findIndex((u: any) => u.id === parsed.id);
        if (index !== -1) {
          list[index].is_admin = true;
          localStorage.setItem('domestique_index_demo_users', JSON.stringify(list));
        }
      }
    }
    window.location.reload();
  };

  // Filter users based on search query
  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Overall community calculations
  const totalRiders = users.length;
  const totalRidesLogged = users.reduce((acc, curr) => acc + curr.totalRides, 0);
  const avgTrustScore = totalRiders > 0
    ? Math.round(users.reduce((acc, curr) => acc + curr.trust_score, 0) / totalRiders)
    : 100;
  
  const communityTotalLies = users.reduce((acc, curr) => acc + curr.liesCount, 0);
  const communityTotalTruths = users.reduce((acc, curr) => acc + curr.truthsCount, 0);

  const isPageLoading = authLoading || (loadingData && users.length === 0);

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col">
      <Header />

      {isPageLoading ? (
        /* LOADING STATE */
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <span className="h-10 w-10 border-4 border-cyber-lime border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 font-bold text-xs">Authenticating Admin Access Keys...</p>
          </div>
        </div>
      ) : !user ? (
        /* LOCK SCREEN FOR UNAUTHENTICATED USERS */
        <main className="flex-1 flex items-center justify-center p-6 text-center max-w-md mx-auto">
          <div className="space-y-6 rounded-3xl border border-white/5 bg-slate-900/60 p-8 glass-panel relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-yellow-500 animate-pulse" />
            <div className="h-14 w-14 rounded-2xl bg-yellow-950/20 border border-yellow-500/20 flex items-center justify-center mx-auto text-yellow-500 shadow-lg">
              <Lock className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Admin Portal Locked</h2>
              <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                This area contains secure user telemetry logs and is restricted to platform administrators and race directors.
              </p>
            </div>
            
            <div className="pt-2">
              <button
                onClick={signInWithGoogle}
                className="w-full flex items-center justify-center gap-2 py-3 text-sm font-extrabold text-dark-bg bg-cyber-lime hover:bg-cyber-lime-hover rounded-xl shadow-lg cyber-glow transition-all cursor-pointer"
              >
                Authenticate with Google
              </button>
            </div>

            <div className="pt-4 border-t border-white/5 flex flex-col gap-2">
              <Link href="/" className="text-xs text-cyber-lime hover:underline font-bold flex items-center justify-center gap-1">
                <ArrowLeft className="h-3 w-3" /> Back to Dashboard
              </Link>
            </div>
          </div>
        </main>
      ) : !profile?.is_admin ? (
        /* PERMISSION DENIED SHIELD */
        <main className="flex-1 flex items-center justify-center p-6 text-center max-w-md mx-auto">
          <div className="space-y-6 rounded-3xl border border-white/5 bg-slate-900/60 p-8 glass-panel relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-red-500" />
            <div className="h-14 w-14 rounded-2xl bg-red-950/20 border border-red-500/20 flex items-center justify-center mx-auto text-red-500 shadow-lg animate-bounce">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Permission Denied</h2>
              <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                Your account (<span className="text-slate-200 font-extrabold">{user.email || profile?.username || 'Rider'}</span>) is not flagged as an Administrator.
              </p>
            </div>

            {isDemoMode && (
              <div className="p-4 rounded-2xl bg-cyber-lime/5 border border-cyber-lime/10 flex flex-col gap-2 items-center">
                <p className="text-[10px] text-cyber-lime font-black uppercase tracking-wider">Demo Sandbox Bypass</p>
                <p className="text-[10px] text-slate-400 leading-snug">
                  You are currently in Offline Demo Mode. You can temporarily elevate your mock account to admin credentials to test this page.
                </p>
                <button
                  onClick={handleDemoAdminBypass}
                  className="mt-1 px-4 py-2 text-xs font-black text-dark-bg bg-cyber-lime hover:bg-cyber-lime-hover rounded-lg transition-all cursor-pointer"
                >
                  Enable Demo Admin Access 🔑
                </button>
              </div>
            )}
            
            <div className="pt-2 border-t border-white/5">
              <Link
                href="/"
                className="w-full inline-flex items-center justify-center gap-1.5 py-3 text-sm font-extrabold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
              >
                <ArrowLeft className="h-4 w-4" /> Go Back to My Dashboard
              </Link>
            </div>
          </div>
        </main>
      ) : (
        /* PREMIUM ADMIN PANEL SCREEN */
        <main className="flex-1 max-w-7xl w-full mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
          
          {/* Admin Header Title Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
            <div className="space-y-1.5">
              <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
                Admin Dashboard
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={fetchTelemetry}
                className="flex items-center justify-center p-2.5 rounded-xl border border-white/5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
                title="Force Refresh Data"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <Link
                href="/"
                className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-extrabold text-dark-bg bg-cyber-lime hover:bg-cyber-lime-hover rounded-xl shadow-lg transition-all"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Dashboard
              </Link>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-red-950/20 border border-red-500/20 text-red-400 text-xs flex items-start gap-2.5 max-w-3xl">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-extrabold">Database Synchronization Blocked:</p>
                <p className="mt-0.5 text-slate-400 leading-relaxed">{error}</p>
                <p className="mt-1 font-semibold text-cyber-lime">
                  Tip: Copy the updated schema scripts from schema.sql and execute them in your Supabase SQL Editor.
                </p>
              </div>
            </div>
          )}

          {/* TELEMETRY ANALYTICS STATS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Total Riders */}
            <div className="p-5 rounded-2xl glass-panel relative overflow-hidden flex flex-col justify-between h-28">
              <div className="absolute top-0 inset-x-0 h-1 bg-cyber-lime/20" />
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-[10px] font-black uppercase tracking-wider">Registered Riders</span>
                <Users className="h-4 w-4 text-cyber-lime" />
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-white">{totalRiders}</span>
                <span className="text-[9px] text-emerald-400 font-extrabold flex items-center gap-0.5">
                  <TrendingUp className="h-3 w-3" /> Live Active
                </span>
              </div>
            </div>

            {/* Total Rides Logged */}
            <div className="p-5 rounded-2xl glass-panel relative overflow-hidden flex flex-col justify-between h-28">
              <div className="absolute top-0 inset-x-0 h-1 bg-blue-500/20" />
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-[10px] font-black uppercase tracking-wider">Rides Logged</span>
                <Bike className="h-4 w-4 text-blue-400" />
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-white">{totalRidesLogged}</span>
                <span className="text-[9px] text-slate-400 font-semibold">
                  Avg {totalRiders > 0 ? Math.round(totalRidesLogged / totalRiders) : 0} / rider
                </span>
              </div>
            </div>

            {/* Average Trust rating */}
            <div className="p-5 rounded-2xl glass-panel relative overflow-hidden flex flex-col justify-between h-28">
              <div className="absolute top-0 inset-x-0 h-1 bg-emerald-500/20" />
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-[10px] font-black uppercase tracking-wider">Platform Trust Index</span>
                <UserCheck className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-white">{avgTrustScore}%</span>
                <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                  avgTrustScore < 50 ? 'bg-red-950/20 text-red-400' : 'bg-emerald-950/20 text-emerald-400'
                }`}>
                  {avgTrustScore < 50 ? '🤥 Serially Suspect' : '😌 Honest Cohort'}
                </span>
              </div>
            </div>

            {/* Total Lies vs Truths */}
            <div className="p-5 rounded-2xl glass-panel relative overflow-hidden flex flex-col justify-between h-28">
              <div className="absolute top-0 inset-x-0 h-1 bg-red-500/20" />
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-[10px] font-black uppercase tracking-wider">Community Credibility</span>
                <Activity className="h-4 w-4 text-red-400" />
              </div>
              <div className="flex items-baseline justify-between mt-2 w-full">
                <div>
                  <span className="text-2xl font-black text-emerald-400">{communityTotalTruths}</span>
                  <span className="text-[9px] font-bold text-slate-500 ml-1">Truths</span>
                </div>
                <div className="text-slate-600 font-extrabold text-sm">vs</div>
                <div>
                  <span className="text-2xl font-black text-red-400">{communityTotalLies}</span>
                  <span className="text-[9px] font-bold text-slate-500 ml-1">Lies</span>
                </div>
              </div>
            </div>

          </div>

          {/* COMMUNITY RATIO VISUALIZATION BAR */}
          <div className="p-6 rounded-3xl glass-panel space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-xs text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Activity className="h-4 w-4 text-cyber-lime" />
                Community Intention Outcomes Ratio
              </h3>
              <span className="text-[10px] text-slate-400 font-bold">
                Total audited logs: {communityTotalTruths + communityTotalLies} completed spins
              </span>
            </div>
            
            {communityTotalTruths + communityTotalLies === 0 ? (
              <p className="text-slate-500 font-bold text-xs py-4 text-center">No completed rides recorded yet to map community ratios.</p>
            ) : (
              <div className="space-y-2">
                {/* Visual Ratio Bar Chart */}
                <div className="h-4 rounded-full w-full bg-slate-900 overflow-hidden flex">
                  <div
                    style={{ width: `${(communityTotalTruths / (communityTotalTruths + communityTotalLies)) * 100}%` }}
                    className="h-full bg-emerald-500"
                    title={`Truthful declaration stays (${communityTotalTruths})`}
                  />
                  <div
                    style={{ width: `${(communityTotalLies / (communityTotalTruths + communityTotalLies)) * 100}%` }}
                    className="h-full bg-red-500"
                    title={`Lied outcomes (${communityTotalLies})`}
                  />
                </div>
                
                {/* Ratios Labels */}
                <div className="flex justify-between items-center text-[10px] font-extrabold text-slate-400">
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded bg-emerald-500" />
                    <span>Honest Spins: {Math.round((communityTotalTruths / (communityTotalTruths + communityTotalLies)) * 100)}% ({communityTotalTruths} rides)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded bg-red-500" />
                    <span>Lied/Spicy outcomes: {Math.round((communityTotalLies / (communityTotalTruths + communityTotalLies)) * 100)}% ({communityTotalLies} lies)</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* USER DIRECTORY SEARCH & TELEMETRY LIST TABLE */}
          <div className="space-y-4">
            
            {/* Header & Search */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h3 className="font-extrabold text-sm text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                <Users className="h-4 w-4 text-cyber-lime" />
                Registered Riders
              </h3>
              
              {/* Search Bar Input */}
              <div className="relative w-full sm:max-w-xs">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Search className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  placeholder="Filter riders by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl text-sm font-semibold bg-slate-900 border border-white/5 focus:border-cyber-lime/40 text-slate-200 outline-none transition-all placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* Telemetry Table Container */}
            <div className="border border-white/5 rounded-3xl overflow-hidden bg-slate-900/60 glass-panel">
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/5 text-left text-sm">
                  
                  {/* Table Head */}
                  <thead className="bg-slate-950/40 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <tr>
                      <th scope="col" className="px-6 py-4">Rider / Username</th>
                      <th scope="col" className="px-6 py-4">Email Address</th>
                      <th scope="col" className="px-6 py-4">Registered Date</th>
                      <th scope="col" className="px-6 py-4 text-center">Total Rides</th>
                      <th scope="col" className="px-6 py-4 text-center">Trust Score</th>
                      <th scope="col" className="px-6 py-4">Lies vs Truths Ratio Telemetry</th>
                    </tr>
                  </thead>

                  {/* Table Body */}
                  <tbody className="divide-y divide-white/5 font-semibold text-slate-300">
                    
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500 text-xs font-bold">
                          {users.length === 0 ? 'No registered accounts queried.' : 'No users match your filter criteria.'}
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((item) => {
                        const totalCompleted = item.truthsCount + item.liesCount;
                        
                        return (
                          <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                            
                            {/* Rider info */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <img
                                  src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${item.username}`}
                                  alt="avatar"
                                  className="h-8 w-8 rounded-lg bg-slate-800 border border-white/10"
                                />
                                <div>
                                  <div className="text-sm font-extrabold text-white flex items-center gap-1.5">
                                    {item.username}
                                    {item.is_admin && (
                                      <span className="text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-cyber-lime/10 border border-cyber-lime/20 text-cyber-lime font-black">
                                        Admin
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-500 font-medium">ID: {item.id.slice(0, 8)}...</div>
                                </div>
                              </div>
                            </td>

                            {/* Email */}
                            <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-slate-400">
                              {item.email || 'N/A'}
                            </td>

                            {/* Registered date */}
                            <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400">
                              {new Date(item.created_at).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </td>

                            {/* Total Rides */}
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-black text-white">
                              {item.totalRides}
                            </td>

                            {/* Trust Score index */}
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-black ${
                                item.trust_score < 40 
                                  ? 'bg-red-950/20 text-red-400 border border-red-500/20' 
                                  : item.trust_score < 75 
                                  ? 'bg-orange-950/20 text-orange-400 border border-orange-500/20' 
                                  : 'bg-emerald-950/20 text-emerald-400 border border-emerald-500/20'
                              }`}>
                                {item.trust_score}%
                              </span>
                            </td>

                            {/* Lies vs Truths ratio bar representation */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="space-y-1.5 w-48">
                                {totalCompleted === 0 ? (
                                  <span className="text-[10px] text-slate-500 italic font-medium">No completed logs yet</span>
                                ) : (
                                  <>
                                    {/* Inline dynamic bar */}
                                    <div className="h-2 rounded-full w-full bg-slate-950 overflow-hidden flex border border-white/5">
                                      <div
                                        style={{ width: `${(item.truthsCount / totalCompleted) * 100}%` }}
                                        className="bg-emerald-500 h-full"
                                        title={`${item.truthsCount} Truths`}
                                      />
                                      <div
                                        style={{ width: `${(item.liesCount / totalCompleted) * 100}%` }}
                                        className="bg-red-500 h-full"
                                        title={`${item.liesCount} Lies`}
                                      />
                                    </div>
                                    
                                    {/* Inline breakdown text */}
                                    <div className="flex justify-between items-center text-[9px] font-bold text-slate-500">
                                      <span className="text-emerald-400">{item.truthsCount} Truths</span>
                                      <span className="text-red-400">{item.liesCount} Lies</span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </td>

                          </tr>
                        );
                      })
                    )}

                  </tbody>

                </table>
              </div>

            </div>

          </div>

        </main>
      )}

      {/* FOOTER */}
      <footer className="mt-auto py-6 border-t border-dark-border text-center text-[10px] font-bold tracking-widest text-slate-600">
        &copy; {new Date().getFullYear()} Domestique Index Admin Panel
      </footer>
    </div>
  );
}
