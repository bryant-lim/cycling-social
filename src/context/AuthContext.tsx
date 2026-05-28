'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, mockSupabase, isDemoMode } from '../lib/supabaseClient';

interface UserProfile {
  id: string;
  username: string;
  trust_score: number;
  created_at?: string;
}

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const client = isDemoMode ? mockSupabase : supabase;

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await client
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error('Profile fetch failed:', err);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    // 1. Initial user check
    const checkUser = async () => {
      try {
        const { data: { user: currentUser } } = await client.auth.getUser();
        if (currentUser) {
          setUser(currentUser);
          await fetchProfile(currentUser.id);
        }
      } catch (err) {
        console.error('Initial user check failed:', err);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // 2. Auth changes listener
    const { data: { subscription } } = client.auth.onAuthStateChange(
      async (event: string, session: any) => {
        const currentUser = session?.user || null;
        setUser(currentUser);

        if (currentUser) {
          await fetchProfile(currentUser.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      if (isDemoMode) {
        await mockSupabase.auth.signInWithOAuth();
      } else {
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}`,
          },
        });
      }
    } catch (err) {
      console.error('Sign in failed:', err);
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await client.auth.signOut();
      setUser(null);
      setProfile(null);
    } catch (err) {
      console.error('Sign out failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signInWithGoogle,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
