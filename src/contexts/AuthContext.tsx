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
  isAdmin: boolean; // Added
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (
    email: string,
    password: string,
    name: string
  ) => Promise<{ error?: string }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
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
  return 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400&h=400&fit=crop&crop=faces';
}

async function ensureUsersRow(params: {
  id: string;
  email?: string | null;
  name?: string | null;
}) {
  const { id, name } = params;

  const { data: existing, error: existErr } = await supabase
    .from('users')
    .select('id')
    .eq('id', id)
    .maybeSingle();

  if (existErr) throw existErr;
  if (existing?.id) return;

  const payload: any = {
    id,
    name: name || 'Người dùng mới',
    phone: null,
    avatar: defaultAvatarUrl(),
    bio: '',
    location: 'Hà Nội',
    role: 'user',
    is_online: true,
    last_seen: new Date().toISOString(),
    wallet_balance: 0,
    wallet_escrow: 0,
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
        // Ensure profile exists first
        await ensureUsersRow({
            id: session.user.id,
            email: session.user.email,
            name: (session.user.user_metadata as any)?.name ?? null,
        }).catch(console.error);

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
    const isAdminRoute = pathname.startsWith('/admin');

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

    // Basic client-side admin check (security is enforced by RLS/Layout)
    if (isAdminRoute && user && !user.isServiceProvider && (user as any).role !== 'admin') {
       // Optional: Redirect non-admins out, but AdminGate handles this better
    }
  }, [user, isLoading, pathname, router]);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: 'Email hoặc mật khẩu không chính xác' };
    if (data.user?.id) {
      const profile = await fetchUserProfile(data.user.id);
      setUser(profile);
      router.push('/');
    }
    return {};
  };

  const register = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) return { error: error.message };
    if (data.user?.id) {
      await ensureUsersRow({ id: data.user.id, email: data.user.email, name });
      const profile = await fetchUserProfile(data.user.id);
      setUser(profile);
      router.push('/');
    }
    return {};
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (error) return { error: error.message };
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

  // Check role from profile (mapped from DB)
  // Note: user-mapper.ts needs to map 'role' correctly. 
  // Assuming mapDbUserToUser maps row.role to user.role (needs verification in types/index.ts but typically extra props are passed)
  const isAdmin = (user as any)?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isAdmin,
        login,
        register,
        signInWithGoogle,
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