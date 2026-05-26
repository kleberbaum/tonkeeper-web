/**
 * Ethereum / EVM-chain wallet entry held inside an `AccountMultichain`.
 *
 * Phase 2 Track H: introduces the shape; storage (Track J) round-trips it
 * alongside the existing legacy wallet entries; address derivation
 * (Track K) populates `rawAddress` and `publicKey` from a BIP39 seed at
 * `DEFAULT_BIP44_PATH.evm` (m/44'/60'/0'/0/0).
 *
 * `rawAddress` is EIP-55 checksummed (`0x` lowercase prefix + mixed-case
 * hex body). Consumers comparing addresses cross-system should
 * lowercase first.
 *
 * `publicKey` is hex-encoded secp256k1 — uncompressed (`04` || X || Y),
 * 65 bytes / 130 hex chars after the `04` prefix. This is the form
 * ethers / Trust Wallet Core round-trip with.
 */
export type EvmWallet = {
    id: string;
    chain: 'evm';
    rawAddress: string;
    publicKey: string;
    derivationPath: string;
};
