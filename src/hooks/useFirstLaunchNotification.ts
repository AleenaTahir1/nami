import { useEffect } from 'react';
import { showNotification, requestNotificationPermission } from '../lib/notifications';

export function useFirstLaunchNotification() {
    useEffect(() => {
        const checkFirstLaunch = async () => {
            const hasLaunchedBefore = localStorage.getItem('nami_has_launched');

            if (!hasLaunchedBefore) {
                // Request permission first
                // Use a slight delay to ensure app is ready
                setTimeout(async () => {
                    try {
                        const granted = await requestNotificationPermission();
                        if (granted) {
                            await showNotification({
                                title: 'Welcome to Nami! 🎉',
                                body: 'Your secure messaging app is ready to use.',
                                sound: true
                            });
                        }
                    } catch (err) {
                        console.error('Failed to show welcome notification:', err);
                    }
                    localStorage.setItem('nami_has_launched', 'true');
                }, 1000);
            }
        };

        checkFirstLaunch();
    }, []);
}
