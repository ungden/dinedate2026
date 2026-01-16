'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

export type TicketCategory = 'booking' | 'payment' | 'account' | 'partner' | 'technical' | 'other';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed';

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  assigned_to?: string;
  related_booking_id?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  user?: {
    id: string;
    name: string;
    avatar_url: string;
    email?: string;
  };
  assigned_admin?: {
    id: string;
    name: string;
    avatar_url: string;
  };
  booking?: {
    id: string;
    activity: string;
  };
  messages_count?: number;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
  user?: {
    id: string;
    name: string;
    avatar_url: string;
  };
}

interface CreateTicketInput {
  subject: string;
  description: string;
  category: TicketCategory;
  priority?: TicketPriority;
  related_booking_id?: string;
}

// Hook for user's tickets
export function useSupportTickets() {
  const { user } = useAuth();
  const userId = user?.id;

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = useCallback(async () => {
    if (!userId) {
      setTickets([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching tickets:', error);
        setTickets([]);
      } else {
        setTickets(data || []);
      }
    } catch (err) {
      console.error('Error:', err);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const createTicket = async (input: CreateTicketInput): Promise<SupportTicket | null> => {
    if (!userId) {
      toast.error('Ban can dang nhap');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: userId,
          subject: input.subject,
          description: input.description,
          category: input.category,
          priority: input.priority || 'medium',
          related_booking_id: input.related_booking_id || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating ticket:', error);
        toast.error('Khong the tao yeu cau ho tro');
        return null;
      }

      await fetchTickets();
      return data;
    } catch (err) {
      console.error('Error:', err);
      toast.error('Khong the tao yeu cau ho tro');
      return null;
    }
  };

  return {
    tickets,
    loading,
    reload: fetchTickets,
    createTicket,
  };
}

// Hook for single ticket detail with messages
export function useTicketDetail(ticketId: string) {
  const { user } = useAuth();
  const userId = user?.id;

  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTicket = useCallback(async () => {
    if (!ticketId || !userId) {
      setTicket(null);
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Fetch ticket
      const { data: ticketData, error: ticketError } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('id', ticketId)
        .eq('user_id', userId)
        .single();

      if (ticketError) {
        console.error('Error fetching ticket:', ticketError);
        setTicket(null);
        setMessages([]);
        setLoading(false);
        return;
      }

      setTicket(ticketData);

      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        setMessages([]);
      } else {
        // Enrich messages with user info
        const userIds = [...new Set(messagesData?.map(m => m.user_id) || [])];

        if (userIds.length > 0) {
          const { data: users } = await supabase
            .from('users')
            .select('id, name, avatar_url')
            .in('id', userIds);

          const usersMap = new Map((users || []).map(u => [u.id, u]));

          const enrichedMessages = (messagesData || []).map(msg => ({
            ...msg,
            user: usersMap.get(msg.user_id),
          }));

          setMessages(enrichedMessages);
        } else {
          setMessages(messagesData || []);
        }
      }
    } catch (err) {
      console.error('Error:', err);
      setTicket(null);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [ticketId, userId]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  const sendMessage = async (message: string): Promise<boolean> => {
    if (!userId || !ticketId || !message.trim()) {
      return false;
    }

    try {
      const { error } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: ticketId,
          user_id: userId,
          message: message.trim(),
          is_admin: false,
        });

      if (error) {
        console.error('Error sending message:', error);
        toast.error('Khong the gui tin nhan');
        return false;
      }

      await fetchTicket();
      return true;
    } catch (err) {
      console.error('Error:', err);
      toast.error('Khong the gui tin nhan');
      return false;
    }
  };

  return {
    ticket,
    messages,
    loading,
    reload: fetchTicket,
    sendMessage,
  };
}

// Hook for admin - all tickets
export function useAdminSupportTickets() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = useCallback(async () => {
    setLoading(true);

    try {
      // Fetch all tickets using service role (admin page is protected)
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching tickets:', error);
        setTickets([]);
        return;
      }

      if (!data || data.length === 0) {
        setTickets([]);
        return;
      }

      // Get unique user IDs
      const userIds = [...new Set(data.map(t => t.user_id))];
      const assignedIds = [...new Set(data.filter(t => t.assigned_to).map(t => t.assigned_to))];
      const allUserIds = [...new Set([...userIds, ...assignedIds])];
      const bookingIds = [...new Set(data.filter(t => t.related_booking_id).map(t => t.related_booking_id))];

      // Fetch users
      const { data: users } = await supabase
        .from('users')
        .select('id, name, avatar_url, email')
        .in('id', allUserIds);

      const usersMap = new Map((users || []).map(u => [u.id, u]));

      // Fetch bookings if any
      let bookingsMap = new Map();
      if (bookingIds.length > 0) {
        const { data: bookings } = await supabase
          .from('bookings')
          .select('id, activity')
          .in('id', bookingIds);
        bookingsMap = new Map((bookings || []).map(b => [b.id, b]));
      }

      // Fetch message counts
      const { data: messageCounts } = await supabase
        .from('ticket_messages')
        .select('ticket_id');

      const countMap = new Map<string, number>();
      (messageCounts || []).forEach(m => {
        countMap.set(m.ticket_id, (countMap.get(m.ticket_id) || 0) + 1);
      });

      // Enrich tickets
      const enrichedTickets = data.map(ticket => ({
        ...ticket,
        user: usersMap.get(ticket.user_id),
        assigned_admin: ticket.assigned_to ? usersMap.get(ticket.assigned_to) : null,
        booking: ticket.related_booking_id ? bookingsMap.get(ticket.related_booking_id) : null,
        messages_count: countMap.get(ticket.id) || 0,
      }));

      setTickets(enrichedTickets);
    } catch (err) {
      console.error('Error:', err);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const updateTicket = async (
    ticketId: string,
    updates: Partial<Pick<SupportTicket, 'status' | 'priority' | 'assigned_to'>>
  ): Promise<boolean> => {
    try {
      const updateData: any = { ...updates };

      if (updates.status === 'resolved' || updates.status === 'closed') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('support_tickets')
        .update(updateData)
        .eq('id', ticketId);

      if (error) {
        console.error('Error updating ticket:', error);
        toast.error('Khong the cap nhat ticket');
        return false;
      }

      await fetchTickets();
      return true;
    } catch (err) {
      console.error('Error:', err);
      toast.error('Khong the cap nhat ticket');
      return false;
    }
  };

  const sendAdminMessage = async (ticketId: string, message: string, adminId: string): Promise<boolean> => {
    if (!ticketId || !message.trim() || !adminId) {
      return false;
    }

    try {
      const { error } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: ticketId,
          user_id: adminId,
          message: message.trim(),
          is_admin: true,
        });

      if (error) {
        console.error('Error sending admin message:', error);
        toast.error('Khong the gui tin nhan');
        return false;
      }

      await fetchTickets();
      return true;
    } catch (err) {
      console.error('Error:', err);
      toast.error('Khong the gui tin nhan');
      return false;
    }
  };

  return {
    tickets,
    loading,
    reload: fetchTickets,
    updateTicket,
    sendAdminMessage,
  };
}

// Hook for admin - single ticket detail with messages
export function useAdminTicketDetail(ticketId: string) {
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTicket = useCallback(async () => {
    if (!ticketId) {
      setTicket(null);
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Fetch ticket
      const { data: ticketData, error: ticketError } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('id', ticketId)
        .single();

      if (ticketError) {
        console.error('Error fetching ticket:', ticketError);
        setTicket(null);
        setMessages([]);
        setLoading(false);
        return;
      }

      // Enrich ticket with user info
      const userIds = [ticketData.user_id];
      if (ticketData.assigned_to) userIds.push(ticketData.assigned_to);

      const { data: users } = await supabase
        .from('users')
        .select('id, name, avatar_url, email')
        .in('id', userIds);

      const usersMap = new Map((users || []).map(u => [u.id, u]));

      let bookingInfo = null;
      if (ticketData.related_booking_id) {
        const { data: booking } = await supabase
          .from('bookings')
          .select('id, activity')
          .eq('id', ticketData.related_booking_id)
          .single();
        bookingInfo = booking;
      }

      setTicket({
        ...ticketData,
        user: usersMap.get(ticketData.user_id),
        assigned_admin: ticketData.assigned_to ? usersMap.get(ticketData.assigned_to) : null,
        booking: bookingInfo,
      });

      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        setMessages([]);
      } else {
        // Enrich messages with user info
        const msgUserIds = [...new Set(messagesData?.map(m => m.user_id) || [])];

        if (msgUserIds.length > 0) {
          const { data: msgUsers } = await supabase
            .from('users')
            .select('id, name, avatar_url')
            .in('id', msgUserIds);

          const msgUsersMap = new Map((msgUsers || []).map(u => [u.id, u]));

          const enrichedMessages = (messagesData || []).map(msg => ({
            ...msg,
            user: msgUsersMap.get(msg.user_id),
          }));

          setMessages(enrichedMessages);
        } else {
          setMessages(messagesData || []);
        }
      }
    } catch (err) {
      console.error('Error:', err);
      setTicket(null);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  const updateTicket = async (
    updates: Partial<Pick<SupportTicket, 'status' | 'priority' | 'assigned_to'>>
  ): Promise<boolean> => {
    if (!ticketId) return false;

    try {
      const updateData: any = { ...updates };

      if (updates.status === 'resolved' || updates.status === 'closed') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('support_tickets')
        .update(updateData)
        .eq('id', ticketId);

      if (error) {
        console.error('Error updating ticket:', error);
        toast.error('Khong the cap nhat ticket');
        return false;
      }

      await fetchTicket();
      return true;
    } catch (err) {
      console.error('Error:', err);
      toast.error('Khong the cap nhat ticket');
      return false;
    }
  };

  const sendMessage = async (message: string, adminId: string): Promise<boolean> => {
    if (!ticketId || !message.trim() || !adminId) {
      return false;
    }

    try {
      const { error } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: ticketId,
          user_id: adminId,
          message: message.trim(),
          is_admin: true,
        });

      if (error) {
        console.error('Error sending admin message:', error);
        toast.error('Khong the gui tin nhan');
        return false;
      }

      await fetchTicket();
      return true;
    } catch (err) {
      console.error('Error:', err);
      toast.error('Khong the gui tin nhan');
      return false;
    }
  };

  return {
    ticket,
    messages,
    loading,
    reload: fetchTicket,
    updateTicket,
    sendMessage,
  };
}
