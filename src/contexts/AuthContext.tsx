'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase, isDemoMode } from '@/lib/supabase';
import { User } from '@/types';
import { CURRENT_USER } from '@/mocks/users';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (email: string, password: string, name: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
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
    // Check for existing session
    const checkSession = async () => {
      if (isDemoMode) {
        // Demo mode: check localStorage
        const savedUser = localStorage.getItem('dinedate-user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
        setIsLoading(false);
        return;
      }

      if (!supabase) {
        setIsLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Fetch user profile from database
          const { data: profile } = await supabase
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

    // Listen for auth changes (Supabase only)
    if (!isDemoMode && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (event === 'SIGNED_IN' && session?.user && supabase) {
            const { data: profile } = await supabase
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
        }
      );

      return () => subscription.unsubscribe();
    }
  }, []);

  // Redirect logic
  useEffect(() => {
    if (isLoading) return;

    const isAuthRoute = authRoutes.includes(pathname);

    // Check if route starts with /user/ (profile) or /request/ (request detail)
    const isPublicProfile = pathname.startsWith('/user/');
    const isPublicReview = pathname.startsWith('/reviews/');
    const isPublicRequest = pathname.startsWith('/request/');
    const isPublicRoute = publicRoutes.includes(pathname) || isPublicProfile || isPublicReview || isPublicRequest;

    if (user && isAuthRoute) {
      // Logged in user trying to access login/register -> redirect to home
      router.push('/');
    } else if (!user && !isPublicRoute && !isAuthRoute) {
      // Not logged in and trying to access protected route (e.g., /chat, /wallet, /profile)
      router.push('/login');
    }
  }, [user, isLoading, pathname, router]);

  const login = async (email: string, password: string): Promise<{ error?: string }> => {
    if (isDemoMode) {
      // Demo mode: simple login
      const demoUser: User = {
        ...CURRENT_USER,
        id: 'demo-user',
        email,
        name: email.split('@')[0],
      };
      setUser(demoUser);
      localStorage.setItem('dinedate-user', JSON.stringify(demoUser));
      router.push('/');
      return {};
    }

    if (!supabase) {
      return { error: 'Supabase not configured' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        const { data: profile } = await supabase
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
    } catch (error) {
      return { error: 'Đã có lỗi xảy ra' };
    }
  };

  const register = async (
    email: string,
    password: string,
    name: string
  ): Promise<{ error?: string }> => {
    if (isDemoMode) {
      // Demo mode: simple register
      const demoUser: User = {
        ...CURRENT_USER,
        id: 'demo-user-' + Date.now(),
        email,
        name,
      };
      setUser(demoUser);
      localStorage.setItem('dinedate-user', JSON.stringify(demoUser));
      router.push('/');
      return {};
    }

    if (!supabase) {
      return { error: 'Supabase not configured' };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
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
        // Create user profile
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

        await supabase.from('users').insert(newUser);
        setUser(newUser as User);
        router.push('/');
      }

      return {};
    } catch (error) {
      return { error: 'Đã có lỗi xảy ra' };
    }
  };

  const logout = async () => {
    if (isDemoMode) {
      localStorage.removeItem('dinedate-user');
      setUser(null);
      router.push('/login');
      return;
    }

    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    router.push('/login');
  };

  const updateUser = (updates: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    if (isDemoMode) {
      localStorage.setItem('dinedate-user', JSON.stringify(updatedUser));
    }
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