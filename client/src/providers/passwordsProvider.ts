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
};

export default passwordsProvider;