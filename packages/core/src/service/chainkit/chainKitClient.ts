/* eslint-disable @typescript-eslint/no-explicit-any */
import { Chain as ChainkitChain, CryptoKitClient, NetConfig } from '@tonkeeper/chainkit';

import { ensureReady } from '../../chains/ready';

/**
 * Network codes the multichain backend puts in the first segment of an
 * `assetId` (`<network>/<chain-network>/<type>/<addr>`) that this
 * chain-kit build can actually transact on. `evm` is split into its
 * concrete networks here because chain-kit selects gas rules, chain id,
 * and node provider per network — Ethereum, Base, BSC (`Smartchain`),
 * and Arbitrum are distinct `Chain` constants, not one "EVM" chain.
 *
 * `polygon` / `avalanche` / `sol` are intentionally absent: this
 * chain-kit build ships no `Chain` constant for them, so a transfer on
 * those networks can't be constructed and the caller must surface that.
 */
export type ChainKitNetwork = 'ton' | 'eth' | 'base' | 'bsc' | 'arb' | 'btc' | 'tron';

const CHAINKIT_CHAIN: Record<ChainKitNetwork, () => unknown> = {
    ton: () => (ChainkitChain as any).Ton.Mainnet,
    eth: () => (ChainkitChain as any).Ethereum.Mainnet,
    base: () => (ChainkitChain as any).Base.Mainnet,
    bsc: () => (ChainkitChain as any).Smartchain.Mainnet,
    arb: () => (ChainkitChain as any).Arbitrum.Mainnet,
    btc: () => (ChainkitChain as any).Bitcoin.Mainnet,
    tron: () => (ChainkitChain as any).Tron.Mainnet
};

export const isSupportedChainKitNetwork = (head: string): head is ChainKitNetwork =>
    Object.prototype.hasOwnProperty.call(CHAINKIT_CHAIN, head);

/** The chain-kit `Chain` constant for an asset network code. Caller must `ensureReady()` first. */
export const chainKitChainOf = (network: ChainKitNetwork): unknown => CHAINKIT_CHAIN[network]();

let client: any = null;

/**
 * Lazily build the singleton `CryptoKitClient`. chain-kit ships its own
 * default node providers, so no RPC URLs are supplied — only the
 * metadata `NetConfig(isLogging, userAgent, rateLimitCount, rateLimitTime)`.
 * Callers reach the client through {@link getChainKitMediator}, which
 * awaits `ensureReady()` before the first construction.
 */
const getClient = (): any => {
    if (!client) {
        client = new (CryptoKitClient as any)(
            new (NetConfig as any)(false, 'Tonkeeper-Web', 5, 1000)
        );
    }
    return client;
};

/**
 * Per-chain mediator (`account` / `fee` / `sign` / `transaction` / `node`
 * delegates). Awaits chain-kit's lifecycle so synchronous chain-kit
 * calls downstream are safe.
 */
export const getChainKitMediator = async (network: ChainKitNetwork): Promise<any> => {
    await ensureReady();
    return getClient().getMediator(chainKitChainOf(network));
};

/** Test-only: drop the memoised client so tests don't share node state. */
export const _resetChainKitClientForTests = (): void => {
    client = null;
};
