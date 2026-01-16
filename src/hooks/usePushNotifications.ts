'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  isPushSupported,
  getNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  getPushSubscription,
  serializePushSubscription,
  sendLocalNotification,
  registerServiceWorker,
} from '@/lib/push-notifications';

interface UsePushNotificationsReturn {
  // State
  isSupported: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission | 'unsupported';
  isLoading: boolean;

  // Actions
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  sendNotification: (title: string, options?: NotificationOptions) => Promise<void>;
  checkSubscription: () => Promise<void>;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const { user, session } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('unsupported');
  const [isLoading, setIsLoading] = useState(true);

  // Initialize - check support and current state
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);

      // Check browser support
      const supported = isPushSupported();
      setIsSupported(supported);

      if (!supported) {
        setIsLoading(false);
        return;
      }

      // Check permission
      const perm = getNotificationPermission();
      setPermission(perm);

      // Register service worker (if not already)
      await registerServiceWorker();

      // Check current subscription
      const subscription = await getPushSubscription();
      setIsSubscribed(!!subscription);

      setIsLoading(false);
    };

    init();
  }, []);

  // Check subscription status
  const checkSubscription = useCallback(async () => {
    if (!isPushSupported()) return;

    const subscription = await getPushSubscription();
    setIsSubscribed(!!subscription);

    const perm = getNotificationPermission();
    setPermission(perm);
  }, []);

  // Save subscription to database
  const saveSubscriptionToDb = useCallback(
    async (subscription: PushSubscription) => {
      if (!user?.id || !session?.access_token) {
        console.warn('[usePush] No user or session to save subscription');
        return false;
      }

      try {
        const subscriptionJson = subscription.toJSON();
        const endpoint = subscriptionJson.endpoint || '';
        const p256dh = subscriptionJson.keys?.p256dh || '';
        const auth = subscriptionJson.keys?.auth || '';

        // Upsert subscription (update if exists, insert if not)
        const { error } = await supabase.from('push_subscriptions').upsert(
          {
            user_id: user.id,
            endpoint,
            p256dh,
            auth,
            subscription_json: serializePushSubscription(subscription),
            is_active: true,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,endpoint',
          }
        );

        if (error) {
          console.error('[usePush] Error saving subscription:', error);
          return false;
        }

        console.log('[usePush] Subscription saved to database');
        return true;
      } catch (error) {
        console.error('[usePush] Exception saving subscription:', error);
        return false;
      }
    },
    [user?.id, session?.access_token]
  );

  // Remove subscription from database
  const removeSubscriptionFromDb = useCallback(
    async (endpoint?: string) => {
      if (!user?.id) return false;

      try {
        let query = supabase.from('push_subscriptions').update({ is_active: false }).eq('user_id', user.id);

        if (endpoint) {
          query = query.eq('endpoint', endpoint);
        }

        const { error } = await query;

        if (error) {
          console.error('[usePush] Error removing subscription:', error);
          return false;
        }

        console.log('[usePush] Subscription deactivated in database');
        return true;
      } catch (error) {
        console.error('[usePush] Exception removing subscription:', error);
        return false;
      }
    },
    [user?.id]
  );

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isPushSupported()) {
      console.warn('[usePush] Push not supported');
      return false;
    }

    setIsLoading(true);

    try {
      const subscription = await subscribeToPush();

      if (!subscription) {
        setIsLoading(false);
        return false;
      }

      // Update state
      setIsSubscribed(true);
      setPermission(getNotificationPermission());

      // Save to database
      await saveSubscriptionToDb(subscription);

      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('[usePush] Subscribe error:', error);
      setIsLoading(false);
      return false;
    }
  }, [saveSubscriptionToDb]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isPushSupported()) return false;

    setIsLoading(true);

    try {
      // Get current subscription endpoint before unsubscribing
      const currentSubscription = await getPushSubscription();
      const endpoint = currentSubscription?.endpoint;

      const success = await unsubscribeFromPush();

      if (success) {
        setIsSubscribed(false);

        // Remove from database
        await removeSubscriptionFromDb(endpoint);
      }

      setIsLoading(false);
      return success;
    } catch (error) {
      console.error('[usePush] Unsubscribe error:', error);
      setIsLoading(false);
      return false;
    }
  }, [removeSubscriptionFromDb]);

  // Send a local notification
  const sendNotification = useCallback(async (title: string, options?: NotificationOptions) => {
    await sendLocalNotification(title, options);
  }, []);

  return {
    isSupported,
    isSubscribed,
    permission,
    isLoading,
    subscribe,
    unsubscribe,
    sendNotification,
    checkSubscription,
  };
}
