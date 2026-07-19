import { api } from '../api/client';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
const PUSH_ENABLED_KEY = 'attendance_push_enabled_v1';

/**
 * Convert a base64 VAPID key to Uint8Array for the browser API
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const cleanStr = base64String.trim();
  const padding = '='.repeat((4 - (cleanStr.length % 4)) % 4);
  const base64 = (cleanStr + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Check if push notifications are supported by this browser
 */
export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

/**
 * Check if user has enabled push notifications
 */
export function isPushEnabled(): boolean {
  return localStorage.getItem(PUSH_ENABLED_KEY) === 'true';
}

/**
 * Get current notification permission state
 */
export function getPermissionState(): NotificationPermission {
  if (!('Notification' in window)) return 'denied';
  return Notification.permission;
}

/**
 * Register the service worker and subscribe to push notifications
 */
export async function enablePushNotifications(): Promise<boolean> {
  if (!isPushSupported()) {
    throw new Error('Push notifications are not supported by this browser');
  }

  // Request notification permission
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission denied');
  }

  try {
    // Register the main service worker (which includes our push logic via importScripts)
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;

    // Get VAPID key from server if not in env
    let vapidKey = VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      const res = await api.get<{ publicKey: string }>('/api/employee/push/vapid-key');
      vapidKey = res.data.publicKey;
    }

    if (!vapidKey) {
      throw new Error('VAPID public key not available');
    }

    // Subscribe to push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey).buffer as ArrayBuffer,
    });

    // Send subscription to server
    const subJson = subscription.toJSON();
    await api.post('/api/employee/push/subscribe', {
      subscription: {
        endpoint: subJson.endpoint,
        keys: {
          p256dh: subJson.keys?.p256dh,
          auth: subJson.keys?.auth,
        },
      },
    });

    localStorage.setItem(PUSH_ENABLED_KEY, 'true');
    return true;
  } catch (error: any) {
    console.error('[Push] Enable failed:', error);
    
    // Provide a more descriptive error if it's an HTTP context issue
    if (error.name === 'NotAllowedError' || error.message.includes('permission denied')) {
      throw new Error('You must allow notifications in your browser settings.');
    }
    
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      throw new Error('Push notifications require HTTPS or localhost. If you are on a local network IP, it will not work.');
    }

    throw new Error(error.response?.data?.error || error.message || 'Unknown push setup error');
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function disablePushNotifications(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.getRegistration('/');
    if (registration) {
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        // Notify server to remove subscription
        await api.post('/api/employee/push/unsubscribe', {
          endpoint: subscription.endpoint,
        });
        await subscription.unsubscribe();
      }
    }

    localStorage.setItem(PUSH_ENABLED_KEY, 'false');
    return true;
  } catch (error) {
    console.error('[Push] Disable failed:', error);
    throw error;
  }
}

/**
 * Send a test notification to verify setup
 */
export async function sendTestNotification(): Promise<void> {
  await api.post('/api/employee/push/test');
}
