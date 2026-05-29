import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Detect if we should run in demo/mock mode
export const isDemoMode = !supabaseUrl || !supabaseAnonKey || !supabaseUrl.startsWith('http');

if (isDemoMode) {
  console.warn(
    'Domestique Index App: Running in DEMO/MOCK mode. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local to connect to your real Supabase instance.'
  );
}

// In-memory mock database state for Demo Mode
interface MockRide {
  id: string;
  user_id: string;
  ride_title: string;
  intended_intensity: 'chill' | 'tempo' | 'hard' | 'race';
  actual_intensity: 'chill' | 'spicy' | 'attacked' | 'lied' | null;
  notes: string;
  summary: string;
  is_coffee_assassin_candidate: boolean;
  result_type: 'trustworthy' | 'liar' | 'zone2_criminal' | 'assassin' | 'chaos' | 'sandbagger' | 'neutral' | null;
  created_at: string;
  completed_at: string | null;
}

interface MockUser {
  id: string;
  username: string;
  email: string;
  is_admin: boolean;
  trust_score: number;
  created_at: string;
}

let mockUser: MockUser | null = null;

const getInitialMockUsers = (): MockUser[] => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('domestique_index_demo_users');
    if (stored) return JSON.parse(stored);
  }
  return [
    {
      id: 'user_1',
      username: 'Bryant_Rides',
      email: 'bryant@example.com',
      is_admin: true,
      trust_score: 85,
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'user_2',
      username: 'TadejPogacar',
      email: 'tadej@uae.com',
      is_admin: false,
      trust_score: 95,
      created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'user_3',
      username: 'WoutVanAert',
      email: 'wout@visma.com',
      is_admin: false,
      trust_score: 60,
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'user_4',
      username: 'FTP_Monster',
      email: 'ftp_monster@zwift.com',
      is_admin: false,
      trust_score: 35,
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'user_5',
      username: 'CoffeeAssassin',
      email: 'coffee_assassin@cafe.cc',
      is_admin: false,
      trust_score: 50,
      created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    }
  ];
};

const getInitialMockRides = (): MockRide[] => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('domestique_index_demo_rides');
    if (stored) return JSON.parse(stored);
  }
  return [
    // Bryant's rides
    {
      id: 'r1',
      user_id: 'user_1',
      ride_title: 'Sunday Recovery Roll ☕',
      intended_intensity: 'chill',
      actual_intensity: 'spicy',
      notes: 'No attacking today. Heart rate stays below 120.',
      summary: 'Bryant attacked on the first climb. It became a sprint finish.',
      is_coffee_assassin_candidate: true,
      result_type: 'zone2_criminal',
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      completed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'r2',
      user_id: 'user_1',
      ride_title: 'Easy Coffee Ride',
      intended_intensity: 'chill',
      actual_intensity: 'chill',
      notes: 'Strictly zone 2 and croissants.',
      summary: 'Actually kept it chill. Had delicious flat whites.',
      is_coffee_assassin_candidate: false,
      result_type: 'trustworthy',
      created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      completed_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    },
    // Tadej's rides
    {
      id: 'r3',
      user_id: 'user_2',
      ride_title: 'Zone 2 recovery spin',
      intended_intensity: 'chill',
      actual_intensity: 'chill',
      notes: 'Recovery from Tour stages.',
      summary: 'Rode Urska at 250W. Super chill.',
      is_coffee_assassin_candidate: false,
      result_type: 'trustworthy',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      completed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'r4',
      user_id: 'user_2',
      ride_title: 'Mona Lisa attack day',
      intended_intensity: 'hard',
      actual_intensity: 'attacked',
      notes: 'Going full gas on Cipressa.',
      summary: 'Dropped everyone. Absolute blast.',
      is_coffee_assassin_candidate: false,
      result_type: 'neutral',
      created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      completed_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
    // Wout's rides
    {
      id: 'r5',
      user_id: 'user_3',
      ride_title: 'Chill gravel spin',
      intended_intensity: 'chill',
      actual_intensity: 'spicy',
      notes: 'Coffee ride only.',
      summary: 'Average speed was 40km/h. Oops.',
      is_coffee_assassin_candidate: false,
      result_type: 'zone2_criminal',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      completed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'r6',
      user_id: 'user_3',
      ride_title: 'Croissant loop',
      intended_intensity: 'chill',
      actual_intensity: 'lied',
      notes: 'recovery ride.',
      summary: 'I sprinted up every hill. I cannot resist.',
      is_coffee_assassin_candidate: false,
      result_type: 'liar',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      completed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    // FTP Monster's rides
    {
      id: 'r7',
      user_id: 'user_4',
      ride_title: 'Zone 2 coffee ride',
      intended_intensity: 'chill',
      actual_intensity: 'lied',
      notes: 'No drop ride.',
      summary: 'Dropped everyone immediately.',
      is_coffee_assassin_candidate: true,
      result_type: 'assassin',
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      completed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'r8',
      user_id: 'user_4',
      ride_title: 'Active recovery',
      intended_intensity: 'chill',
      actual_intensity: 'spicy',
      notes: 'Legs are dead.',
      summary: 'Did 10 sprints at 1200W.',
      is_coffee_assassin_candidate: false,
      result_type: 'zone2_criminal',
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      completed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    // Coffee Assassin's rides
    {
      id: 'r9',
      user_id: 'user_5',
      ride_title: 'Saturdays easy social',
      intended_intensity: 'chill',
      actual_intensity: 'lied',
      notes: 'Strict zone 1.',
      summary: 'Ripped the front of the peloton to shreds.',
      is_coffee_assassin_candidate: true,
      result_type: 'assassin',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      completed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    }
  ];
};

const getInitialMockBadges = (): string[] => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('domestique_index_demo_badges');
    if (stored) return JSON.parse(stored);
  }
  return ['trustworthy', 'zone2_criminal'];
};

let mockUsers: MockUser[] = getInitialMockUsers();
let mockRides: MockRide[] = getInitialMockRides();
let mockEarnedBadges: string[] = getInitialMockBadges();

const saveMockData = () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('domestique_index_demo_rides', JSON.stringify(mockRides));
    localStorage.setItem('domestique_index_demo_badges', JSON.stringify(mockEarnedBadges));
    localStorage.setItem('domestique_index_demo_users', JSON.stringify(mockUsers));
  }
};

// Real Supabase Client
export const supabase = !isDemoMode
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (null as any);

// Mock Client Implementation
export const mockSupabase = {
  auth: {
    getUser: async () => {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('domestique_index_demo_user');
        if (stored) {
          mockUser = JSON.parse(stored);
        }
      }
      return { data: { user: mockUser ? { id: mockUser.id, email: mockUser.email, user_metadata: { full_name: mockUser.username, avatar_url: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${mockUser.username}` } } : null }, error: null };
    },
    signInWithOAuth: async () => {
      const demoNames = ['WoutVanAert', 'TadejPogacar', 'GravelGrinder', 'SprinterSam', 'FTP_Monster'];
      const randomName = demoNames[Math.floor(Math.random() * demoNames.length)] + Math.floor(Math.random() * 100);
      mockUser = {
        id: 'demo_user_id_' + Math.random(),
        username: randomName,
        email: `${randomName.toLowerCase()}@example.com`,
        is_admin: true, // Make admin default for simple local demo mode verification
        trust_score: 82,
        created_at: new Date().toISOString(),
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('domestique_index_demo_user', JSON.stringify(mockUser));
        
        // Also register this user in the public mock users list
        const storedUsers = localStorage.getItem('domestique_index_demo_users');
        const usersList: MockUser[] = storedUsers ? JSON.parse(storedUsers) : [...mockUsers];
        if (!usersList.some(u => u.id === mockUser?.id)) {
          usersList.push(mockUser);
          localStorage.setItem('domestique_index_demo_users', JSON.stringify(usersList));
        }
      }
      window.location.reload();
      return { data: null, error: null };
    },
    signOut: async () => {
      mockUser = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('domestique_index_demo_user');
      }
      window.location.reload();
      return { error: null };
    },
    onAuthStateChange: (callback: any) => {
      // Simulate auth trigger
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('domestique_index_demo_user');
        if (stored) {
          const user = JSON.parse(stored);
          callback('SIGNED_IN', { user: { id: user.id, email: user.email, user_metadata: { full_name: user.username } } });
        } else {
          callback('SIGNED_OUT', null);
        }
      }
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
  },
  from: (table: string) => {
    return {
      select: (query: string = '*') => {
        return {
          eq: (column: string, value: any) => {
            return {
              single: async () => {
                if (table === 'users') {
                  const storedUsers = typeof window !== 'undefined' ? localStorage.getItem('domestique_index_demo_users') : null;
                  const list: MockUser[] = storedUsers ? JSON.parse(storedUsers) : mockUsers;
                  const matched = list.find(u => u.id === value);
                  if (matched) {
                    return { data: matched, error: null };
                  }
                  
                  const stored = typeof window !== 'undefined' ? localStorage.getItem('domestique_index_demo_user') : null;
                  const currentU = stored ? JSON.parse(stored) : mockUser;
                  if (currentU && currentU.id === value) {
                    return { data: currentU, error: null };
                  }
                  // Fallback for public profile lookup
                  return { data: { id: value, username: 'PelotonLegend', email: 'legend@peloton.com', is_admin: false, trust_score: 65, created_at: new Date().toISOString() }, error: null };
                }
                return { data: null, error: { message: 'Not found' } };
              },
              order: (col: string, { ascending }: { ascending: boolean }) => {
                return {
                  then: async (resolve: any) => {
                    if (table === 'rides') {
                      let list = mockRides.filter(r => r.user_id === value);
                      list.sort((a, b) => ascending ? a.created_at.localeCompare(b.created_at) : b.created_at.localeCompare(a.created_at));
                      resolve({ data: list, error: null });
                    } else if (table === 'user_badges') {
                      resolve({ data: mockEarnedBadges.map(bid => ({ badge_id: bid })), error: null });
                    } else {
                      resolve({ data: [], error: null });
                    }
                  }
                };
              }
            };
          },
          then: async (resolve: any) => {
            if (table === 'badges') {
              resolve({
                data: [
                  { id: 'trustworthy', name: 'Trustworthy Cyclist', description: 'Declared a chill ride and actually stayed chill.', icon: '😌' },
                  { id: 'liar', name: 'Certified Liar', description: 'Declared a chill ride but went full gas.', icon: '🤥' },
                  { id: 'zone2_criminal', name: 'Zone 2 Criminal', description: 'Claimed a recovery spin but suffered in Zone 5.', icon: '🚓' },
                  { id: 'assassin', name: 'Coffee Ride Assassin', description: 'Claimed a coffee ride but did 100km+ or dropped everyone.', icon: '🥷' },
                  { id: 'chaos', name: 'Chaos Rider', description: 'Kept everyone guessing with highly erratic ride intensities.', icon: '🌀' },
                  { id: 'sandbagger', name: 'Sandbagger', description: 'Declared a hard ride or race simulation but took it easy.', icon: '🎒' }
                ],
                error: null
              });
            } else if (table === 'rides') {
              resolve({ data: mockRides, error: null });
            } else if (table === 'users') {
              const storedUsers = typeof window !== 'undefined' ? localStorage.getItem('domestique_index_demo_users') : null;
              const list = storedUsers ? JSON.parse(storedUsers) : mockUsers;
              resolve({ data: list, error: null });
            } else {
              resolve({ data: [], error: null });
            }
          }
        };
      },
      insert: (data: any) => {
        return {
          select: () => {
            return {
              single: async () => {
                if (table === 'rides') {
                  const newRide: MockRide = {
                    id: 'ride_' + Math.random(),
                    user_id: data.user_id || 'demo_user_id',
                    ride_title: data.ride_title,
                    intended_intensity: data.intended_intensity,
                    actual_intensity: null,
                    notes: data.notes || '',
                    summary: '',
                    is_coffee_assassin_candidate: data.is_coffee_assassin_candidate || false,
                    result_type: null,
                    created_at: new Date().toISOString(),
                    completed_at: null,
                  };
                  mockRides = [newRide, ...mockRides];
                  saveMockData();
                  return { data: newRide, error: null };
                }
                if (table === 'user_badges') {
                  if (!mockEarnedBadges.includes(data.badge_id)) {
                    mockEarnedBadges.push(data.badge_id);
                    saveMockData();
                  }
                  return { data, error: null };
                }
                return { data, error: null };
              }
            };
          }
        };
      },
      delete: () => {
        return {
          eq: (column: string, value: any) => {
            const executeDelete = () => {
              let deletedRows: any[] = [];
              if (table === 'rides') {
                const matched = mockRides.find(r => r.id === value);
                if (matched) deletedRows = [matched];
                mockRides = mockRides.filter(r => r.id !== value);
                saveMockData();
              } else if (table === 'user_badges') {
                if (column === 'user_id') {
                  deletedRows = mockEarnedBadges.map(bid => ({ badge_id: bid }));
                  mockEarnedBadges = [];
                  saveMockData();
                }
              }
              return deletedRows;
            };

            return {
              then: async (resolve: any) => {
                const deleted = executeDelete();
                const res = { data: deleted, error: null };
                if (resolve) resolve(res);
                return res;
              },
              select: () => {
                return {
                  then: async (resolve: any) => {
                    const deleted = executeDelete();
                    const res = { data: deleted, error: null };
                    if (resolve) resolve(res);
                    return res;
                  }
                };
              }
            };
          }
        };
      },
      update: (data: any) => {
        return {
          eq: (column: string, value: any) => {
            return {
              select: () => {
                return {
                  single: async () => {
                    if (table === 'rides') {
                      mockRides = mockRides.map(r => {
                        if (r.id === value) {
                          return {
                            ...r,
                            ...data,
                            completed_at: new Date().toISOString(),
                          };
                        }
                        return r;
                      });
                      saveMockData();
                      const updated = mockRides.find(r => r.id === value);
                      return { data: updated, error: null };
                    }
                    if (table === 'users') {
                      const stored = typeof window !== 'undefined' ? localStorage.getItem('domestique_index_demo_user') : null;
                      const currentU = stored ? JSON.parse(stored) : mockUser;
                      if (currentU && currentU.id === value) {
                        const updatedUser = { ...currentU, ...data };
                        if (typeof window !== 'undefined') {
                          localStorage.setItem('domestique_index_demo_user', JSON.stringify(updatedUser));
                        }
                        mockUser = updatedUser;
                        return { data: updatedUser, error: null };
                      }
                    }
                    return { data: null, error: null };
                  }
                };
              }
            };
          }
        };
      }
    };
  }
};
