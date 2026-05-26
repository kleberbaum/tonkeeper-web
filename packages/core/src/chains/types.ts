/**
 * Multichain interface used by `uikit`. Hides chain-kit's Kotlin/JS
 * ergonomics (`Companion.from(...)`, `Res<T,E>`, `await ready()`,
 * `Int8Array` vs `Uint8Array`) behind a clean TS surface.
 *
 * Chain-specific *transaction* code (TON wallet versions, MAM, multisig;
 * EVM EIP-712; BTC PSBT; etc.) lives in the existing service modules
 * and is reached via Track B (signer factory) and Track C (wallet
 * contract factory), not through this facade.
 */

export type ChainId = 'ton' | 'evm' | 'btc' | 'tron' | 'sol';

export const CHAIN_IDS: readonly ChainId[] = ['ton', 'evm', 'btc', 'tron', 'sol'] as const;

/**
 * `ChainSigner` is intentionally a placeholder in Phase 1 — Track B owns the
 * real discriminated union (`{ type: 'cell' | 'eth-typed' | ... }`). The
 * adapter's `signTransaction` accepts a signer typed loosely here so the
 * interface compiles before Track B lands. Once Track B is in, this alias
 * is replaced with the real union without re-touching adapter code.
 */
export type ChainSigner = unknown;

/**
 * Inputs for `ChainAdapter.buildTransaction`. The shape is intentionally
 * generic so per-chain code can refine `extra` for its own payload
 * (TON: messages + sendMode; EVM: gas/data; BTC: utxos; etc.).
 */
export interface BuildTxArgs {
    from: string;
    to: string;
    amount: bigint;
    extra?: unknown;
}

export interface Fee {
    /** Fee amount in the chain's smallest unit (nanoton, wei, satoshi, sun, lamport). */
    amount: bigint;
    /** Free-form breakdown; consumers can render or ignore. */
    breakdown?: ReadonlyArray<{ label: string; amount: bigint }>;
}

export interface ChainAdapter<TMessage = unknown, TSignature = unknown> {
    readonly chain: ChainId;

    /**
     * Whether `addr` is a syntactically valid address on this chain.
     * Backed by chain-kit's `Address.Companion.from(addr, chain)`.
     *
     * `ensureReady()` must have been awaited before the first call.
     * Tests should `await ensureReady()` in `beforeAll`; app startup
     * should `await ensureReady()` at boot.
     */
    validateAddress(addr: string): boolean;

    /**
     * Format a raw amount (smallest unit) into a human string. Default
     * decimals come from the chain's coin (e.g. TON = 9). Override
     * `opts.decimals` for jettons / ERC-20 / SPL etc.
     */
    formatAmount(amount: bigint, opts?: { decimals?: number }): string;

    /** Inverse of `formatAmount`. Throws on malformed input. */
    parseAmount(human: string, opts?: { decimals?: number }): bigint;

    /**
     * Derive the canonical address for this chain from a BIP39 mnemonic.
     * Chain-kit walks the mnemonic at the chain's standard BIP-44 path
     * (`DEFAULT_BIP44_PATH[chain]`) and returns the chain's canonical
     * address shape (EIP-55 checksum on EVM, bech32 on BTC, base58 on
     * TRON, etc.).
     *
     * TON is intentionally not wired here: TON addresses depend on the
     * wallet contract version (V4R2, V5R1, …), which only the existing
     * `walletContract()` helper in `service/wallet/contractService.ts`
     * knows how to choose. The TON branch throws — callers who need a
     * TON address derive it via that helper.
     *
     * SOL is not wired either: chain-kit ships no Solana module today.
     * The SOL branch throws until that lands.
     */
    deriveAddress(args: { mnemonic: string }): Promise<string>;

    estimateFee(args: { from: string; to: string; amount: bigint; data?: unknown }): Promise<Fee>;
    buildTransaction(args: BuildTxArgs): Promise<TMessage>;
    signTransaction(args: { message: TMessage; signer: ChainSigner }): Promise<TSignature>;
    broadcast(args: { signed: TSignature }): Promise<{ hash: string }>;
}

export class NotImplementedError extends Error {
    constructor(chain: ChainId, method: keyof ChainAdapter, phase: string) {
        super(
            `ChainAdapter for "${chain}" has no ${String(method)}() implementation — ` +
                `wired in ${phase}. See packages/core/src/chains/adapter.ts.`
        );
        this.name = 'NotImplementedError';
    }
}
