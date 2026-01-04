'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Application } from '@/types';
import { mapDbUserToUser } from '@/lib/user-mapper';
import { getOrCreateConversation } from './useDbChat';

export function useDbApplications(requestId: string) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = async () => {
    if (!requestId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('applications')
      .select(`*, user:users!applications_user_id_fkey(*)`)
      .eq('request_id', requestId)
      .order('created_at', { ascending: false })
      .limit(50); // Pagination: limit to latest 50 applications

    if (error) {
      console.error('Error fetching applications:', error);
    } else {
      const mapped: Application[] = (data || []).map((row: any) => ({
        id: row.id,
        requestId: row.request_id,
        userId: row.user_id,
        user: mapDbUserToUser(row.user),
        message: row.message || '',
        status: row.status,
        createdAt: row.created_at,
      }));
      setApplications(mapped);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchApplications();
    
    const channel = supabase
      .channel(`req-apps-${requestId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'applications',
          filter: `request_id=eq.${requestId}`,
        },
        () => {
          fetchApplications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId]);

  const acceptApplication = async (appId: string, applicantId: string, ownerId: string) => {
    // 1. Update this application to 'accepted'
    const { error: appErr } = await supabase
      .from('applications')
      .update({ status: 'accepted' })
      .eq('id', appId);
    if (appErr) throw appErr;

    // 2. Reject others (optional logic, usually date is 1-1, so we reject pending ones)
    // await supabase.from('applications').update({ status: 'rejected' }).eq('request_id', requestId).neq('id', appId);

    // 3. Update request status to 'matched'
    await supabase
      .from('date_requests')
      .update({ status: 'matched' })
      .eq('id', requestId);

    // 4. Create Notification for applicant
    await supabase.from('notifications').insert({
      user_id: applicantId,
      type: 'accepted',
      title: 'Ứng tuyển thành công! 🎉',
      message: 'Chủ bài đăng đã chấp nhận bạn. Hãy bắt đầu trò chuyện ngay.',
      data: { requestId },
    });

    // 5. Create conversation
    const conversationId = await getOrCreateConversation(ownerId, applicantId);
    
    return conversationId;
  };

  const rejectApplication = async (appId: string) => {
    const { error } = await supabase
      .from('applications')
      .update({ status: 'rejected' })
      .eq('id', appId);
    
    if (error) throw error;
  };

  return { applications, loading, acceptApplication, rejectApplication };
}