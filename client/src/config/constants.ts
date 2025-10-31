export const config = {
    AUTH_TOKEN_KEY: 'auth_token',
    AUTH_USER_KEY: 'auth_user',
    API_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
    PORT: Number(import.meta.env.VITE_PORT) || 5173,
};
