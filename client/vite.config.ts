import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import * as path from 'path';
import { getAllowedHosts } from './src/config/host.config';

const env = loadEnv('development', process.cwd(), '');

export default defineConfig({
    plugins: [react()],
    base: '/',
    server: {
        host: true,
        port: Number(env.PORT) || 5173,
        strictPort: true,
        proxy: {
            '/api': env.API_URL || 'http://localhost:5000',
        },
        allowedHosts: getAllowedHosts(),
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    publicDir: 'public',
    preview: {
        allowedHosts: getAllowedHosts(),
    },
});