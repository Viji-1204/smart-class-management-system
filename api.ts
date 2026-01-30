import axios from 'axios';
import { User, MarkRecord, UserRole } from './types';

const api = axios.create({
    baseURL: '/api'
});

export const authApi = {
    login: async (credentials: any) => {
        const response = await api.post('/auth/login', credentials);
        return response.data;
    },
    signup: async (data: any) => {
        const response = await api.post('/auth/signup', data);
        return response.data;
    },
    updateProfile: async (data: any) => {
        const response = await api.post('/auth/update-profile', data);
        return response.data;
    }
};

export const dashboardApi = {
    getData: async (role: UserRole, id: string) => {
        const response = await api.get(`/dashboard/${role}/${id}`);
        return response.data;
    }
};

export const marksApi = {
    submit: async (marks: MarkRecord[]) => {
        const response = await api.post('/marks/submit', { marks });
        return response.data;
    },
    publish: async (params: any) => {
        const response = await api.post('/marks/publish', params);
        return response.data;
    },
    sendSmsParents: async (params: any) => {
        const response = await api.post('/marks/send-sms-parents', params);
        return response.data;
    }
};

export const userApi = {
    create: async (data: any) => {
        const response = await api.post('/marks/users', data);
        return response.data;
    },
    update: async (id: string, data: any) => {
        const response = await api.put(`/marks/users/${id}`, data);
        return response.data;
    },
    delete: async (id: string) => {
        const response = await api.delete(`/marks/users/${id}`);
        return response.data;
    }
};

export default api;
