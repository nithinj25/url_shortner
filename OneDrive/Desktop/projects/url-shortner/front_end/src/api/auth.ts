import api from "./axios";
import { type User } from "../types";

export const authApi = {
    register: async (name: string, email: string, password: string) => {
        const { data } = await api.post("/auth/register", { name, email, password});
        return data.data as { user: User; accessToken: string; refreshToken: string};
    },

    login: async (email: string, password: string) => {
        const { data } = await api.post("/auth/login", { email, password });
        return data.data as { user: User; accessToken: string; refreshToken: string};
    },

    logout: async (refreshToken: string) => {
        await api.post("/auth/logout", { refreshToken });
    }
};

