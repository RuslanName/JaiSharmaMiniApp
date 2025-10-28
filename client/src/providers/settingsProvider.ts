import api from '../api/axios';
import type {DataProvider, PaginationPayload} from 'react-admin';
import { useAuthStore } from '@/store/auth';

export const SettingNameTranslations: Record<string, string> = {
    key: 'Ключ',
    value: 'Значение',
};

const settingsProvider: Partial<DataProvider> = {
    getList: async (resource, params) => {
        const pagination: PaginationPayload = params.pagination || { page: 1, perPage: 10 };
        const { page, perPage } = pagination;
        const token = useAuthStore.getState().token;
        const response = await api.get(`/${resource}?page=${page}&limit=${perPage}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const transformedData = response.data.data.map((item: any) => ({
            id: item.key,
            ...item,
        }));
        return {
            data: transformedData,
            total: response.data.total,
        };
    },
    getOne: async (resource, params) => {
        const token = useAuthStore.getState().token;
        const response = await api.get(`/${resource}/${params.id}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return {
            data: {
                id: response.data.key || params.id,
                ...response.data,
            },
        };
    },
    update: async (resource, params) => {
        const token = useAuthStore.getState().token;
        const response = await api.patch(`/${resource}/${params.id}`, params.data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return {
            data: {
                id: response.data.key || params.id,
                ...response.data,
            },
        };
    },
};

export default settingsProvider;