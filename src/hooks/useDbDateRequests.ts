'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DateRequest, ActivityType } from '@/types';
import { mapDbUserToUser } from '@/lib/user-mapper';

export function useDbDateRequests(activity?: ActivityType) {
  const [requests, setRequests] = useState<DateRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('date_requests')
        .select(`
          *,
          user:users(*)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(50); // Pagination: limit initial load

      if (activity) {
        query = query.eq('activity', activity);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching date requests:', JSON.stringify(error, null, 2));
        return;
      }

      const mapped: DateRequest[] = (data || []).map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        user: mapDbUserToUser(row.user),
        activity: row.activity as ActivityType,
        title: row.title,
        description: row.description || '',
        location: row.location,
        date: row.date,
        time: row.time,
        hiringAmount: Number(row.hiring_amount || 0),
        hiringOption: row.hiring_option || '',
        maxParticipants: row.max_participants || 1,
        currentParticipants: row.current_participants || 0,
        applicants: [], // Loaded separately if needed
        status: row.status as any,
        createdAt: row.created_at,
        expiresAt: undefined, // Logic handled via created_at in DB if needed
      }));

      setRequests(mapped);
    } catch (err) {
      console.error('Exception fetching date requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();

    // Subscribe to changes
    const channel = supabase
      .channel('public:date_requests')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'date_requests' },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activity]);

  return { requests, loading, refresh: fetchRequests };
}

export function useDbRequestDetail(requestId: string) {
  const [request, setRequest] = useState<DateRequest | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      // 1. Fetch request info
      const { data: reqData, error: reqError } = await supabase
        .from('date_requests')
        .select(`*, user:users(*)`)
        .eq('id', requestId)
        .single();

      if (reqError) throw reqError;

      // 2. Fetch applicants (users who applied) via applications table
      // We only need this if we are the owner, but for simplicity let's fetch basic count or check auth later
      // For now, let's just map the request
      const mappedRequest: DateRequest = {
        id: reqData.id,
        userId: reqData.user_id,
        user: mapDbUserToUser(reqData.user),
        activity: reqData.activity as ActivityType,
        title: reqData.title,
        description: reqData.description || '',
        location: reqData.location,
        date: reqData.date,
        time: reqData.time,
        hiringAmount: Number(reqData.hiring_amount || 0),
        hiringOption: reqData.hiring_option || '',
        maxParticipants: reqData.max_participants || 1,
        currentParticipants: reqData.current_participants || 0,
        applicants: [], // Populated below
        status: reqData.status as any,
        createdAt: reqData.created_at,
      };

      setRequest(mappedRequest);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (requestId) fetchDetail();
  }, [requestId]);

  return { request, loading, refresh: fetchDetail };
}