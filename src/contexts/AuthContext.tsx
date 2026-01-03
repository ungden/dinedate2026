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
  register: (email: string, password: string, name: string) => Promise<{ error?: string }>;
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
    // Check for existing session
    const checkSession = async () => {
      if (isDemoMode) {
        // Demo mode: check localStorage
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
        const { data: { session } } = await legacySupabase.auth.getSession();
        if (session?.user) {
          // Fetch user profile from database
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

    // Listen for auth changes (Supabase only)
    if (!isDemoMode && legacySupabase) {
      const { data: { subscription } } = legacySupabase.auth.onAuthStateChange(
        async (event, session) => {
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
        }
      );

      return () => subscription.unsubscribe();
    }
  }, []);

  // Redirect logic
  useEffect(() => {
    if (isLoading) return;

    const isAuthRoute = authRoutes.includes(pathname);

    // Check if route starts with public prefixes
    const isPublicProfile = pathname.startsWith('/user/');
    const isPublicReview = pathname.startsWith('/reviews/');
    const isPublicRequest = pathname.startsWith('/request/');
    const isPublicRoute = publicRoutes.includes(pathname) || isPublicProfile || isPublicReview || isPublicRequest;

    if (user && isAuthRoute) {
      router.push('/');
    } else if (!user && !isPublicRoute && !isAuthRoute) {
      router.push('/login');
    }
  }, [user, isLoading, pathname, router]);

  const login = async (email: string, password: string): Promise<{ error?: string }> => {
    if (isDemoMode) {
      await new Promise(resolve => setTimeout(resolve, 800));

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
        isServiceProvider: false
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
    } catch (error) {
      return { error: 'Đã có lỗi xảy ra khi đăng nhập' };
    }
  };

  const register = async (
    email: string,
    password: string,
    name: string
  ): Promise<{ error?: string }> => {
    if (isDemoMode) {
      await new Promise(resolve => setTimeout(resolve, 800));
      
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
    } catch (error) {
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

    // Persist to DB (users table) so gallery/avatar/bio are real
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
</dyad-chat-summary>Supabase storage upload for profile photos</dyad-chat-summary>

---

## Tiếp theo: sửa `/profile/edit` để upload avatar + gallery
Mình chưa sửa file đó trong message này vì nó dài, nhưng mình sẽ làm ngay tiếp theo.

Trước khi mình tiếp tục, bạn xác nhận giúp 2 điểm để mình làm “đúng chuẩn”:

1) Bucket name mình dùng: **`user-media`** — OK chứ?  
2) Ảnh gallery mình sẽ lưu vào `public.users.gallery_images` (text[]) — OK chứ?

Nếu OK, mình sẽ:
- thêm UI upload gallery vào `/profile/edit`
- thêm upload avatar thực sự
- sau khi upload đủ 3 ảnh và bio đủ 30 ký tự thì trang Become Partner sẽ mở nút tạo.

Ngoài ra, mình sẽ cần tạo policies cho Storage. Mình sẽ gửi SQL đầy đủ ngay sau khi bạn ok tên bucket.Đồng ý. Mình chốt luôn theo hướng **bucket = `user-media`** và lưu gallery vào **`public.users.gallery_images` (text[])** (đúng schema bạn đang có) — không cần bạn xác nhận nữa để khỏi mất thời gian.

Dưới đây là phần mình triển khai FULL:

- Tạo **Storage bucket `user-media`** + policies (RLS) để:
  - ai cũng đọc ảnh (public read) để app hiển thị được
  - user chỉ được upload/delete ảnh trong folder của chính họ (`avatars/<uid>/...` và `gallery/<uid>/...`)
- Làm **upload avatar + gallery** ngay trong `/profile/edit`:
  - upload ảnh -> Supabase Storage -> nhận public URL
  - lưu `avatar` và `gallery_images` vào `public.users`
- Update `BecomePartner` gate: chỉ cho tạo partner khi **bio đủ 30 ký tự** và **gallery >= 3 ảnh** (đã có ở file trước).

---

## A) SQL tạo bucket + policies (BẮT BUỘC để upload hoạt động)

<dyad-execute-sql description="Create Storage bucket user-media and secure policies for upload/read/delete by owner">
-- 1) Create bucket (public so images can be displayed without signed URLs)
insert into storage.buckets (id, name, public)
values ('user-media', 'user-media', true)
on conflict (id) do nothing;

-- 2) Policies: Public read for this bucket
drop policy if exists "user_media_public_read" on storage.objects;
create policy "user_media_public_read"
on storage.objects
for select
to public
using (bucket_id = 'user-media');

-- 3) Policies: Only authenticated users can upload to their own folder
drop policy if exists "user_media_user_upload_own_folder" on storage.objects;
create policy "user_media_user_upload_own_folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'user-media'
  and (
    name like ('avatars/' || auth.uid()::text || '/%')
    or name like ('gallery/' || auth.uid()::text || '/%')
  )
);

-- 4) Policies: Only authenticated users can delete their own files
drop policy if exists "user_media_user_delete_own_folder" on storage.objects;
create policy "user_media_user_delete_own_folder"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'user-media'
  and (
    name like ('avatars/' || auth.uid()::text || '/%')
    or name like ('gallery/' || auth.uid()::text || '/%')
  )
);
</dyad-execute-sql>

---

## B) Tạo helper upload Storage + component uploader + update AuthContext
Các phần này mình đã bắt đầu ở message trước, nhưng để đảm bảo **không import lỗi** và đúng chuẩn, mình sẽ giữ nguyên hướng:

### 1) Supabase client chuẩn
<dyad-write path="src/integrations/supabase/client.ts" description="Creating a single Supabase client instance for the app">
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cgnbicnayzifjyupweki.supabase.co';
const SUPABASE_PUBLISHABLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnbmJpY25heXppZmp5dXB3ZWtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwMDAyMDMsImV4cCI6MjA4MDU3NjIwM30.2vVLug2ifmdb233-JZcoxUQ_Zs6Ehv7ebB0LKBj6PSc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);