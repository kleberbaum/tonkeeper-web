/// <reference types="vite/client" />

interface ImportMetaEnv {
    /**
     * Phase 1 multichain plumbing. `'true'` enables the BIP39 multichain
     * create/import flow (Phase 2+ gates UI on `useAppContext().multichainEnabled`).
     * Defaults to `'false'` (or unset) in production. Set in `.env.local` for dev opt-in.
     */
    readonly VITE_MULTICHAIN_ENABLED?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
