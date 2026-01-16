'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useRef,
  useCallback,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';
import { mapDbUserToUser } from '@/lib/user-mapper';
import { mapUserUpdatesToDb } from '@/lib/db-users';
import toast from 'react-hot-toast';
import { Session } from '@supabase/supabase-js';
import { getStoredReferralCode, clearStoredReferralCode, REFERRAL_CODE_KEY } from '@/hooks/useReferral';
import { captureException, addBreadcrumb, setUser as setErrorTrackingUser } from '@/lib/error-tracking';

interface AuthContextType {
  user: User | null;
  session: Session | null;
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
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const publicRoutes = ['/login', '/register', '/', '/discover', '/search', '/about', '/safety', '/referral'];
const authRoutes = ['/login', '/register'];

// Helper: Tạo User tạm từ Session trong khi chờ DB
function createTempUserFromSession(session: Session): User {
  const metadata = session.user.user_metadata || {};
  return {
    id: session.user.id,
    name: metadata.name || session.user.email?.split('@')[0] || 'Người dùng',
    email: session.user.email,
    avatar: metadata.avatar_url || 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400&h=400&fit=crop&crop=faces',
    bio: '',
    location: 'Hà Nội',
    role: 'user',
    wallet: { balance: 0, escrowBalance: 0, currency: 'VND' },
    vipStatus: { tier: 'free', benefits: [] },
    onlineStatus: { isOnline: true },
    isServiceProvider: false,
    age: 0
  };
}

async function fetchUserProfile(userId: string): Promise<User | null> {
  try {
    const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
    if (error) {
      console.error('[Auth] Error fetching profile DB:', error);
      // Không throw để tránh crash app, nhưng log rõ ràng
      return null;
    }
    if (!data) {
        console.warn('[Auth] No user data returned for ID:', userId);
        return null;
    }
    return mapDbUserToUser(data as any);
  } catch (error) {
    console.error('[Auth] Exception fetching profile:', error);
    return null;
  }
}

async function ensureUsersRow(params: {
  id: string;
  email?: string | null;
  name?: string | null;
  avatar_url?: string | null;
}) {
  const { id, name, avatar_url } = params;

  try {
    const { data: existing, error: existErr } = await supabase
      .from('users')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (existErr) {
        console.error("[Auth] Check user exist error:", existErr);
    }

    if (existing?.id) return;

    console.log("[Auth] Creating new user row for:", id);

    // Check for referral code
    let referredBy: string | null = null;
    const storedReferralCode = getStoredReferralCode();

    if (storedReferralCode) {
      console.log("[Auth] Found stored referral code:", storedReferralCode);

      // Look up referrer by code
      const { data: referrer, error: referrerErr } = await supabase
        .from('users')
        .select('id')
        .eq('referral_code', storedReferralCode.toUpperCase())
        .single();

      if (referrerErr) {
        console.warn("[Auth] Could not find referrer:", referrerErr);
      } else if (referrer && referrer.id !== id) {
        // Make sure user isn't referring themselves
        referredBy = referrer.id;
        console.log("[Auth] User referred by:", referredBy);
      }

      // Clear the stored code
      clearStoredReferralCode();
    }

    const payload: any = {
      id,
      name: name || 'Nguoi dung moi',
      phone: null,
      avatar: avatar_url || 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400&h=400&fit=crop&crop=faces',
      bio: '',
      location: 'Ha Noi',
      role: 'user',
      is_online: true,
      last_seen: new Date().toISOString(),
      wallet_balance: 0,
      wallet_escrow: 0,
      referred_by: referredBy,
    };

    const { error: insertErr } = await supabase.from('users').upsert(payload, { onConflict: 'id' });
    if (insertErr) {
        console.error("[Auth] Insert user error:", insertErr);
        toast.error(`Loi tao ho so: ${insertErr.message}`);
    }

    // Create pending referral reward if referred
    if (referredBy) {
      const { error: rewardErr } = await supabase.from('referral_rewards').insert({
        referrer_id: referredBy,
        referred_id: id,
        referrer_reward: 50000,
        referred_reward: 30000,
        status: 'pending',
      });

      if (rewardErr) {
        console.error("[Auth] Error creating referral reward:", rewardErr);
      } else {
        console.log("[Auth] Created pending referral reward");

        // Notify the referrer
        await supabase.from('notifications').insert({
          user_id: referredBy,
          type: 'system',
          title: 'Thanh vien moi!',
          message: `${name || 'Mot nguoi dung'} da dang ky qua ma gioi thieu cua ban!`,
          read: false,
        });
      }
    }
  } catch (error) {
    console.error('[Auth] Error ensuring user row:', error);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const mountedRef = useRef(false);

  // Hàm load profile tách biệt
  const refreshProfile = useCallback(async () => {
    if (!session?.user?.id) return;
    const profile = await fetchUserProfile(session.user.id);
    if (profile && mountedRef.current) {
        setUser(profile);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    mountedRef.current = true;

    const initAuth = async () => {
      try {
        console.log("[Auth] Initializing...");
        
        // 1. Lấy session hiện tại
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error("[Auth] Get Session Error:", error);
            throw error;
        }

        setSession(currentSession);

        if (currentSession?.user) {
          console.log("[Auth] Session found for:", currentSession.user.email);

          // Set error tracking user context
          setErrorTrackingUser({
            id: currentSession.user.id,
            email: currentSession.user.email || undefined,
            name: (currentSession.user.user_metadata as any)?.name,
          });
          addBreadcrumb('auth', 'Session restored', { userId: currentSession.user.id });

          // 2. Set user tạm thời
          const tempUser = createTempUserFromSession(currentSession);
          setUser(tempUser);

          // 3. Fetch profile song song, không await blocking để UI render
          ensureUsersRow({
            id: currentSession.user.id,
            email: currentSession.user.email,
            name: (currentSession.user.user_metadata as any)?.name ?? null,
            avatar_url: (currentSession.user.user_metadata as any)?.avatar_url ?? null,
          }).then(() => {
              return fetchUserProfile(currentSession.user.id);
          }).then((profile) => {
              if (profile && mountedRef.current) {
                  console.log("[Auth] Profile loaded successfully");
                  setUser(profile);
              }
          }).catch(err => {
              console.error("[Auth] Async profile fetch failed:", err);
              // Không throw ở đây để tránh block app, chỉ log
          });
        } else {
            console.log("[Auth] No session found");
        }
      } catch (error: any) {
        console.error('[Auth] Initialization FAILED:', error);
        toast.error(`Lỗi khởi động: ${error.message || 'Unknown error'}`);
        
        // Clear state nếu lỗi nghiêm trọng
        if (mountedRef.current) {
            setUser(null);
            setSession(null);
        }
      } finally {
        if (mountedRef.current) setIsLoading(false);
      }
    };

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mountedRef.current) return;
      
      console.log(`[Auth] State Change: ${event}`);
      setSession(newSession);

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsLoading(false);
        router.push('/login');
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (newSession?.user) {
           if (!user) {
               setUser(createTempUserFromSession(newSession));
           }
           // Background fetch
           fetchUserProfile(newSession.user.id).then(profile => {
               if (mountedRef.current && profile) setUser(profile);
           });
        }
        setIsLoading(false);
      }
    });

    return () => {
      mountedRef.current = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Điều hướng
  useEffect(() => {
    if (isLoading) return;

    const isAuthRoute = authRoutes.includes(pathname);
    const isPublicProfile = pathname.startsWith('/user/');
    const isPublicReview = pathname.startsWith('/reviews/');
    const isPublicRequest = pathname.startsWith('/request/');
    const isReferralLanding = pathname.startsWith('/ref/');

    const isPublicRoute =
      publicRoutes.includes(pathname) ||
      isPublicProfile ||
      isPublicReview ||
      isPublicRequest ||
      isReferralLanding;

    if (user && isAuthRoute) {
      router.push('/');
    } else if (!user && !isPublicRoute && !isAuthRoute) {
      console.warn("[Auth] Redirecting to login because page is protected:", pathname);
      router.push('/login');
    }
  }, [user, isLoading, pathname, router]);

  const login = async (email: string, password: string) => {
    addBreadcrumb('auth', 'Login attempt', { email });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
          console.error("[Auth] Login error:", error);
          addBreadcrumb('auth', 'Login failed', { error: error.message });
          await captureException(error, {
            component: 'AuthContext',
            action: 'login',
            extra: { email },
          });
          return { error: error.message };
      }
      addBreadcrumb('auth', 'Login successful', { userId: data.user?.id });
      return {};
    } catch (e: any) {
      console.error("[Auth] Login exception:", e);
      await captureException(e, {
        component: 'AuthContext',
        action: 'login',
        extra: { email },
      });
      return { error: e.message || 'Đã xảy ra lỗi khi đăng nhập' };
    }
  };

  const register = async (email: string, password: string, name: string) => {
    addBreadcrumb('auth', 'Register attempt', { email, name });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                name,
                avatar_url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400&h=400&fit=crop&crop=faces'
            }
        },
      });
      if (error) {
          console.error("[Auth] Register error:", error);
          addBreadcrumb('auth', 'Register failed', { error: error.message });
          await captureException(error, {
            component: 'AuthContext',
            action: 'register',
            extra: { email, name },
          });
          return { error: error.message };
      }
      addBreadcrumb('auth', 'Register successful', { userId: data.user?.id });
      return {};
    } catch (e: any) {
      console.error("[Auth] Register exception:", e);
      await captureException(e, {
        component: 'AuthContext',
        action: 'register',
        extra: { email, name },
      });
      return { error: e.message || 'Đã xảy ra lỗi khi đăng ký' };
    }
  };

  const signInWithGoogle = async () => {
    addBreadcrumb('auth', 'Google sign-in attempt');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (error) {
      addBreadcrumb('auth', 'Google sign-in failed', { error: error.message });
      await captureException(error, {
        component: 'AuthContext',
        action: 'signInWithGoogle',
      });
      return { error: error.message };
    }
    addBreadcrumb('auth', 'Google sign-in redirecting');
    return {};
  };

  const logout = async () => {
    addBreadcrumb('auth', 'Logout attempt');
    setIsLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("[Auth] Logout error:", error);
      await captureException(error, {
        component: 'AuthContext',
        action: 'logout',
      });
    }

    setErrorTrackingUser(null);
    setUser(null);
    setSession(null);
    localStorage.clear();
    setIsLoading(false);
    addBreadcrumb('auth', 'Logout completed');
    router.push('/login');
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user?.id) return;
    try {
        const dbUpdates = mapUserUpdatesToDb(updates);
        const { error } = await supabase.from('users').update(dbUpdates).eq('id', user.id);
        if (error) throw error;
        await refreshProfile();
    } catch (error: any) {
        console.error('[Auth] Update user error:', error);
        toast.error('Cập nhật thất bại: ' + (error.message || 'Lỗi không xác định'));
        throw error;
    }
  };

  const isAdmin = (user as any)?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAuthenticated: !!user,
        isAdmin,
        login,
        register,
        signInWithGoogle,
        logout,
        updateUser,
        refreshProfile
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