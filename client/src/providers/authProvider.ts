import { AuthProvider } from 'react-admin';
import api from '../api/axios';
import { jwtDecode } from 'jwt-decode';
import Cookies from 'js-cookie';
import { JwtPayload, User } from '@/interfaces';
import { config } from "@/config/constants";

const authProvider: AuthProvider = {
    login: async ({ initData, password }) => {
        if (!initData && !password) {
            throw new Error('initData or password is required');
        }

        const response = await api.post('/auth', { initData, password });
        const { token } = response.data;
        Cookies.set(config.AUTH_TOKEN_KEY, token, { expires: 1 });

        if (password) {
            const decoded: JwtPayload = jwtDecode(token);
            if (decoded.role === 'admin') {
                const user: Partial<User> = {
                    id: decoded.sub,
                    role: 'admin',
                    username: 'Admin',
                };
                Cookies.set(config.AUTH_USER_KEY, JSON.stringify(user), { expires: 1 });
                return Promise.resolve();
            }
        }

        if (initData) {
            const userResponse = await api.get('/users/me', {
                headers: { Authorization: `Bearer ${token}` },
            });
            Cookies.set(config.AUTH_USER_KEY, JSON.stringify(userResponse.data), { expires: 1 });
        }

        return Promise.resolve();
    },
    logout: () => {
        Cookies.remove(config.AUTH_TOKEN_KEY);
        Cookies.remove(config.AUTH_USER_KEY);
        return Promise.resolve('/admin/login');
    },
    checkError: (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
            Cookies.remove(config.AUTH_TOKEN_KEY);
            Cookies.remove(config.AUTH_USER_KEY);
            return Promise.reject({ redirectTo: '/admin/login' });
        }
        return Promise.resolve();
    },
    checkAuth: () => {
        const token = Cookies.get(config.AUTH_TOKEN_KEY);
        return token ? Promise.resolve() : Promise.reject({ redirectTo: '/admin/login' });
    },
    getPermissions: () => {
        const token = Cookies.get(config.AUTH_TOKEN_KEY);
        if (!token) return Promise.reject();
        const decoded: JwtPayload = jwtDecode(token);
        return Promise.resolve(decoded.role === 'admin' ? ['admin'] : []);
    },
    getIdentity: () => {
        const token = Cookies.get(config.AUTH_TOKEN_KEY);
        const user = Cookies.get(config.AUTH_USER_KEY);
        if (!token || !user) return Promise.reject();
        const decoded: JwtPayload = jwtDecode(token);
        const parsedUser: Partial<User> = JSON.parse(user);
        return Promise.resolve({ id: decoded.sub, fullName: parsedUser.username || 'Anonymous' });
    },
};

export default authProvider;