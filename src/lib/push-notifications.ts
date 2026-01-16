/**
 * Push Notifications Library for DineDate
 * Handles Web Push API integration for real-time notifications
 */

// Extended NotificationOptions to include vibrate pattern
interface ExtendedNotificationOptions extends NotificationOptions {
  vibrate?: number[];
  renotify?: boolean;
}

// VAPID public key - In production, generate your own key pair
// Generate with: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

/**
 * Check if push notifications are supported in the browser
 */
export function isPushSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isPushSupported()) {
    console.warn('[Push] Push notifications not supported');
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    console.log('[Push] Permission result:', permission);
    return permission;
  } catch (error) {
    console.error('[Push] Error requesting permission:', error);
    return 'denied';
  }
}

/**
 * Register the service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported()) {
    console.warn('[Push] Service workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    console.log('[Push] Service worker registered:', registration.scope);
    return registration;
  } catch (error) {
    console.error('[Push] Service worker registration failed:', error);
    return null;
  }
}

/**
 * Get the existing service worker registration
 */
export async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported()) return null;

  try {
    const registration = await navigator.serviceWorker.ready;
    return registration;
  } catch (error) {
    console.error('[Push] Error getting service worker:', error);
    return null;
  }
}

/**
 * Convert VAPID key from base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!isPushSupported()) {
    console.warn('[Push] Push not supported');
    return null;
  }

  const permission = await requestNotificationPermission();
  if (permission !== 'granted') {
    console.warn('[Push] Permission not granted');
    return null;
  }

  try {
    const registration = await registerServiceWorker();
    if (!registration) {
      console.error('[Push] No service worker registration');
      return null;
    }

    // Wait for service worker to be ready
    await navigator.serviceWorker.ready;

    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      console.log('[Push] Existing subscription found');
      return subscription;
    }

    // Create new subscription
    if (!VAPID_PUBLIC_KEY) {
      console.warn('[Push] VAPID public key not configured, using basic subscription');
      // For development/testing without VAPID
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
      });
    } else {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });
    }

    console.log('[Push] New subscription created:', subscription.endpoint);
    return subscription;
  } catch (error) {
    console.error('[Push] Error subscribing to push:', error);
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  if (!isPushSupported()) return false;

  try {
    const registration = await getServiceWorkerRegistration();
    if (!registration) return false;

    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      console.log('[Push] No subscription to unsubscribe');
      return true;
    }

    const success = await subscription.unsubscribe();
    console.log('[Push] Unsubscribe result:', success);
    return success;
  } catch (error) {
    console.error('[Push] Error unsubscribing:', error);
    return false;
  }
}

/**
 * Get current push subscription
 */
export async function getPushSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;

  try {
    const registration = await getServiceWorkerRegistration();
    if (!registration) return null;

    const subscription = await registration.pushManager.getSubscription();
    return subscription;
  } catch (error) {
    console.error('[Push] Error getting subscription:', error);
    return null;
  }
}

/**
 * Send a local notification (without push server)
 * Useful for in-app notification display
 */
export async function sendLocalNotification(
  title: string,
  options?: ExtendedNotificationOptions
): Promise<Notification | null> {
  if (!isPushSupported()) {
    console.warn('[Push] Notifications not supported');
    return null;
  }

  const permission = getNotificationPermission();
  if (permission !== 'granted') {
    console.warn('[Push] Permission not granted for local notification');
    return null;
  }

  try {
    const registration = await getServiceWorkerRegistration();

    const defaultOptions: ExtendedNotificationOptions = {
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      vibrate: [200, 100, 200],
      tag: 'dinedate-notification',
      renotify: true,
      requireInteraction: false,
      ...options,
    };

    // Use service worker to show notification (works in background)
    if (registration) {
      await registration.showNotification(title, defaultOptions as NotificationOptions);
      console.log('[Push] Local notification sent via SW:', title);
      return null; // SW notification doesn't return Notification object
    }

    // Fallback to regular Notification API
    const notification = new Notification(title, defaultOptions as NotificationOptions);
    console.log('[Push] Local notification sent:', title);
    return notification;
  } catch (error) {
    console.error('[Push] Error sending local notification:', error);
    return null;
  }
}

/**
 * Serialize push subscription for storage in database
 */
export function serializePushSubscription(subscription: PushSubscription): string {
  return JSON.stringify(subscription.toJSON());
}

/**
 * Check if user has already been asked about push notifications
 */
export function hasAskedForPushPermission(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('dinedate_push_asked') === 'true';
}

/**
 * Mark that user has been asked about push notifications
 */
export function setAskedForPushPermission(asked: boolean = true): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('dinedate_push_asked', asked ? 'true' : 'false');
}

/**
 * Check if user has skipped push notifications
 */
export function hasSkippedPushNotifications(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('dinedate_push_skipped') === 'true';
}

/**
 * Mark that user has skipped push notifications
 */
export function setSkippedPushNotifications(skipped: boolean = true): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('dinedate_push_skipped', skipped ? 'true' : 'false');
}

/**
 * Clear push notification preferences (for testing)
 */
export function clearPushPreferences(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('dinedate_push_asked');
  localStorage.removeItem('dinedate_push_skipped');
}
