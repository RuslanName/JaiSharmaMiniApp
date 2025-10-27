import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import * as path from 'path';

export default defineConfig({
    plugins: [react()],
    build: {
        outDir: 'build',
    },
    base: '/',
    server: {
        proxy: {
            '/api': 'http://localhost:5000',
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    publicDir: 'public',
    preview: {
        allowedHosts: ['ruslan-name-5173.cloudpub.ru'],
    },
});