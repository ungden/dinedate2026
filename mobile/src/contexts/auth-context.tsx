import React, { createContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { getDiceBearAvatar } from '@/lib/dicebear';
import { User } from '@/constants/types';
import { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null; session: Session | null; isLoading: boolean; isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (email: string, password: string, name: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  deleteAccount: () => Promise<{ error?: string }>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapDbToUser(data: any): User {
  return {
    id: data.id, name: data.name || 'Người dùng',
    age: data.birth_year ? new Date().getFullYear() - data.birth_year : 0,
    avatar: data.avatar || getDiceBearAvatar(data.id), realAvatar: data.real_avatar,
    bio: data.bio || '', location: data.location || 'Hà Nội',
    wallet: { balance: Number(data.wallet_balance || 0), escrowBalance: Number(data.wallet_escrow || 0), currency: 'VND' },
    vipStatus: { tier: data.vip_tier || 'free', benefits: [] },
    gender: data.gender, rating: data.rating, reviewCount: data.review_count,
    role: data.role || 'user', email: data.email, phone: data.phone,
    onlineStatus: { isOnline: data.is_online || false },
  };
}

function createTempUser(session: Session): User {
  const meta = session.user.user_metadata || {};
  return {
    id: session.user.id, name: meta.name || session.user.email?.split('@')[0] || 'Người dùng',
    age: 0, avatar: getDiceBearAvatar(session.user.id), bio: '', location: 'Hà Nội',
    wallet: { balance: 0, escrowBalance: 0, currency: 'VND' },
    vipStatus: { tier: 'free', benefits: [] }, role: 'user', email: session.user.email,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
      if (error) return null;
      return mapDbToUser(data);
    } catch { return null; }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!session?.user?.id) return;
    const profile = await fetchProfile(session.user.id);
    if (profile) setUser(profile);
  }, [session?.user?.id, fetchProfile]);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session: s } } = await supabase.auth.getSession();
        setSession(s);
        if (s?.user) {
          setUser(createTempUser(s));
          const profile = await fetchProfile(s.user.id);
          if (profile) setUser(profile);
        }
      } catch { /* init error */ }
      finally { setIsLoading(false); }
    };
    init();
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      if (event === 'SIGNED_OUT') { setUser(null); }
      else if (newSession?.user) {
        const profile = await fetchProfile(newSession.user.id);
        setUser(profile || createTempUser(newSession));
      }
    });
    return () => { listener.subscription.unsubscribe(); };
  }, [fetchProfile]);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? { error: error.message } : {};
  };

  const register = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { name, avatar_url: getDiceBearAvatar('temp') } } });
    return error ? { error: error.message } : {};
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'dinedate://reset-password',
    });
    return error ? { error: error.message } : {};
  };

  const deleteAccount = async () => {
    if (!session?.user?.id) return { error: 'Chưa đăng nhập' };
    try {
      // Delete user data from our tables first
      const userId = session.user.id;
      await supabase.from('person_reviews').delete().eq('reviewer_id', userId);
      await supabase.from('restaurant_reviews').delete().eq('reviewer_id', userId);
      await supabase.from('date_order_applications').delete().eq('applicant_id', userId);
      await supabase.from('wallet_transactions').delete().eq('user_id', userId);
      await supabase.from('users').delete().eq('id', userId);

      // Sign out (actual auth.users deletion requires admin/edge function)
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      return {};
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể xóa tài khoản';
      return { error: msg };
    }
  };

  return (
    <AuthContext.Provider value={{
      user, session, isLoading, isAuthenticated: !!user,
      login, register, logout, refreshProfile, resetPassword, deleteAccount,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải được sử dụng trong AuthProvider');
  return ctx;
}
