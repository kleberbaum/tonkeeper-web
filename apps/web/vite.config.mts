import react from '@vitejs/plugin-react';
import * as path from 'path';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { injectCSP, metaTagCspConfig } from "@tonkeeper/core/dist/utils/csp";

export default defineConfig({
    plugins: [
        nodePolyfills({
            globals: {
                Buffer: true,
                global: true,
                process: true
            },
            // `util` added so deps that call `util.debuglog` / `util.inspect`
            // (e.g. via chainkit's Kotlin/JS or its transitive deps) don't
            // hit Vite's "Module 'util' externalized" warnings at runtime.
            include: ['stream', 'buffer', 'crypto', 'util']
        }),
        react(),
        injectCSP(metaTagCspConfig)
    ],
    server: {
        // Required for local development to test Telegram OAuth callbacks.
        // Vite rejects requests with Host header different from localhost by default.
        allowedHosts: ['wallet.tonkeeper.com', 'wallet.tonkeeper.local'],
        watch: {
            // tsc writes many files at once; wait for the burst to settle before
            // triggering a reload, otherwise the page reloads on every individual file.
            awaitWriteFinish: {
                stabilityThreshold: 300,
                pollInterval: 50
            }
        }
    },
    optimizeDeps: {
        // Never pre-bundle local workspace packages — they are rebuilt frequently in dev
        // and pre-bundling them causes Vite to serve a stale server-side cache that
        // survives browser hard-resets.
        exclude: ['@tonkeeper/uikit', '@tonkeeper/core', '@tonkeeper/locales']
    },
    resolve: {
        alias: {
            react: path.resolve(__dirname, './node_modules/react'),
            'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
            '@ton/core': path.resolve(__dirname, '../../packages/core/node_modules/@ton/core'),
            '@ton/crypto': path.resolve(__dirname, '../../packages/core/node_modules/@ton/crypto'),
            '@ton/ton': path.resolve(__dirname, '../../packages/core/node_modules/@ton/ton'),
            'react-router-dom': path.resolve(__dirname, './node_modules/react-router-dom'),
            'styled-components': path.resolve(__dirname, './node_modules/styled-components'),
            'react-i18next': path.resolve(__dirname, './node_modules/react-i18next'),
            '@tanstack/react-query': path.resolve(__dirname, './node_modules/@tanstack/react-query')
        }
    }
});
