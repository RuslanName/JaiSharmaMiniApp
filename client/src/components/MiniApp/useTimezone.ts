import { useState, useEffect } from 'react';
import { locationManager } from '@telegram-apps/sdk';
import tzlookup from 'tz-lookup';

export const useTimezone = () => {
    const [timezone, setTimezone] = useState<string>('UTC');

    useEffect(() => {
        const fetchUserTimezone = async () => {
            try {
                if (locationManager.isSupported() && locationManager.mount.isAvailable()) {
                    await locationManager.mount();
                    const location = await locationManager.requestLocation();
                    const userTimezone = tzlookup(location.latitude, location.longitude);
                    setTimezone(userTimezone);
                } else {
                    const fallbackTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                    setTimezone(fallbackTimezone || 'UTC');
                }
            } catch (err) {
                console.error('Error fetching location:', err);
                try {
                    const fallbackTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                    setTimezone(fallbackTimezone || 'UTC');
                } catch (fallbackErr) {
                    setTimezone('UTC');
                }
                if (locationManager.openSettings.isAvailable()) {
                    locationManager.openSettings();
                }
            }
        };
        fetchUserTimezone();
    }, []);

    return timezone;
};

