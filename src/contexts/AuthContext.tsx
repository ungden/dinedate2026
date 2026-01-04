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

const publicRoutes = ['/login', '/register', '/', '/discover', '/search', '/about', '/safety'];
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
      console.warn('Error fetching profile from DB:', error.message);
      return null;
    }
    if (!data) return null;
    return mapDbUserToUser(data as any);
  } catch (error) {
    console.error('Exception fetching profile:', error);
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
    // Dùng maybeSingle để không throw error nếu không tìm thấy
    const { data: existing, error: existErr } = await supabase
      .from('users')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (existErr) {
        console.error("Check user exist error:", existErr);
        // Không return, cố gắng insert/upsert
    }
    
    if (existing?.id) return;

    const payload: any = {
      id,
      name: name || 'Người dùng mới',
      phone: null,
      avatar: avatar_url || 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400&h=400&fit=crop&crop=faces',
      bio: '',
      location: 'Hà Nội',
      role: 'user',
      is_online: true,
      last_seen: new Date().toISOString(),
      wallet_balance: 0,
      wallet_escrow: 0,
    };

    // Upsert để an toàn hơn
    const { error: insertErr } = await supabase.from('users').upsert(payload, { onConflict: 'id' });
    if (insertErr) {
        console.error("Insert user error:", insertErr);
    }
  } catch (error) {
    console.error('Error ensuring user row:', error);
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
        // 1. Lấy session hiện tại
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error("Supabase getSession error:", error);
            throw error;
        }

        setSession(currentSession);

        if (currentSession?.user) {
          // 2. Set user tạm thời từ session để UI hiển thị ngay lập tức
          const tempUser = createTempUserFromSession(currentSession);
          setUser(tempUser);

          // 3. Đảm bảo row tồn tại & fetch profile đầy đủ (chạy ngầm, không block loading quá lâu)
          // Chúng ta không await cái này để block isLoading, mà xử lý song song hoặc ngay sau đó
          ensureUsersRow({
            id: currentSession.user.id,
            email: currentSession.user.email,
            name: (currentSession.user.user_metadata as any)?.name ?? null,
            avatar_url: (currentSession.user.user_metadata as any)?.avatar_url ?? null,
          }).then(() => {
              return fetchUserProfile(currentSession.user.id);
          }).then((profile) => {
              if (profile && mountedRef.current) {
                  setUser(profile);
              }
          }).catch(err => console.error("Async profile fetch failed:", err));
        }
      } catch (error) {
        console.error('Auth initialization failed completely:', error);
        // Nếu lỗi nặng, clear hết để tránh kẹt
        if (mountedRef.current) {
            setUser(null);
            setSession(null);
        }
      } finally {
        // 4. QUAN TRỌNG: Luôn tắt loading
        if (mountedRef.current) setIsLoading(false);
      }
    };

    initAuth();

    // Listener thay đổi auth state
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mountedRef.current) return;
      
      console.log("Auth Event:", event);
      setSession(newSession);

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsLoading(false);
        router.push('/login');
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (newSession?.user) {
           // Cập nhật ngay user từ session nếu user đang null (để tránh flash)
           if (!user) {
               setUser(createTempUserFromSession(newSession));
           }
           // Fetch DB profile mới nhất
           const profile = await fetchUserProfile(newSession.user.id);
           if (mountedRef.current && profile) {
               setUser(profile);
           }
        }
        setIsLoading(false);
      }
    });

    return () => {
      mountedRef.current = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Điều hướng bảo vệ routes
  useEffect(() => {
    if (isLoading) return;

    const isAuthRoute = authRoutes.includes(pathname);
    const isPublicProfile = pathname.startsWith('/user/');
    const isPublicReview = pathname.startsWith('/reviews/');
    const isPublicRequest = pathname.startsWith('/request/');
    
    // Các route công khai không cần login
    const isPublicRoute =
      publicRoutes.includes(pathname) ||
      isPublicProfile ||
      isPublicReview ||
      isPublicRequest;

    if (user && isAuthRoute) {
      router.push('/');
    } else if (!user && !isPublicRoute && !isAuthRoute) {
      // Lưu lại url để redirect sau khi login (nếu muốn mở rộng sau này)
      router.push('/login');
    }
  }, [user, isLoading, pathname, router]);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: 'Email hoặc mật khẩu không chính xác' };
      
      // Không cần fetch profile ở đây, onAuthStateChange sẽ lo việc đó
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
        options: { 
            data: { 
                name,
                avatar_url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400&h=400&fit=crop&crop=faces'
            } 
        },
      });
      if (error) return { error: error.message };
      // User row sẽ được tạo bởi ensureUsersRow trong onAuthStateChange hoặc trigger DB
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
    setIsLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    localStorage.clear(); // Clear local storage để đảm bảo sạch sẽ
    setIsLoading(false);
    router.push('/login');
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user?.id) return;
    try {
        const dbUpdates = mapUserUpdatesToDb(updates);
        const { error } = await supabase.from('users').update(dbUpdates).eq('id', user.id);
        if (error) throw error;
        
        // Refresh local state
        await refreshProfile();
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