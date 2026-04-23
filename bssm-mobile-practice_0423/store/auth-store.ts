import {
    login,
    LoginPayload,
    logout,
    refreshToken as authRefresh,
    signup,
    SignupPayload,
} from '@/api/auth';
import User from '@type/User';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { getMe } from '@/api/users';

const TOKEN_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';

export type AuthStatus = 'checking' | 'authenticated' | 'guest';

interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    status: AuthStatus;
    loading: boolean;
    error: string | null;

    bootstrap: () => Promise<void>;
    signUp: (payload: SignupPayload) => Promise<void>;
    logIn: (payload: LoginPayload) => Promise<void>;
    logOut: () => Promise<void>;
    refreshAccessToken: () => Promise<string>;
    setTokens: (accessToken: string, refreshToken: string) => void;
    clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    accessToken: null,
    refreshToken: null,
    status: 'checking',
    loading: false,
    error: null,

    bootstrap: async () => {
        const accessToken = await SecureStore.getItemAsync(TOKEN_KEY);
        const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);

        if (!accessToken) {
            set({ accessToken: null, refreshToken: null, user: null, status: 'guest' });
            return;
        }

        set({ accessToken, refreshToken });

        try {
            const user = await getMe();
            set({ user, status: 'authenticated' });
        } catch {
            await SecureStore.deleteItemAsync(TOKEN_KEY);
            await SecureStore.deleteItemAsync(REFRESH_KEY);
            set({
                user: null,
                accessToken: null,
                refreshToken: null,
                status: 'guest',
            });
        }
    },

    signUp: async payload => {
        set({ loading: true, error: null });
        try {
            const res = await signup(payload);
            await SecureStore.setItemAsync(TOKEN_KEY, res.accessToken);
            await SecureStore.setItemAsync(REFRESH_KEY, res.refreshToken);
            set({
                user: res.user,
                accessToken: res.accessToken,
                refreshToken: res.refreshToken,
                status: 'authenticated',
                loading: false,
            });
        } catch (err: unknown) {
            const serverRes = (
                err as { response?: { data?: { message?: string } } }
            ).response;
            const message = serverRes
                ? (serverRes.data?.message ?? '회원가입에 실패했습니다.')
                : '서버와 통신 중 오류가 발생했습니다.';
            set({ error: message, loading: false });
            throw err;
        }
    },

    logIn: async payload => {
        set({ loading: true, error: null });
        try {
            const res = await login(payload);
            await SecureStore.setItemAsync(TOKEN_KEY, res.accessToken);
            await SecureStore.setItemAsync(REFRESH_KEY, res.refreshToken);
            set({
                user: res.user,
                accessToken: res.accessToken,
                refreshToken: res.refreshToken,
                status: 'authenticated',
                loading: false,
            });
        } catch (err: unknown) {
            const serverRes = (
                err as { response?: { data?: { message?: string } } }
            ).response;
            const message = serverRes
                ? (serverRes.data?.message ?? '로그인에 실패했습니다.')
                : '서버와 통신 중 오류가 발생했습니다.';
            set({ error: message, loading: false });
            throw err;
        }
    },

    logOut: async () => {
        const currentRefreshToken = get().refreshToken;

        try {
            if (currentRefreshToken) {
                await logout(currentRefreshToken);
            }
        } catch {
            // 서버 폐기 요청 실패와 무관하게 로컬 로그아웃은 계속 진행한다.
        } finally {
            await SecureStore.deleteItemAsync(TOKEN_KEY);
            await SecureStore.deleteItemAsync(REFRESH_KEY);
            set({
                user: null,
                accessToken: null,
                refreshToken: null,
                status: 'guest',
                error: null,
            });
        }
    },

    refreshAccessToken: async () => {
        const currentRefreshToken = get().refreshToken;

        if (!currentRefreshToken) {
            throw new Error('No refresh token');
        }

        const res = await authRefresh(currentRefreshToken);

        await SecureStore.setItemAsync(TOKEN_KEY, res.accessToken);
        await SecureStore.setItemAsync(REFRESH_KEY, res.refreshToken);

        set({
            accessToken: res.accessToken,
            refreshToken: res.refreshToken,
            status: 'authenticated',
        });

        return res.accessToken;
    },

    setTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken });
    },

    clearError: () => set({ error: null }),
}));
