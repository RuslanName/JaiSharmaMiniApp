export const config = {
    AUTH_TOKEN_KEY: 'auth_token',
    AUTH_USER_KEY: 'auth_user',
    API_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
    MAX_WAIT_TIME_SIGNAL: Number(import.meta.env.VITE_MAX_WAIT_TIME_SIGNAL) || 310000,
    MAX_READY_TIME_SIGNAL: Number(import.meta.env.VITE_MAX_READY_TIME_SIGNAL) || 30000,
    PORT: Number(import.meta.env.VITE_PORT) || 5173,
};
