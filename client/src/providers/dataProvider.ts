import type {DataProvider} from 'react-admin';
import api from '../api/axios';
import Cookies from 'js-cookie';
import usersProvider from './usersProvider';
import passwordsProvider from './passwordsProvider';
import signalsProvider from './signalsProvider';
import rafflesProvider from './rafflesProvider';
import settingsProvider from './settingsProvider';
import { config } from "@/config/constants";

api.interceptors.request.use((axiosConfig) => {
    const token = Cookies.get(config.AUTH_TOKEN_KEY);
    if (token) {
        axiosConfig.headers.Authorization = `Bearer ${token}`;
    } else {
        console.warn('No token found for request:', axiosConfig.url);
    }
    return axiosConfig;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('Response Error:', error.response?.data, error.response?.status);
        return Promise.reject(error);
    }
);

const providers: Record<string, Partial<DataProvider>> = {
    users: usersProvider,
    passwords: passwordsProvider,
    signals: signalsProvider,
    raffles: rafflesProvider,
    settings: settingsProvider,
};

const dataProvider: DataProvider = {
    getList: async (resource, params) => {
        if (!providers[resource]?.getList) throw new Error(`Method getList is not supported for resource ${resource}`);
        return await providers[resource].getList!(resource, params);
    },
    getOne: async (resource, params) => {
        if (!providers[resource]?.getOne) throw new Error(`Method getOne is not supported for resource ${resource}`);
        return await providers[resource].getOne!(resource, params);
    },
    getMany: async (resource, params) => {
        if (!providers[resource]?.getMany) throw new Error(`Method getMany is not supported for resource ${resource}`);
        return providers[resource].getMany!(resource, params);
    },
    getManyReference: async (resource, params) => {
        if (!providers[resource]?.getManyReference) throw new Error(`Method getManyReference is not supported for resource ${resource}`);
        return providers[resource].getManyReference!(resource, params);
    },
    create: async (resource, params) => {
        if (!providers[resource]?.create) throw new Error(`Method create is not supported for resource ${resource}`);
        return await providers[resource].create!(resource, params);
    },
    update: async (resource, params) => {
        if (!providers[resource]?.update) throw new Error(`Method update is not supported for resource ${resource}`);
        return await providers[resource].update!(resource, params);
    },
    updateMany: async (resource, params) => {
        if (!providers[resource]?.updateMany) throw new Error(`Method updateMany is not supported for resource ${resource}`);
        return providers[resource].updateMany!(resource, params);
    },
    delete: async (resource, params) => {
        if (!providers[resource]?.delete) throw new Error(`Method delete is not supported for resource ${resource}`);
        return providers[resource].delete!(resource, params);
    },
    deleteMany: async (resource, params) => {
        if (!providers[resource]?.deleteMany) throw new Error(`Method deleteMany is not supported for resource ${resource}`);
        return providers[resource].deleteMany!(resource, params);
    },
    toggleAccess: async (resource: any, params: any) => {
        if (!providers[resource]?.toggleAccess) throw new Error(`Method toggleAccess is not supported for resource ${resource}`);
        return providers[resource].toggleAccess!(resource, params);
    },
    generateMany: async (resource: any, params: any) => {
        if (!providers[resource]?.generateMany) throw new Error(`Method generateMany is not supported for resource ${resource}`);
        return await providers[resource].generateMany!(resource, params);
    },
};

export default dataProvider;