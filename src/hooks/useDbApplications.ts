'use client';

/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DateOrderApplication } from '@/types';
import { mapDbUserToUser } from '@/lib/user-mapper';

function toError(err: unknown, fallback = 'Da xay ra loi'): Error {
  if (err instanceof Error) return err;
  const anyErr = err as any;
  const msg = anyErr?.message || anyErr?.error_description || anyErr?.hint || fallback;
  return new Error(String(msg));
}

export function useDbApplications(orderId: string) {
  const [applications, setApplications] = useState<DateOrderApplication[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = async () => {
    if (!orderId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('date_order_applications')
      .select(`*, applicant:users!date_order_applications_applicant_id_fkey(*)`)
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching applications:', error);
    } else {
      const mapped: DateOrderApplication[] = (data || []).map((row: any) => ({
        id: row.id,
        orderId: row.order_id,
        applicantId: row.applicant_id,
        applicant: row.applicant ? mapDbUserToUser(row.applicant) : undefined,
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
      .channel(`order-apps-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'date_order_applications',
          filter: `order_id=eq.${orderId}`,
        },
        () => {
          fetchApplications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  const acceptApplication = async (appId: string, applicantId: string) => {
    // 1. Update this application to 'accepted'
    const { error: appErr } = await supabase
      .from('date_order_applications')
      .update({ status: 'accepted' })
      .eq('id', appId);
    if (appErr) throw toError(appErr, 'Khong the chap nhan don ung tuyen');

    // 2. Update date order status to 'matched' and set matched_user_id
    await supabase
      .from('date_orders')
      .update({ 
        status: 'matched', 
        matched_user_id: applicantId,
        matched_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    // 3. Reject other pending applications
    await supabase
      .from('date_order_applications')
      .update({ status: 'rejected' })
      .eq('order_id', orderId)
      .neq('id', appId)
      .eq('status', 'pending');

    // 4. Create Notification for applicant
    await supabase.from('notifications').insert({
      user_id: applicantId,
      type: 'date_order_matched',
      title: 'Ban da duoc match! 🎉',
      message: 'Chu don hen da chap nhan ban. Hen gap ban tai nha hang!',
      data: { orderId },
    });
  };

  const rejectApplication = async (appId: string) => {
    const { error } = await supabase
      .from('date_order_applications')
      .update({ status: 'rejected' })
      .eq('id', appId);
    
    if (error) throw toError(error, 'Khong the tu choi don ung tuyen');
  };

  return { applications, loading, acceptApplication, rejectApplication };
}
