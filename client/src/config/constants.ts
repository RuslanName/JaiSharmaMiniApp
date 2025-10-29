import * as dotenv from 'dotenv';

dotenv.config();

export const config = {
    API_URL: process.env.API_URL || 'http://localhost:5000',
    AUTH_TOKEN_KEY: 'auth_token',
    AUTH_USER_KEY: 'auth_user',
    MAX_WAIT_TIME_SIGNAL: 310000,
    MAX_READY_TIME_SIGNAL: 30000,
    PORT: 5173,
};
