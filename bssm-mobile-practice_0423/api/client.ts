import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import Constants from 'expo-constants';

const BASE_URL: string =
    (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
    'https://bssm-api.zer0base.me';

const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

type RetryableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let isRefreshing = false;
let pendingQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: unknown) => void;
}> = [];

const flushPendingQueue = (error: unknown | null, token?: string) => {
    pendingQueue.forEach(({ resolve, reject }) => {
        if (error) {
            reject(error);
            return;
        }

        if (token) {
            resolve(token);
        }
    });

    pendingQueue = [];
};

// Request Interceptor
// 모든 요청 전에 실행 — 토큰 주입
apiClient.interceptors.request.use(
    config => {
        // auth-store를 직접 import하면 순환 참조가 생기므로 동적으로 참조
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { useAuthStore } = require('@/store/auth-store');
        const token: string | null = useAuthStore.getState().accessToken;
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    error => Promise.reject(error),
);

// Response Interceptor
// 모든 응답 후에 실행 — 에러 코드를 한 곳에서 처리
apiClient.interceptors.response.use(
    response => response,
    async error => {
        const axiosError = error as AxiosError;
        const status = error.response?.status;

        if (status === 404) {
            console.warn('[API] 리소스를 찾을 수 없습니다:', error.config?.url);
            return Promise.reject(error);
        }

        if (status === 401) {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const { useAuthStore } = require('@/store/auth-store');
            const store = useAuthStore.getState();
            const originalRequest = axiosError.config as RetryableRequestConfig;

            if (
                !originalRequest ||
                originalRequest._retry ||
                originalRequest.url?.includes('/auth/refresh')
            ) {
                await store.logOut();
                return Promise.reject(error);
            }

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    pendingQueue.push({
                        resolve: token => {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                            resolve(apiClient(originalRequest));
                        },
                        reject,
                    });
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const newAccessToken = await store.refreshAccessToken();
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                flushPendingQueue(null, newAccessToken);
                return apiClient(originalRequest);
            } catch (refreshError) {
                flushPendingQueue(refreshError);
                await store.logOut();
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }

            return Promise.reject(error);
        }

        console.error('[API] 서버 에러:', status, error.message);
        return Promise.reject(error);
    },
);

export default apiClient;
