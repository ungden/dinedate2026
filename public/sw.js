/**
 * DineDate Service Worker
 * Handles push notifications and background sync
 */

const CACHE_NAME = 'dinedate-v1';
const APP_URL = self.location.origin;

// Default notification options
const DEFAULT_NOTIFICATION = {
  icon: '/icons/icon-192.png',
  badge: '/icons/badge-72.png',
  vibrate: [200, 100, 200],
  tag: 'dinedate-notification',
  renotify: true,
  requireInteraction: false,
  actions: [
    {
      action: 'open',
      title: 'Xem ngay',
    },
    {
      action: 'dismiss',
      title: 'Bỏ qua',
    },
  ],
};

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Service worker activated');

  event.waitUntil(
    Promise.all([
      // Claim all clients immediately
      self.clients.claim(),

      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName))
        );
      }),
    ])
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);

  let notificationData = {
    title: 'DineDate',
    body: 'Ban co thong bao moi',
    data: {},
  };

  // Parse push data
  if (event.data) {
    try {
      const payload = event.data.json();
      console.log('[SW] Push payload:', payload);

      notificationData = {
        title: payload.title || notificationData.title,
        body: payload.body || payload.message || notificationData.body,
        data: payload.data || {},
      };
    } catch (e) {
      // If not JSON, use as plain text body
      const text = event.data.text();
      if (text) {
        notificationData.body = text;
      }
      console.log('[SW] Push text:', text);
    }
  }

  // Build notification options
  const options = {
    ...DEFAULT_NOTIFICATION,
    body: notificationData.body,
    data: {
      ...notificationData.data,
      timestamp: Date.now(),
      url: notificationData.data.url || '/',
    },
  };

  // Customize based on notification type
  if (notificationData.data.type) {
    switch (notificationData.data.type) {
      case 'booking':
        options.tag = 'dinedate-booking';
        options.icon = '/icons/icon-booking.png';
        options.actions = [
          { action: 'view_booking', title: 'Xem booking' },
          { action: 'dismiss', title: 'Bỏ qua' },
        ];
        break;

      case 'message':
        options.tag = 'dinedate-message';
        options.icon = '/icons/icon-message.png';
        options.actions = [
          { action: 'reply', title: 'Trả lời' },
          { action: 'dismiss', title: 'Bỏ qua' },
        ];
        break;

      case 'payment':
        options.tag = 'dinedate-payment';
        options.icon = '/icons/icon-wallet.png';
        options.actions = [
          { action: 'view_wallet', title: 'Xem ví' },
          { action: 'dismiss', title: 'Bỏ qua' },
        ];
        break;

      default:
        break;
    }
  }

  // Show the notification
  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// Notification click event - handle user interactions
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action, event.notification.data);

  // Close the notification
  event.notification.close();

  const action = event.action;
  const data = event.notification.data || {};

  // Determine target URL based on action
  let targetUrl = APP_URL;

  if (action === 'dismiss') {
    // Just close, don't open app
    return;
  }

  // Handle different actions
  switch (action) {
    case 'view_booking':
      targetUrl = data.bookingId
        ? `${APP_URL}/manage-bookings?id=${data.bookingId}`
        : `${APP_URL}/manage-bookings`;
      break;

    case 'reply':
    case 'view_message':
      targetUrl = data.chatId
        ? `${APP_URL}/chat/${data.chatId}`
        : `${APP_URL}/messages`;
      break;

    case 'view_wallet':
      targetUrl = `${APP_URL}/wallet`;
      break;

    case 'open':
    default:
      // Use URL from notification data or default to home
      targetUrl = data.url ? `${APP_URL}${data.url}` : APP_URL;
      break;
  }

  // Focus existing window or open new one
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Try to focus an existing window
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.startsWith(APP_URL) && 'focus' in client) {
          client.focus();
          // Navigate to the target URL
          if (client.navigate) {
            return client.navigate(targetUrl);
          }
          return client;
        }
      }

      // No existing window, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Notification close event - track dismissals (optional analytics)
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event.notification.tag);

  // Could send analytics about notification dismissal here
});

// Background sync event (for offline actions)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications());
  }
});

// Helper function to sync notifications when back online
async function syncNotifications() {
  // Placeholder for background sync logic
  // Could fetch missed notifications from server
  console.log('[SW] Syncing notifications...');
}

// Message event - handle messages from main app
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    self.registration.showNotification(title, {
      ...DEFAULT_NOTIFICATION,
      ...options,
    });
  }
});

console.log('[SW] Service worker loaded');
