export const mainWindowName = 'main_window';

/**
 * Phase 1 multichain plumbing. Flip to `true` locally to opt into the
 * Phase 2+ BIP39 multichain create/import flow when those branches land.
 * Webpack DefinePlugin wiring (or main-process IPC) can replace this
 * constant later — Phase 1 keeps it source-level since there are no UI
 * consumers yet.
 */
export const MULTICHAIN_ENABLED = false;

export function isMainWindowUrl(url: string) {
    try {
        let path = new URL(url).pathname;
        if (path.startsWith('/')) {
            path = path.slice(1);
        }
        if (path.endsWith('/')) {
            path = path.slice(0, -1);
        }

        return path === mainWindowName;
    } catch (e) {
        console.error(e);
        return false;
    }
}
