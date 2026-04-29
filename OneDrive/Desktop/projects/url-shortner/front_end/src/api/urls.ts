import api from "./axios";
import { type UrlItem, type UrlStats } from "../types";

export const urlsApi = {
    shorten: async (originalUrl: string, customAlias?: string, expiresInDays?: number) => {
        const { data } = await api.post("/url/shorten", { originalUrl, customAlias, expiresInDays});
        return data.data as UrlItem;
    },

    getAll: async ( page = 1, limit = 20) => {
        const { data } = await api.get(`/url/all?page=${page}&limit=${limit}`);
        return data as {
            data: UrlItem[];
            pagination: {
                total: number;
                page: number;
                totalPages: number;
                hasNextPage: boolean;
            };
        };
    },

    getStats: async (id: string) => {
        const {data} = await api.get(`/url/${id}/stats`);
        return data.data as UrlStats;

    },

    delete: async (id: string) => {
        await api.delete(`/url/${id}`);
    },

    toggle: async(id: string ) => {
        const {data} = await api.patch(`/url/${id}/ToggleEvent`);
        return data.data as { isActive: boolean };
    },

};

