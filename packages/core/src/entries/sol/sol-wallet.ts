/**
 * Solana wallet entry held inside an `AccountMultichain`.
 *
 * Phase 2 Track H: introduces the shape unconditionally. Whether the
 * shape is ever populated in v1 depends on chain-kit's Solana
 * availability — see Track K5 in `MULTICHAIN_PHASE_2_TASKS.md`. If
 * chain-kit hasn't shipped SOL by Phase 2 exit, `'sol'` is excluded from
 * the default `enabledChains` of new `AccountMultichain` instances; the
 * type still exists so storage and union narrowing don't need to
 * change later when SOL turns on.
 *
 * `rawAddress` is the base58-encoded ed25519 public key (32 bytes →
 * 43–44 base58 chars; Solana addresses *are* the public key).
 *
 * `publicKey` is hex-encoded ed25519 public key. Redundant with
 * `rawAddress` in encoding-but-not-bytes, kept for cross-chain symmetry.
 * Derivation: BIP-44 over ed25519 via SLIP-0010 at
 * `DEFAULT_BIP44_PATH.sol` (`m/44'/501'/0'/0'`).
 */
export type SolWallet = {
    id: string;
    chain: 'sol';
    rawAddress: string;
    publicKey: string;
    derivationPath: string;
};
