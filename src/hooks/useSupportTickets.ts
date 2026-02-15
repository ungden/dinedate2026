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
  date_order_id?: string;
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
  date_order?: {
    id: string;
    description: string;
  };
  messages_count?: number;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  content: string;
  is_admin: boolean;
  created_at: string;
  sender?: {
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
  date_order_id?: string;
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
      toast.error('Bạn cần đăng nhập');
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
          date_order_id: input.date_order_id || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating ticket:', error);
        toast.error('Không thể tạo yêu cầu hỗ trợ');
        return null;
      }

      await fetchTickets();
      return data;
    } catch (err) {
      console.error('Error:', err);
      toast.error('Không thể tạo yêu cầu hỗ trợ');
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
        // Enrich messages with sender info
        const senderIds = [...new Set(messagesData?.map((m: any) => m.sender_id) || [])];

        if (senderIds.length > 0) {
          const { data: users } = await supabase
            .from('users')
            .select('id, name, avatar_url')
            .in('id', senderIds);

          const usersMap = new Map((users || []).map(u => [u.id, u]));

          const enrichedMessages = (messagesData || []).map((msg: any) => ({
            ...msg,
            sender: usersMap.get(msg.sender_id),
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
          sender_id: userId,
          content: message.trim(),
          is_admin: false,
        });

      if (error) {
        console.error('Error sending message:', error);
        toast.error('Không thể gửi tin nhắn');
        return false;
      }

      await fetchTicket();
      return true;
    } catch (err) {
      console.error('Error:', err);
      toast.error('Không thể gửi tin nhắn');
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
      const dateOrderIds = [...new Set(data.filter(t => t.date_order_id).map(t => t.date_order_id))];

      // Fetch users
      const { data: users } = await supabase
        .from('users')
        .select('id, name, avatar_url, email')
        .in('id', allUserIds);

      const usersMap = new Map((users || []).map(u => [u.id, u]));

      // Fetch date orders if any
      let dateOrdersMap = new Map();
      if (dateOrderIds.length > 0) {
        const { data: dateOrders } = await supabase
          .from('date_orders')
          .select('id, description')
          .in('id', dateOrderIds);
        dateOrdersMap = new Map((dateOrders || []).map(d => [d.id, d]));
      }

      // Fetch message counts
      const { data: messageCounts } = await supabase
        .from('ticket_messages')
        .select('ticket_id');

      const countMap = new Map<string, number>();
      (messageCounts || []).forEach((m: any) => {
        countMap.set(m.ticket_id, (countMap.get(m.ticket_id) || 0) + 1);
      });

      // Enrich tickets
      const enrichedTickets = data.map(ticket => ({
        ...ticket,
        user: usersMap.get(ticket.user_id),
        assigned_admin: ticket.assigned_to ? usersMap.get(ticket.assigned_to) : null,
        date_order: ticket.date_order_id ? dateOrdersMap.get(ticket.date_order_id) : null,
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
        toast.error('Không thể cập nhật ticket');
        return false;
      }

      await fetchTickets();
      return true;
    } catch (err) {
      console.error('Error:', err);
      toast.error('Không thể cập nhật ticket');
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
          sender_id: adminId,
          content: message.trim(),
          is_admin: true,
        });

      if (error) {
        console.error('Error sending admin message:', error);
        toast.error('Không thể gửi tin nhắn');
        return false;
      }

      await fetchTickets();
      return true;
    } catch (err) {
      console.error('Error:', err);
      toast.error('Không thể gửi tin nhắn');
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

      let dateOrderInfo = null;
      if (ticketData.date_order_id) {
        const { data: dateOrder } = await supabase
          .from('date_orders')
          .select('id, description')
          .eq('id', ticketData.date_order_id)
          .single();
        dateOrderInfo = dateOrder;
      }

      setTicket({
        ...ticketData,
        user: usersMap.get(ticketData.user_id),
        assigned_admin: ticketData.assigned_to ? usersMap.get(ticketData.assigned_to) : null,
        date_order: dateOrderInfo,
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
        // Enrich messages with sender info
        const msgSenderIds = [...new Set(messagesData?.map((m: any) => m.sender_id) || [])];

        if (msgSenderIds.length > 0) {
          const { data: msgUsers } = await supabase
            .from('users')
            .select('id, name, avatar_url')
            .in('id', msgSenderIds);

          const msgUsersMap = new Map((msgUsers || []).map(u => [u.id, u]));

          const enrichedMessages = (messagesData || []).map((msg: any) => ({
            ...msg,
            sender: msgUsersMap.get(msg.sender_id),
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
        toast.error('Không thể cập nhật ticket');
        return false;
      }

      await fetchTicket();
      return true;
    } catch (err) {
      console.error('Error:', err);
      toast.error('Không thể cập nhật ticket');
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
          sender_id: adminId,
          content: message.trim(),
          is_admin: true,
        });

      if (error) {
        console.error('Error sending admin message:', error);
        toast.error('Không thể gửi tin nhắn');
        return false;
      }

      await fetchTicket();
      return true;
    } catch (err) {
      console.error('Error:', err);
      toast.error('Không thể gửi tin nhắn');
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
