import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
    checkNotificationPermission,
    requestNotificationPermission,
    showNotification,
} from '../lib/notifications';
import type { NotificationPermission, NotificationSettings, NotificationOptions } from '../types/notification-types';

export function useNotifications() {
    const [permission, setPermission] = useState<NotificationPermission>({
        granted: false,
        denied: false,
        default: true,
    });
    const [settings, setSettings] = useState<NotificationSettings>({
        enabled: true,
        sound: true,
        preview: true,
    });
    const [loading, setLoading] = useState(true);

    // Load permission status
    useEffect(() => {
        checkNotificationPermission().then(setPermission);
    }, []);

    // Load user settings from database
    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('profiles')
                .select('notification_enabled, notification_sound, notification_preview')
                .eq('user_id', user.id)
                .single();

            if (error) throw error;

            if (data) {
                setSettings({
                    enabled: data.notification_enabled ?? true,
                    sound: data.notification_sound ?? true,
                    preview: data.notification_preview ?? true,
                });
            }
        } catch (error) {
            console.error('Failed to load notification settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const requestPermission = useCallback(async () => {
        const granted = await requestNotificationPermission();
        const newPermission = await checkNotificationPermission();
        setPermission(newPermission);
        return granted;
    }, []);

    const updateSettings = useCallback(async (newSettings: Partial<NotificationSettings>) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const updatedSettings = { ...settings, ...newSettings };

            const { error } = await supabase
                .from('profiles')
                .update({
                    notification_enabled: updatedSettings.enabled,
                    notification_sound: updatedSettings.sound,
                    notification_preview: updatedSettings.preview,
                })
                .eq('user_id', user.id);

            if (error) throw error;

            setSettings(updatedSettings);
        } catch (error) {
            console.error('Failed to update notification settings:', error);
            throw error;
        }
    }, [settings]);

    const notify = useCallback(async (options: NotificationOptions) => {
        // Check if notifications are enabled
        if (!settings.enabled || !permission.granted) {
            return;
        }

        // Show notification with sound based on settings
        await showNotification({
            ...options,
            sound: settings.sound && options.sound !== false,
        });
    }, [settings, permission]);

    return {
        permission,
        settings,
        loading,
        requestPermission,
        updateSettings,
        notify,
    };
}
