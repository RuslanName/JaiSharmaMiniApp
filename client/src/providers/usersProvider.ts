import type {DataProvider, PaginationPayload} from 'react-admin';
import { createBaseProvider } from './baseProvider';
import api from '../api/axios';
import { useAuthStore } from '@/store/auth';

const baseProvider = createBaseProvider('users');

const usersProvider: Partial<DataProvider> = {
    ...baseProvider,
    getList: async (resource, params) => {
        const pagination: PaginationPayload = params.pagination || { page: 1, perPage: 10 };
        const { page, perPage } = pagination;
        const filter = params.filter || {};
        const query = new URLSearchParams({
            page: page.toString(),
            limit: perPage.toString(),
            ...filter,
        }).toString();
        const token = useAuthStore.getState().token;
        const response = await api.get(`/${resource}?${query}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return {
            data: response.data.data.map((user: any) => ({
                ...user,
                id: user.id,
                energy: user.energy || 0,
                maxEnergy: user.maxEnergy || 100,
                multiplier: user.multiplier || 'N/A',
                winnings: user.winnings || 'N/A',
            })),
            total: response.data.total,
        };
    },
    getMany: async (resource, params) => {
        const { ids } = params;
        const token = useAuthStore.getState().token;
        const responses = await Promise.all(
            ids.map((id) =>
                api.get(`/${resource}/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
            )
        );
        return {
            data: responses.map((res) => ({
                ...res.data,
                id: res.data.id,
                energy: res.data.energy || 0,
                maxEnergy: res.data.maxEnergy || 100,
                multiplier: res.data.multiplier || 'N/A',
                winnings: res.data.winnings || 'N/A',
            })),
        };
    },
    toggleAccess: async (resource: any, params: { id: number; data: { is_access_allowed: boolean } }) => {
        const token = useAuthStore.getState().token;
        const response = await api.patch(
            `/${resource}/${params.id}/access`,
            { is_access_allowed: params.data.is_access_allowed },
            { headers: { Authorization: `Bearer ${token}` } },
        );
        return { data: response.data };
    },
};

export default usersProvider;