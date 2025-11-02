import { createBaseProvider } from './baseProvider';
import api from '../api/axios';
import { useAuthStore } from '@/store/auth';

const baseProvider = createBaseProvider('signals');

const signalsProvider = {
    ...baseProvider,
    getOne: async (resource: any, params: { id: any; }) => {
        const token = useAuthStore.getState().token;
        const response = await api.get(`/${resource}/${params.id}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const signal = response.data;
        return {
            data: {
                ...signal,
                user_id: signal.user?.id || '',
            },
        };
    },
};

export default signalsProvider;