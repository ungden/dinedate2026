'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, ServiceOffering } from '@/types';
import { mapDbUserToUser } from '@/lib/user-mapper';

type DbServiceRow = {
  id: string;
  user_id: string;
  activity: string;
  title: string;
  description: string;
  price: number;
  available: boolean;
  duration?: string;
  created_at?: string;
};

type DbUserRow = Record<string, any>;

function mapDbServiceToService(row: DbServiceRow): ServiceOffering {
  return {
    id: row.id,
    activity: row.activity as any,
    title: row.title,
    description: row.description ?? '',
    price: Number(row.price ?? 0),
    available: !!row.available,
    duration: (row.duration as any) === 'day' ? 'day' : 'session',
  };
}

export function useDbPartners(
  params: {
    search?: string;
    location?: string;
    coords?: { lat: number; lng: number } | null;
  } = {}
) {
  const { search, location, coords } = params;

  const [users, setUsers] = useState<(User & { distance?: number })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);

      let mappedUsers: (User & { distance?: number })[] = [];

      try {
        if (coords) {
          // GPS Search Mode
          const { data, error } = await supabase.rpc('get_nearby_partners', {
            my_lat: coords.lat,
            my_lng: coords.lng,
            radius_km: 50, // 50km radius
            search_query: search || '',
          });

          if (error) throw error;

          mappedUsers = (data || []).map((row: any) => {
            const user = mapDbUserToUser(row.user_data);
            return { ...user, distance: Number(row.dist_km) };
          });
        } else {
          // Normal Text Search Mode
          let usersQuery = supabase.from('users').select('*');

          if (location && location !== 'Tất cả') {
            usersQuery = usersQuery.ilike('location', `%${location.split(',')[0]}%`);
          }

          if (search && search.trim()) {
            const q = search.trim();
            usersQuery = usersQuery.or(`name.ilike.%${q}%,location.ilike.%${q}%`);
          }

          // IMPORTANT: do not filter by role here yet; we'll determine partner by services too.
          const { data: usersData, error: usersErr } = await usersQuery;
          if (usersErr) throw usersErr;

          mappedUsers = (usersData || []).map((r) => mapDbUserToUser(r as DbUserRow));
        }

        // Load services for these users
        const ids = mappedUsers.map((u) => u.id);
        let nextServices: Record<string, ServiceOffering[]> = {};

        if (ids.length > 0) {
          const { data: servicesData, error: servicesErr } = await supabase
            .from('services')
            .select('*')
            .in('user_id', ids);

          if (servicesErr) throw servicesErr;

          (servicesData || []).forEach((row: any) => {
            const s = mapDbServiceToService(row as DbServiceRow);
            const uid = (row as DbServiceRow).user_id;
            if (!nextServices[uid]) nextServices[uid] = [];
            nextServices[uid].push(s);
          });
        }

        if (cancelled) return;

        // Merge services, derive partner status from:
        // - role/verified (from mapper) OR
        // - having any services
        // Then apply visibility rule:
        // - Must be online to show in list (partner can hide themselves by switching offline)
        const providers = mappedUsers
          .map((u) => {
            const svs = nextServices[u.id] || [];
            const isPartnerDerived = !!u.isServiceProvider || svs.length > 0;
            return {
              ...u,
              services: svs,
              isServiceProvider: isPartnerDerived,
            };
          })
          .filter((u) => u.isServiceProvider)
          .filter((u) => u.onlineStatus?.isOnline !== false);

        setUsers(providers);
      } catch (err) {
        console.error('Error loading partners:', err);
      } finally {
        setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [search, location, coords?.lat, coords?.lng]);

  return { users, loading };
}