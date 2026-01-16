'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BlockedUser {
  id: string;
  blockedUserId: string;
  blockedAt: string;
}

export function useBlockedUsers() {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Fetch current user ID
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.id) {
        setCurrentUserId(data.user.id);
      }
    };
    getCurrentUser();
  }, []);

  // Fetch blocked users
  const fetchBlockedUsers = useCallback(async () => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('blocked_users')
        .select('id, blocked_user_id, created_at')
        .eq('blocker_id', currentUserId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching blocked users:', error);
        setBlockedUsers([]);
      } else {
        setBlockedUsers(
          (data || []).map((row: any) => ({
            id: row.id,
            blockedUserId: row.blocked_user_id,
            blockedAt: row.created_at,
          }))
        );
      }
    } catch (err) {
      console.error('Error fetching blocked users:', err);
      setBlockedUsers([]);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (currentUserId) {
      fetchBlockedUsers();
    }
  }, [currentUserId, fetchBlockedUsers]);

  // Check if a user is blocked
  const isBlocked = useCallback(
    (userId: string): boolean => {
      return blockedUsers.some((b) => b.blockedUserId === userId);
    },
    [blockedUsers]
  );

  // Block a user
  const blockUser = useCallback(
    async (userId: string): Promise<boolean> => {
      if (!currentUserId) {
        console.error('Not logged in');
        return false;
      }

      if (currentUserId === userId) {
        console.error('Cannot block yourself');
        return false;
      }

      try {
        const { error } = await supabase.from('blocked_users').insert({
          blocker_id: currentUserId,
          blocked_user_id: userId,
        });

        if (error) {
          // Check if already blocked (unique constraint)
          if (error.code === '23505') {
            // Already blocked, consider it success
            return true;
          }
          console.error('Error blocking user:', error);
          return false;
        }

        // Refresh the list
        await fetchBlockedUsers();
        return true;
      } catch (err) {
        console.error('Error blocking user:', err);
        return false;
      }
    },
    [currentUserId, fetchBlockedUsers]
  );

  // Unblock a user
  const unblockUser = useCallback(
    async (userId: string): Promise<boolean> => {
      if (!currentUserId) {
        console.error('Not logged in');
        return false;
      }

      try {
        const { error } = await supabase
          .from('blocked_users')
          .delete()
          .eq('blocker_id', currentUserId)
          .eq('blocked_user_id', userId);

        if (error) {
          console.error('Error unblocking user:', error);
          return false;
        }

        // Refresh the list
        await fetchBlockedUsers();
        return true;
      } catch (err) {
        console.error('Error unblocking user:', err);
        return false;
      }
    },
    [currentUserId, fetchBlockedUsers]
  );

  return {
    blockedUsers,
    loading,
    isBlocked,
    blockUser,
    unblockUser,
    refresh: fetchBlockedUsers,
  };
}
