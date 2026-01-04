'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useRef,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';
import { mapDbUserToUser } from '@/lib/user-mapper';
import { mapUserUpdatesToDb } from '@/lib/db-users';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
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

const publicRoutes = ['/login', '/register', '/', '/discover', '/search', '/about', '/safety'];
const authRoutes = ['/login', '/register'];

async function fetchUserProfile(userId: string): Promise<User | null> {
  try {
    const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    if (!data) return null;
    return mapDbUserToUser(data as any);
  } catch (error) {
    console.error('Exception fetching profile:', error);
    return null;
  }
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

  try {
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
  } catch (error) {
    console.error('Error ensuring user row:', error);
    // Don't throw here to avoid blocking init, profile fetch will likely fail/return null anyway if this failed critically
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    const init = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        if (session?.user?.id) {
          await ensureUsersRow({
            id: session.user.id,
            email: session.user.email,
            name: (session.user.user_metadata as any)?.name ?? null,
          });

          const profile = await fetchUserProfile(session.user.id);
          if (mountedRef.current) {
            setUser(profile);
          }
        } else {
          if (mountedRef.current) {
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mountedRef.current) setUser(null);
      } finally {
        if (mountedRef.current) setIsLoading(false);
      }
    };

    init();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mountedRef.current) return;

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsLoading(false);
        // Only redirect if on a protected route
        if (!publicRoutes.includes(location.pathname) && !authRoutes.includes(location.pathname)) {
            router.push('/login');
        }
      } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        if (session?.user?.id) {
          // If we already have a user and IDs match, don't show loading
          // Just background update
          if (!user || user.id !== session.user.id) {
             // If different user (login), show loading or just fetch
             // We can keep isLoading true if it was true, but usually here it's already false or we want to update UI
          }
          
          const profile = await fetchUserProfile(session.user.id);
          if (mountedRef.current) setUser(profile);
        }
        if (mountedRef.current) setIsLoading(false);
      } else if (event === 'TOKEN_REFRESHED') {
        // Do nothing on token refresh to avoid UI flicker
        // The session is updated automatically by Supabase client
      }
    });

    return () => {
      mountedRef.current = false;
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
      // Save current path to redirect back after login? 
      // For now just go to login
      router.push('/login');
    }
  }, [user, isLoading, pathname, router]);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: 'Email hoặc mật khẩu không chính xác' };
      if (data.user?.id) {
        const profile = await fetchUserProfile(data.user.id);
        setUser(profile);
        router.push('/');
      }
      return {};
    } catch (e) {
      return { error: 'Đã xảy ra lỗi khi đăng nhập' };
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
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
    } catch (e) {
      return { error: 'Đã xảy ra lỗi khi đăng ký' };
    }
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
    try {
        const dbUpdates = mapUserUpdatesToDb(updates);
        const { error } = await supabase.from('users').update(dbUpdates).eq('id', user.id);
        if (error) throw error;
        const refreshed = await fetchUserProfile(user.id);
        setUser(refreshed);
    } catch (error: any) {
        console.error('Update user error:', error);
        toast.error('Cập nhật thất bại: ' + (error.message || 'Lỗi không xác định'));
        throw error;
    }
  };

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