import { useEffect } from 'react';
import api from '../../api/axios.ts';
import { useAuthStore } from '@/store/auth.ts';
import type {MiniAppUser} from '@/interfaces';

const Auth: React.FC = () => {
    const { setToken, setUser } = useAuthStore();

    useEffect(() => {
        const authenticate = async () => {
            try {
                const initData = window.Telegram?.WebApp?.initData;
                if (!initData) {
                    console.warn('Telegram Web App initData not available');
                    return;
                }
                const authResponse = await api.post('/auth', { initData });
                const { token } = authResponse.data;
                setToken(token);
                const userResponse = await api.get('/users/me', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setUser(userResponse.data as MiniAppUser);
            } catch (error) {
                console.error('Authentication error:', error);
            }
        };

        if (window.Telegram?.WebApp) {
            window.Telegram.WebApp.ready();
            authenticate();
        } else {
            console.warn('Telegram Web App SDK not loaded');
        }
    }, [setToken, setUser]);

    return null;
};

export default Auth;