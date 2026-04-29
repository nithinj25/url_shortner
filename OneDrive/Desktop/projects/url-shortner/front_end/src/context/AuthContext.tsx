import { createContext, useContext, useState, type ReactNode } from "react";
import { type User } from "../types";
import { authApi } from "../api/auth";

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(() => {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) return null;

        try {
            return JSON.parse(storedUser) as User;
        } catch {
            localStorage.clear();
            return null;
        }
    });
    const [isLoading] = useState(false);

    const login = async (email: string, password: string) => {
        const result = await authApi.login(email, password);
        localStorage.setItem("accessToken",  result.accessToken);
        localStorage.setItem("refreshToken", result.refreshToken);
        localStorage.setItem("user",         JSON.stringify(result.user));
        setUser(result.user);
    };

    const register = async (name: string, email: string, password: string) => {
        const result = await authApi.register(name, email, password);
        localStorage.setItem("accessToken",  result.accessToken);
        localStorage.setItem("refreshToken", result.refreshToken);
        localStorage.setItem("user",         JSON.stringify(result.user));
        setUser(result.user);
    };


    const logout = async () => {
        const refreshToken = localStorage.getItem("refreshToken") || "";
        try { await authApi.logout(refreshToken); } catch { /* best-effort */ }
        localStorage.clear();
        setUser(null);
    }

    return (
        <AuthContext.Provider value={ { user, isLoading, login, register, logout}}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if(!ctx) throw new Error("userAuth must be inside AuthProvider");
    return ctx;
};
