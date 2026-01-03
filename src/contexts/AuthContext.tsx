'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';
import { mapDbUserToUser } from '@/lib/user-mapper';
import { mapUserUpdatesToDb } from '@/lib/db-users';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (
    email: string,
    password: string,
    name: string
  ) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const publicRoutes = ['/login', '/register', '/', '/discover'];
const authRoutes = ['/login', '/register'];

async function fetchUserProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
  if (error) return null;
  if (!data) return null;
  return mapDbUserToUser(data as any);
}

function defaultAvatarUrl() {
  // Stable, non-broken default avatar hosted on Unsplash (already allowed in next.config.js)
  return 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400&h=400&fit=crop&crop=faces';
}

async function ensureUsersRow(params: {
  id: string;
  email?: string | null;
  name?: string | null;
}) {
  const { id, name } = params;

  // 1) Check if row exists (IMPORTANT: do not overwrite existing profile data)
  const { data: existing, error: existErr } = await supabase
    .from('users')
    .select('id')
    .eq('id', id)
    .maybeSingle();

  if (existErr) throw existErr;
  if (existing?.id) return;

  // 2) Insert minimal defaults only for first-time creation
  const payload: any = {
    id,
    name: name || 'Người dùng mới',
    phone: null,
    avatar: defaultAvatarUrl(),
    bio: '',
    birth_year: null,
    height: null,
    zodiac: null,
    personality_tags: [],
    location: 'Hà Nội',
    location_detail: null,
    latitude: null,
    longitude: null,
    role: 'user',
    is_partner_verified: false,
    is_online: true,
    last_seen: new Date().toISOString(),
    hourly_rate: 0,
    available_activities: [],
    partner_rules: '',
    voice_intro_url: null,
    gallery_images: [],
    wallet_balance: 0,
    wallet_escrow: 0,
    total_bookings: 0,
    total_earnings: 0,
    average_rating: 0,
    partner_agreed_at: null,
    partner_agreed_version: null,
  };

  const { error: insertErr } = await supabase.from('users').insert(payload);
  if (insertErr) throw insertErr;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!mounted) return;

      if (session?.user?.id) {
        await ensureUsersRow({
          id: session.user.id,
          email: session.user.email,
          name: (session.user.user_metadata as any)?.name ?? null,
        });

        const profile = await fetchUserProfile(session.user.id);
        setUser(profile);
      } else {
        setUser(null);
      }

      setIsLoading(false);
    };

    init();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_IN' && session?.user?.id) {
        await ensureUsersRow({
          id: session.user.id,
          email: session.user.email,
          name: (session.user.user_metadata as any)?.name ?? null,
        });

        const profile = await fetchUserProfile(session.user.id);
        setUser(profile);
      }

      if (event === 'SIGNED_OUT') {
        setUser(null);
      }

      if (event === 'USER_UPDATED' && session?.user?.id) {
        const profile = await fetchUserProfile(session.user.id);
        setUser(profile);
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const isAuthRoute = authRoutes.includes(pathname);

    const isPublicProfile = pathname.startsWith('/user/');
    const isPublicReview = pathname.startsWith('/reviews/');
    const isPublicRequest = pathname.startsWith('/request/');
    const isPublicRoute =
      publicRoutes.includes(pathname) ||
      isPublicProfile ||
      isPublicReview ||
      isPublicRequest;

    if (user && isAuthRoute) {
      router.push('/');
    } else if (!user && !isPublicRoute && !isAuthRoute) {
      router.push('/login');
    }
  }, [user, isLoading, pathname, router]);

  const login = async (
    email: string,
    password: string
  ): Promise<{ error?: string }> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: 'Email hoặc mật khẩu không chính xác' };
    }

    if (data.user?.id) {
      await ensureUsersRow({
        id: data.user.id,
        email: data.user.email,
        name: (data.user.user_metadata as any)?.name ?? null,
      });

      const profile = await fetchUserProfile(data.user.id);
      setUser(profile);
      router.push('/');
    }

    return {};
  };

  const register = async (
    email: string,
    password: string,
    name: string
  ): Promise<{ error?: string }> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });

    if (error) return { error: error.message };

    if (data.user?.id) {
      await ensureUsersRow({
        id: data.user.id,
        email: data.user.email,
        name,
      });

      const profile = await fetchUserProfile(data.user.id);
      setUser(profile);
      router.push('/');
    }

    return {};
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/login');
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user?.id) return;

    const dbUpdates = mapUserUpdatesToDb(updates);

    const { error } = await supabase.from('users').update(dbUpdates).eq('id', user.id);
    if (error) throw error;

    const refreshed = await fetchUserProfile(user.id);
    setUser(refreshed);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}