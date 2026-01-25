import { useState, useEffect } from 'react';
import { 
  showNotification, 
  isAppFocused, 
  checkNotificationPermission,
  requestNotificationPermission as requestPermission,
} from '../lib/notifications';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToAllIncomingMessages } from '../lib/messages';
import { getProfile, updateProfile } from '../lib/profiles';

/**
 * Notification settings hook for managing user notification preferences
 */
export function useNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState({ granted: false, denied: false, default: true });
  const [settings, setSettings] = useState({
    enabled: true,
    sound: true,
    preview: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;

      try {
        // Check notification permission
        const perm = await checkNotificationPermission();
        setPermission(perm);

        // Load user notification settings from profile
        const profile = await getProfile(user.id);
        if (profile) {
          setSettings({
            enabled: profile.notification_enabled ?? true,
            sound: profile.notification_sound ?? true,
            preview: profile.notification_preview ?? true,
          });
        }
      } catch (error) {
        console.error('Error loading notification settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [user]);

  const requestNotificationPermission = async () => {
    const granted = await requestPermission();
    setPermission({ granted, denied: !granted, default: false });
    return granted;
  };

  const updateSettings = async (newSettings: Partial<typeof settings>) => {
    if (!user) return;

    const updated = { ...settings, ...newSettings };
    setSettings(updated);

    try {
      await updateProfile(user.id, {
        notification_enabled: updated.enabled,
        notification_sound: updated.sound,
        notification_preview: updated.preview,
      });
    } catch (error) {
      console.error('Error updating notification settings:', error);
    }
  };

  const notify = async (options: { title: string; body: string; sound?: boolean }) => {
    if (!settings.enabled) return;

    try {
      const focused = await isAppFocused();
      if (!focused) {
        await showNotification({
          title: options.title,
          body: settings.preview ? options.body : 'New message',
          sound: settings.sound && (options.sound ?? true),
        });
      }
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  };

  return {
    permission,
    settings,
    loading,
    requestPermission: requestNotificationPermission,
    updateSettings,
    notify,
  };
}

/**
 * Global message notifications hook
 * Shows notifications for new messages when app is not focused
 */
export function useMessageNotifications() {
  const { user } = useAuth();
  const { notify, settings } = useNotifications();

  useEffect(() => {
    if (!user || !settings.enabled) return;

    // Subscribe to all incoming messages for notifications
    const unsubscribe = subscribeToAllIncomingMessages(user.id, async (message, senderProfile) => {
      try {
        // Don't notify for own messages
        if (message.sender_id === user.id) return;

        const senderName = senderProfile?.display_name || 'Someone';
        const messagePreview = message.content.length > 50 
          ? message.content.substring(0, 50) + '...' 
          : message.content;
        
        await notify({
          title: `New message from ${senderName}`,
          body: messagePreview,
          sound: true,
        });
      } catch (error) {
        console.error('Error showing notification:', error);
      }
    });

    return unsubscribe;
  }, [user, notify, settings.enabled]);
}
