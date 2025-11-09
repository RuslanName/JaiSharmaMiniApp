import { createBaseProvider } from './baseProvider';
import api from '../api/axios';
import { useAuthStore } from '@/store/auth';

const baseProvider = createBaseProvider('passwords');

const passwordsProvider = {
    ...baseProvider,
    getOne: async (resource: any, params: { id: any; }) => {
        const token = useAuthStore.getState().token;
        const response = await api.get(`/${resource}/${params.id}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const password = response.data;
        return {
            data: {
                ...password,
                user_id: password.user?.id || '',
            },
        };
    },
    generateMany: async (resource: any, params: { data: { count: number; website_url: string } }) => {
        const token = useAuthStore.getState().token;
        const response = await api.post(`/${resource}/generate`, params.data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return {
            data: response.data.data,
        };
    },
};

export default passwordsProvider;