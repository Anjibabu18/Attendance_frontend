import React, { useEffect, useRef } from 'react';
import { useToast } from './Toast';
import { api } from '../api/client';
import { getPendingPunches, removePunch } from '../utils/offlineSync';

export const OfflineSyncManager: React.FC = () => {
  const { showToast } = useToast();
  const syncingRef = useRef(false);

  const syncPunches = async () => {
    if (syncingRef.current || !navigator.onLine) return;
    syncingRef.current = true;

    try {
      const pending = await getPendingPunches();
      if (!pending || pending.length === 0) {
        syncingRef.current = false;
        return;
      }

      console.log(`Syncing ${pending.length} offline punches...`);

      for (const punch of pending) {
        try {
          const fetchResponse = await fetch(punch.photoBase64);
          const blob = await fetchResponse.blob();
          const file = new File([blob], `${punch.kind}.jpg`, { type: 'image/jpeg' });

          const fd = new FormData();
          fd.append("photoBase64", punch.photoBase64);
          if (punch.latitude && punch.longitude) {
            fd.append("latitude", punch.latitude);
            fd.append("longitude", punch.longitude);
          }
          fd.append("deviceId", punch.deviceId);
          if (punch.qrToken) {
            fd.append("qrToken", punch.qrToken);
            if (punch.dailyCode) {
              fd.append("dailyCode", punch.dailyCode);
            }
          }
          fd.append("file", file);

          await api.post(`/api/employee/punch/${punch.kind}`, fd, {
            headers: { "Content-Type": "multipart/form-data" }
          });

          await removePunch(punch.id);
          showToast(`Offline ${punch.kind === 'checkin' ? 'Check-in' : 'Check-out'} synced successfully!`, 'success');
        } catch (e: any) {
          console.error('Failed to sync offline punch:', punch.id, e);
          // If the server rejected it (400), we should probably delete it to prevent infinite loops,
          // but for now we'll just leave it and try again later unless it's a 4xx error.
          if (e.response && e.response.status >= 400 && e.response.status < 500) {
            await removePunch(punch.id);
            showToast(`Offline punch rejected by server: ${e.response.data?.error || e.message}`, 'error');
          }
        }
      }
    } catch (e) {
      console.error('Error in offline sync manager:', e);
    } finally {
      syncingRef.current = false;
    }
  };

  useEffect(() => {
    // Sync when coming online
    const handleOnline = () => {
      console.log('Network connected. Attempting to sync offline punches...');
      syncPunches();
    };

    window.addEventListener('online', handleOnline);
    
    // Also try syncing periodically every 1 minute just in case the event was missed
    const interval = setInterval(syncPunches, 60 * 1000);
    
    // Initial check on mount
    syncPunches();

    return () => {
      window.removeEventListener('online', handleOnline);
      clearInterval(interval);
    };
  }, []);

  return null; // This is a logic-only component
};
