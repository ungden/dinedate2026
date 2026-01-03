'use client';

import { useEffect, useMemo, useState } from 'react';
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
  };
}

export function useDbPartners(params: { search?: string; location?: string } = {}) {
  const { search, location } = params;

  const [users, setUsers] = useState<User[]>([]);
  const [servicesByUserId, setServicesByUserId] = useState<Record<string, ServiceOffering[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);

      // 1) Load users (public listing)
      let usersQuery = supabase.from('users').select('*');

      if (location && location !== 'Tất cả') {
        // Do a simple contains match (client-side list uses Vietnam strings; this is good enough)
        usersQuery = usersQuery.ilike('location', `%${location.split(',')[0]}%`);
      }

      if (search && search.trim()) {
        // OR search name/location
        const q = search.trim();
        usersQuery = usersQuery.or(`name.ilike.%${q}%,location.ilike.%${q}%`);
      }

      const { data: usersData, error: usersErr } = await usersQuery;
      if (usersErr) throw usersErr;

      const mappedUsers = (usersData || []).map((r) => mapDbUserToUser(r as DbUserRow));

      // 2) Load services for these users
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

      // only service providers: role partner / is_partner_verified OR have services
      const providers = mappedUsers
        .map((u) => ({
          ...u,
          services: nextServices[u.id] || [],
          isServiceProvider: u.isServiceProvider || (nextServices[u.id]?.length || 0) > 0,
        }))
        .filter((u) => u.isServiceProvider);

      setUsers(providers);
      setServicesByUserId(nextServices);
      setLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [search, location]);

  return { users, servicesByUserId, loading };
}