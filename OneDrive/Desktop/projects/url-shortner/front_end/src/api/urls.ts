import api from "./axios";
import { type UrlItem, type UrlStats } from "../types";

export const urlsApi = {
    shorten: async (originalUrl: string, customAlias?: string, expiresInDays?: number) => {
        const { data } = await api.post("/url/shorten", { originalUrl, customAlias, expiresInDays});
        return data.data as UrlItem;
    },

    getAll: async () => {
        const { data } = await api.get("url/all");
        return data.data as UrlItem[];
    },

    getStats: async (id: string) => {
        const {data} = await api.get(`/url/${id}/stats`);
        return data.data as UrlStats;

    },

    delete: async (id: string) => {
        await api.delete(`/url/${id}`);
    }

};

