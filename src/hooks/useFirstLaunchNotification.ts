import { useEffect } from 'react';
import { showNotification, requestNotificationPermission } from '../lib/notifications';

export function useFirstLaunchNotification() {
    useEffect(() => {
        const checkFirstLaunch = async () => {
            try {
                const hasLaunchedBefore = localStorage.getItem('nami_has_launched');

                if (!hasLaunchedBefore) {
                    // Request permission first
                    // Use a slight delay to ensure app is ready
                    setTimeout(async () => {
                        try {
                            // Check if Tauri is available
                            if (typeof window !== 'undefined' && (window as any).__TAURI__) {
                                const granted = await requestNotificationPermission();
                                if (granted) {
                                    await showNotification({
                                        title: 'Welcome to Nami! 🎉',
                                        body: 'Your secure messaging app is ready to use.',
                                        sound: true
                                    });
                                }
                            }
                        } catch (err) {
                            // Silently fail - notifications are optional
                            console.warn('Failed to show welcome notification:', err);
                        }
                        localStorage.setItem('nami_has_launched', 'true');
                    }, 2000);
                }
            } catch (err) {
                // Silently fail - this is not critical
                console.warn('First launch check failed:', err);
            }
        };

        checkFirstLaunch();
    }, []);
}
