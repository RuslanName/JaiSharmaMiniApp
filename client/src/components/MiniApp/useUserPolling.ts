import { useEffect, useRef, useCallback } from 'react';
import api from '../../api/axios';
import { useAuthStore } from '@/store/auth';

export const useUserPolling = () => {
    const { token, setUser } = useAuthStore();
    const userIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const hasInitializedUserPolling = useRef(false);

    const fetchUserData = useCallback(async () => {
        if (!token) return;
        try {
            const response = await api.get('/users/me', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUser(response.data);
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    }, [token, setUser]);

    useEffect(() => {
        if (!token) {
            if (userIntervalRef.current) {
                clearInterval(userIntervalRef.current);
                userIntervalRef.current = null;
            }
            hasInitializedUserPolling.current = false;
            return;
        }

        if (hasInitializedUserPolling.current) return;
        hasInitializedUserPolling.current = true;

        fetchUserData();

        if (userIntervalRef.current) {
            clearInterval(userIntervalRef.current);
        }
        userIntervalRef.current = setInterval(fetchUserData, 5000);

        return () => {
            hasInitializedUserPolling.current = false;
            if (userIntervalRef.current) {
                clearInterval(userIntervalRef.current);
                userIntervalRef.current = null;
            }
        };
    }, [token, fetchUserData]);
};

