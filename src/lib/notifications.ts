import { invoke } from '@tauri-apps/api/core';
import type { NotificationPermission, NotificationOptions } from '../types/notification-types';

/**
 * Check current notification permission status
 */
export async function checkNotificationPermission(): Promise<NotificationPermission> {
    try {
        return await invoke<NotificationPermission>('check_notification_permission');
    } catch (error) {
        console.error('Failed to check notification permission:', error);
        return { granted: false, denied: false, default: true };
    }
}

/**
 * Request notification permission from the OS
 */
export async function requestNotificationPermission(): Promise<boolean> {
    try {
        return await invoke<boolean>('request_notification_permission');
    } catch (error) {
        console.error('Failed to request notification permission:', error);
        return false;
    }
}

/**
 * Show a native notification
 */
export async function showNotification(options: NotificationOptions): Promise<void> {
    try {
        await invoke('show_notification', {
            title: options.title,
            body: options.body,
        });

        // Play sound if requested
        if (options.sound) {
            await playNotificationSound();
        }
    } catch (error) {
        console.error('Failed to show notification:', error);
    }
}

/**
 * Play notification sound
 */
export async function playNotificationSound(): Promise<void> {
    try {
        await invoke('play_notification_sound');
    } catch (error) {
        console.error('Failed to play notification sound:', error);
    }
}

/**
 * Check if the app window is currently focused
 */
export async function isAppFocused(): Promise<boolean> {
    try {
        return await invoke<boolean>('is_app_focused');
    } catch (error) {
        console.error('Failed to check app focus:', error);
        // Default to NOT focused to ensure notifications are shown
        // This is safer than suppressing notifications when we can't determine focus
        return false;
    }
}
