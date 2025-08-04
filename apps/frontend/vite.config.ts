import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 5173,
        host: true,
        proxy: {
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true,
                secure: false,
            },
        },
    },
    build: {
        outDir: 'dist',
        sourcemap: false,
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom'],
                    mui: ['@mui/material', '@mui/icons-material'],
                    charts: ['recharts'],
                    utils: ['lodash', 'date-fns'],
                },
            },
        },
    },
    define: {
        // Define global constants for the client-side code
        __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
        __PROD__: JSON.stringify(process.env.NODE_ENV === 'production'),
        // Define API URL as a global constant
        'globalThis.API_BASE_URL': JSON.stringify(
            process.env.NODE_ENV === 'production' 
                ? 'http://localhost:3001/api' 
                : 'http://localhost:3001/api'
        ),
    },
}); 