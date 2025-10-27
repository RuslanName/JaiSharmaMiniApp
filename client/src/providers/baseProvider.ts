import api from '../api/axios';
import { DataProvider, PaginationPayload } from 'react-admin';
import { useAuthStore } from '@/store/auth';

export const createBaseProvider = (resource: string): Partial<DataProvider> => ({
    getList: async (_, params) => {
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
            data: response.data.data,
            total: response.data.total,
        };
    },
    getOne: async (_, params) => {
        const token = useAuthStore.getState().token;
        const response = await api.get(`/${resource}/${params.id}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return { data: response.data };
    },
    getMany: async (_, params) => {
        const ids = params.ids.join(',');
        const token = useAuthStore.getState().token;
        const response = await api.get(`/${resource}?ids=${ids}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return { data: response.data.data };
    },
    create: async (_, params) => {
        const token = useAuthStore.getState().token;
        const response = await api.post(`/${resource}`, params.data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return { data: response.data };
    },
    update: async (_, params) => {
        const token = useAuthStore.getState().token;
        const response = await api.patch(`/${resource}/${params.id}`, params.data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return { data: response.data };
    },
    delete: async (_, params) => {
        const token = useAuthStore.getState().token;
        const response = await api.delete(`/${resource}/${params.id}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return { data: response.data };
    },
});