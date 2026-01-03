'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ServiceOffering } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

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

export function useDbMyServices() {
  const { user } = useAuth();
  const [services, setServices] = useState<ServiceOffering[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = user?.id;

  const reload = async () => {
    if (!userId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    setServices((data || []).map((r: any) => mapDbServiceToService(r as DbServiceRow)));
    setLoading(false);
  };

  useEffect(() => {
    if (!userId) {
      setServices([]);
      setLoading(false);
      return;
    }
    reload();
  }, [userId]);

  const addService = async (service: Omit<ServiceOffering, 'id'>) => {
    if (!userId) return;

    const payload = {
      user_id: userId,
      activity: service.activity,
      title: service.title,
      description: service.description ?? '',
      price: service.price,
      available: service.available ?? true,
    };

    const { error } = await supabase.from('services').insert(payload as any);
    if (error) throw error;

    await reload();
  };

  const updateService = async (serviceId: string, updates: Partial<ServiceOffering>) => {
    if (!userId) return;

    const payload: any = { ...updates };
    delete payload.id;

    const { error } = await supabase.from('services').update(payload).eq('id', serviceId).eq('user_id', userId);
    if (error) throw error;

    await reload();
  };

  const removeService = async (serviceId: string) => {
    if (!userId) return;

    const { error } = await supabase.from('services').delete().eq('id', serviceId).eq('user_id', userId);
    if (error) throw error;

    await reload();
  };

  return { services, loading, reload, addService, updateService, removeService };
}