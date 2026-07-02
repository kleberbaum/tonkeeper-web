/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    Account as ChainkitAccount,
    Address as ChainkitAddress,
    Asset as ChainkitAsset,
    CryptoWallet as ChainkitCryptoWallet,
    Transaction as ChainkitTransaction,
    TokenType as ChainkitTokenType
} from '@tonkeeper/chainkit';

import { unwrap } from '../../chains/result';
import {
    ChainKitNetwork,
    chainKitChainOf,
    getChainKitMediator,
    isSupportedChainKitNetwork
} from './chainKitClient';

/**
 * Multichain transfer service — the web equivalent of iOS `ChainKitService`
 * / Android `ChainKitProvider`. Drives chain-kit's per-chain mediator to
 * estimate and broadcast a transfer on EVM (Ethereum / Base / BSC /
 * Arbitrum), Bitcoin, TRON, and TON.
 *
 * It is SDK-agnostic: callers pass the plaintext BIP39 mnemonic (resolved
 * via the app's passcode / keychain path) into {@link sendMultichainTransfer};
 * {@link estimateMultichainTransfer} needs only the public sender address.
 */

const TOKEN_TYPE_JS: Record<string, () => unknown> = {
    erc20: () => (ChainkitTokenType as any).Erc20,
    bep20: () => (ChainkitTokenType as any).Bep20,
    trc20: () => (ChainkitTokenType as any).Trc20,
    trc10: () => (ChainkitTokenType as any).Trc10,
    jetton: () => (ChainkitTokenType as any).Jetton
};

export interface ChainKitTransferAsset {
    /** Full backend asset id (`<network>/<chain-network>/<type>/<addr>`). */
    assetId: string;
    network: ChainKitNetwork;
    /** Native coin of the chain (TON / ETH / BTC / TRX) — sent via `Asset.Coin`. */
    isNative: boolean;
    /** Token contract address (token assets only). */
    contract?: string;
    /** Backend type segment: `erc20` | `bep20` | `trc20` | `trc10` | `jetton`. */
    tokenType?: string;
    symbol: string;
    name: string;
    decimals: number;
}

export interface MultichainTransferEstimation {
    /** Network fee in the chain's native-coin smallest unit. */
    feeAmount: bigint;
    /** Native-coin decimals of the fee chain (e.g. ETH = 18). */
    feeDecimals: number;
    /** Native-coin symbol of the fee chain (e.g. `ETH`). */
    feeSymbol: string;
}

export interface MultichainTransferInput {
    asset: ChainKitTransferAsset;
    fromAddress: string;
    toAddress: string;
    /** Amount in the asset's smallest unit. */
    amount: bigint;
    isMax: boolean;
    /** On-chain comment; honoured only where {@link chainSupportsComment} is true. */
    comment?: string;
}

/** Only TON carries an on-chain comment/memo. Mirrors iOS `isSupportComment`. */
export const chainSupportsComment = (network: ChainKitNetwork): boolean => network === 'ton';

/**
 * Parse a backend `assetId` into the shape this service transacts on, or
 * `undefined` when the network isn't transactable by this chain-kit build
 * (polygon / avalanche / sol). Callers should disable send for those.
 */
export const parseTransferAsset = (
    assetId: string,
    meta: { symbol: string; name: string; decimals: number }
): ChainKitTransferAsset | undefined => {
    const [network, , type = '', contract = ''] = assetId.split('/');
    if (!isSupportedChainKitNetwork(network)) return undefined;
    const isNative = type === 'coin';
    return {
        assetId,
        network,
        isNative,
        contract: isNative ? undefined : contract || undefined,
        tokenType: isNative ? undefined : type,
        symbol: meta.symbol,
        name: meta.name,
        decimals: meta.decimals
    };
};

const buildChainKitAsset = (asset: ChainKitTransferAsset, chain: unknown): unknown => {
    if (asset.isNative) {
        return (ChainkitAsset as any).Coin.Companion.of(chain);
    }
    if (!asset.contract) {
        throw new Error(`Token asset ${asset.assetId} has no contract address`);
    }
    const tokenTypeFactory = asset.tokenType ? TOKEN_TYPE_JS[asset.tokenType] : undefined;
    if (!tokenTypeFactory) {
        throw new Error(`Unsupported token type "${asset.tokenType}" for ${asset.assetId}`);
    }
    return new (ChainkitAsset as any).Token(
        asset.assetId,
        chain,
        asset.symbol,
        asset.name,
        asset.decimals,
        (ChainkitAddress as any).Companion.force(asset.contract, chain),
        tokenTypeFactory(),
        ''
    );
};

const buildTransfer = (
    input: MultichainTransferInput,
    chain: unknown,
    account: unknown
): unknown => {
    const energy = (ChainkitAsset as any).Coin.Companion.of(chain);
    const to = (ChainkitAddress as any).Companion.force(input.toAddress, chain);
    const meta =
        input.comment && chainSupportsComment(input.asset.network) ? input.comment : undefined;
    return new (ChainkitTransaction as any).Transfer(
        account,
        input.amount,
        energy,
        to,
        input.isMax,
        meta
    );
};

/**
 * chain-kit's `calculateFee` runs a live gas/resource estimation that can
 * fail (e.g. EVM `eth_estimateGas` reverts on an under-funded sender).
 * Fall back to the heuristic `getDefaultFee` so the confirm screen always
 * has a fee to show.
 */
const resolveFee = async (mediator: any, transfer: unknown): Promise<any> => {
    const calc = await mediator.fee.calculateFee(transfer);
    if (calc.isOk) return calc.unwrap();
    const def = await mediator.fee.getDefaultFee(transfer);
    return unwrap(def);
};

export const estimateMultichainTransfer = async (
    input: MultichainTransferInput
): Promise<MultichainTransferEstimation> => {
    const { network } = input.asset;
    const mediator = await getChainKitMediator(network);
    const chain = chainKitChainOf(network);
    const asset = buildChainKitAsset(input.asset, chain);
    const account = (ChainkitAccount as any).Companion.watch(
        (ChainkitAddress as any).Companion.force(input.fromAddress, chain),
        asset
    );
    const transfer = buildTransfer(input, chain, account);
    const fee = await resolveFee(mediator, transfer);
    return {
        feeAmount: fee.amount as bigint,
        feeDecimals: (chain as any).coinDecimals as number,
        feeSymbol: (chain as any).coinSymbol as string
    };
};

export const sendMultichainTransfer = async (
    input: MultichainTransferInput & { mnemonic: string[] }
): Promise<{ hash: string }> => {
    const { network } = input.asset;
    const mediator = await getChainKitMediator(network);
    const chain = chainKitChainOf(network);

    const wallet = (ChainkitCryptoWallet as any).Companion.fromMnemonic(input.mnemonic.join(' '));
    const asset = buildChainKitAsset(input.asset, chain);
    const account = (ChainkitAccount as any).Companion.owned(
        wallet.getAddress(chain),
        asset,
        wallet.getPublicKeyHex(chain),
        wallet.getPublicKeySegWit(chain)
    );
    const transfer = buildTransfer(input, chain, account);

    const fee = await resolveFee(mediator, transfer);
    const nonce = unwrap(await mediator.account.estimateNonce(account)) as bigint;

    // Bitcoin signs across every UTXO's key, so it needs the full HD
    // wallet; the single-key chains sign with the chain's private key.
    const signRes =
        network === 'btc'
            ? await mediator.sign.transaction.signAndEncodeWithWallet(transfer, fee, nonce, wallet)
            : await mediator.sign.transaction.signAndEncodeWithPrivateKey(
                  transfer,
                  fee,
                  nonce,
                  wallet.getPrivateKey(chain)
              );
    const sigSet = unwrap(signRes) as any;
    const output = sigSet.firstOutput();

    const hash = unwrap(
        await mediator.transaction.sendEncodedTransaction(account, output)
    ) as string;
    return { hash };
};
