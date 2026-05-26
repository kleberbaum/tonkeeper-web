export const tonConnectProtocolVersion = 2;

/**
 * Phase 1 multichain plumbing. Flip to `true` locally to opt into the
 * Phase 2+ BIP39 multichain create/import flow when those branches land.
 * Webpack DefinePlugin wiring can replace this constant later — Phase 1
 * keeps it source-level since there are no UI consumers yet.
 */
export const MULTICHAIN_ENABLED = false;
