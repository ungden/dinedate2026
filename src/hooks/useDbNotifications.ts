'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Notification } from '@/types';

export function useDbNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!user?.id) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notifications:', error);
    } else {
      // Map DB snake_case to CamelCase types if needed, or cast
      const mapped: Notification[] = (data || []).map((n: any) => ({
        id: n.id,
        userId: n.user_id,
        type: n.type,
        title: n.title,
        message: n.message,
        data: n.data,
        read: n.is_read,
        createdAt: n.created_at,
      }));
      setNotifications(mapped);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      return;
    }

    fetchNotifications();

    const channel = supabase
      .channel('my-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const n = payload.new as any;
          const newNotif: Notification = {
            id: n.id,
            userId: n.user_id,
            type: n.type,
            title: n.title,
            message: n.message,
            data: n.data,
            read: n.is_read,
            createdAt: n.created_at,
          };
          setNotifications((prev) => [newNotif, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const markAsRead = async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;
    
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
  };

  return { notifications, loading, markAsRead, markAllAsRead };
}