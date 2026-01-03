'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase as legacySupabase, isDemoMode } from '@/lib/supabase';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkSession = async () => {
      if (isDemoMode) {
        const savedUser = localStorage.getItem('dinedate-user');
        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser));
          } catch (e) {
            console.error('Error parsing saved user', e);
            localStorage.removeItem('dinedate-user');
          }
        }
        setIsLoading(false);
        return;
      }

      if (!legacySupabase) {
        setIsLoading(false);
        return;
      }

      try {
        const {
          data: { session },
        } = await legacySupabase.auth.getSession();

        if (session?.user) {
          const { data: profile } = await legacySupabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            setUser(profile as User);
          }
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    if (!isDemoMode && legacySupabase) {
      const {
        data: { subscription },
      } = legacySupabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user && legacySupabase) {
          const { data: profile } = await legacySupabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            setUser(profile as User);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      });

      return () => subscription.unsubscribe();
    }
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
    if (isDemoMode) {
      await new Promise((resolve) => setTimeout(resolve, 800));

      const demoUser: User = {
        id: `demo-${Date.now()}`,
        name: email.split('@')[0] || 'User',
        email: email,
        age: 25,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
        bio: 'Đây là tài khoản demo.',
        location: 'Việt Nam',
        wallet: { balance: 1000000, escrowBalance: 0, currency: 'VND' },
        vipStatus: { tier: 'free', benefits: [] },
        onlineStatus: { isOnline: true, lastSeen: new Date().toISOString() },
        isServiceProvider: false,
      };

      setUser(demoUser);
      localStorage.setItem('dinedate-user', JSON.stringify(demoUser));
      router.push('/');
      return {};
    }

    if (!legacySupabase) {
      return { error: 'Kết nối máy chủ thất bại.' };
    }

    try {
      const { data, error } = await legacySupabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: 'Email hoặc mật khẩu không chính xác' };
      }

      if (data.user) {
        const { data: profile } = await legacySupabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profile) {
          setUser(profile as User);
        }
        router.push('/');
      }

      return {};
    } catch {
      return { error: 'Đã có lỗi xảy ra khi đăng nhập' };
    }
  };

  const register = async (
    email: string,
    password: string,
    name: string
  ): Promise<{ error?: string }> => {
    if (isDemoMode) {
      await new Promise((resolve) => setTimeout(resolve, 800));

      const demoUser: User = {
        id: `demo-${Date.now()}`,
        name,
        email,
        age: 25,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
        bio: '',
        location: 'Việt Nam',
        wallet: { balance: 0, escrowBalance: 0, currency: 'VND' },
        vipStatus: { tier: 'free', benefits: [] },
        onlineStatus: { isOnline: true, lastSeen: new Date().toISOString() },
      };

      setUser(demoUser);
      localStorage.setItem('dinedate-user', JSON.stringify(demoUser));
      router.push('/');
      return {};
    }

    if (!legacySupabase) {
      return { error: 'Kết nối máy chủ thất bại.' };
    }

    try {
      const { data, error } = await legacySupabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        const newUser: Partial<User> = {
          id: data.user.id,
          name,
          email,
          age: 25,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.id}`,
          bio: '',
          location: 'Việt Nam',
          wallet: { balance: 0, escrowBalance: 0, currency: 'VND' },
          vipStatus: { tier: 'free', benefits: [] },
        };

        await legacySupabase.from('users').insert(newUser);
        setUser(newUser as User);
        router.push('/');
      }

      return {};
    } catch {
      return { error: 'Đã có lỗi xảy ra khi đăng ký' };
    }
  };

  const logout = async () => {
    if (isDemoMode) {
      localStorage.removeItem('dinedate-user');
      setUser(null);
      router.push('/login');
      return;
    }

    if (legacySupabase) {
      await legacySupabase.auth.signOut();
    }
    setUser(null);
    router.push('/login');
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;

    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);

    if (isDemoMode) {
      localStorage.setItem('dinedate-user', JSON.stringify(updatedUser));
      return;
    }

    const { error } = await supabase
      .from('users')
      .update(updates as any)
      .eq('id', user.id);

    if (error) throw error;
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