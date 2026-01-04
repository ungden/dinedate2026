'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { mapDbUserToUser } from '@/lib/user-mapper';
import { User } from '@/types';

export interface DbConversation {
  id: string;
  partner: User;
  lastMessage: {
    content: string;
    created_at: string;
    is_read: boolean;
    sender_id: string;
    message_type: string;
  } | null;
  updated_at: string;
}

export interface DbMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'location' | 'image';
  metadata?: any;
  created_at: string;
  is_read: boolean;
}

export function useDbChat() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<DbConversation[]>([]);
  const [loading, setLoading] = useState(true);

  // Load conversations list
  const reloadConversations = async () => {
    if (!user?.id) return;
    
    // Fetch conversations where I am user_id OR partner_id
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        id,
        updated_at,
        user:users!conversations_user_id_fkey(*),
        partner:users!conversations_partner_id_fkey(*),
        messages:messages(content, created_at, is_read, sender_id, message_type)
      `)
      .or(`user_id.eq.${user.id},partner_id.eq.${user.id}`)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      return;
    }

    const formatted = data.map((c: any) => {
      // Determine who is the "other" person
      const isMeUser = c.user.id === user.id;
      const partnerRaw = isMeUser ? c.partner : c.user;
      const partner = mapDbUserToUser(partnerRaw);

      // Get last message
      const sortedMsgs = (c.messages || []).sort(
        (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      const lastMsg = sortedMsgs[0] || null;

      return {
        id: c.id,
        partner,
        lastMessage: lastMsg,
        updated_at: c.updated_at,
      };
    });

    setConversations(formatted);
    setLoading(false);
  };

  useEffect(() => {
    if (user?.id) {
      reloadConversations();

      const channel = supabase
        .channel('chat_list')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages' },
          () => {
            reloadConversations();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setConversations([]);
      setLoading(false);
    }
  }, [user?.id]);

  return { conversations, loading, reloadConversations };
}

export function useConversation(conversationId: string) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<DbMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [partner, setPartner] = useState<User | null>(null);

  // Fetch specific conversation details
  useEffect(() => {
    if (!conversationId || !user?.id) return;

    const fetchDetails = async () => {
      setLoading(true);
      
      // 1. Get Conversation Info
      const { data: conv } = await supabase
        .from('conversations')
        .select(`*, u:users!conversations_user_id_fkey(*), p:users!conversations_partner_id_fkey(*)`)
        .eq('id', conversationId)
        .single();

      if (conv) {
        const isMeUser = conv.user_id === user.id;
        const partnerRaw = isMeUser ? conv.p : conv.u;
        setPartner(mapDbUserToUser(partnerRaw));
      }

      // 2. Get Messages
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (msgs) {
        setMessages(msgs as DbMessage[]);
      }
      
      setLoading(false);
    };

    fetchDetails();

    // 3. Realtime Subscription
    const channel = supabase
      .channel(`conv_${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as DbMessage;
          setMessages((prev) => [...prev, newMsg]);
          
          if (newMsg.sender_id !== user.id) {
             markRead([newMsg.id]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user?.id]);

  const sendMessage = async (content: string, type: 'text' | 'location' | 'image' = 'text', metadata: any = {}) => {
    if (!user?.id || !conversationId) return;

    const { error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: content,
      message_type: type,
      metadata: metadata
    });

    if (error) {
      console.error('Send message failed:', error);
      throw error;
    }

    // Update conversation updated_at
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);
  };

  const markRead = async (messageIds: string[]) => {
    if (!messageIds.length) return;
    await supabase
      .from('messages')
      .update({ is_read: true })
      .in('id', messageIds);
  };

  return { messages, partner, loading, sendMessage, markRead };
}

export async function getOrCreateConversation(myId: string, otherId: string): Promise<string | null> {
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .or(`and(user_id.eq.${myId},partner_id.eq.${otherId}),and(user_id.eq.${otherId},partner_id.eq.${myId})`)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from('conversations')
    .insert({
      user_id: myId,
      partner_id: otherId,
      updated_at: new Date().toISOString()
    })
    .select('id')
    .single();

  if (error || !created) {
    console.error('Failed to create conversation', error);
    return null;
  }

  return created.id;
}