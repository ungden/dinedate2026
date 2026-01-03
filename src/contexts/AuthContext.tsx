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

async function ensureUsersRow(params: {
  id: string;
  email?: string | null;
  name?: string | null;
}) {
  const { id, email, name } = params;

  // Minimal safe defaults to satisfy NOT NULL constraints on public.users
  const payload: any = {
    id,
    name: name || 'Người dùng mới',
    phone: null,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`,
    bio: '',
    birth_year: null,
    height: null,
    zodiac: null,
    personality_tags: [],
    location: 'Hà Nội',
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

  // Try to preserve existing row if any; upsert by PK (id)
  const { error } = await supabase.from('users').upsert(payload, { onConflict: 'id' });
  if (error) throw error;

  // Store email inside auth only; public.users doesn't have email column by default in your schema dump.
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
        // Ensure profile row exists (for older accounts or race conditions)
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

    // Map app User updates to DB columns where needed
    const dbUpdates: any = { ...updates };

    if (updates.avatar !== undefined) dbUpdates.avatar = updates.avatar;
    if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
    if (updates.location !== undefined) dbUpdates.location = updates.location;
    if (updates.hourlyRate !== undefined) dbUpdates.hourly_rate = updates.hourlyRate;
    if (updates.images !== undefined) dbUpdates.gallery_images = updates.images;

    if (updates.partner_agreed_at !== undefined) dbUpdates.partner_agreed_at = updates.partner_agreed_at;
    if (updates.partner_agreed_version !== undefined) dbUpdates.partner_agreed_version = updates.partner_agreed_version;

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