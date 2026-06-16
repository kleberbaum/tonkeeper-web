import { ReactNode } from 'react';

import IcChainTon20 from '../../../icons/components/IcChainTon20';
import IcChainEth20 from '../../../icons/components/IcChainEth20';
import IcChainBtc20 from '../../../icons/components/IcChainBtc20';
import IcChainBase20 from '../../../icons/components/IcChainBase20';
import IcChainArb20 from '../../../icons/components/IcChainArb20';
import IcChainBsc20 from '../../../icons/components/IcChainBsc20';
import IcChainTron20 from '../../../icons/components/IcChainTron20';

/**
 * Network registry for the multichain portfolio. The backend returns
 * asset IDs in `<network>/<chain-network>/<type>/<address>` form (e.g.
 * `base/mainnet/coin`, `tron/mainnet/trc20/<addr>`). The first segment
 * is the network code we map here.
 *
 * Native coins (TON, ETH on Ethereum, BTC, TRX on Tron, SOL on Solana)
 * are the only `coin`-type rows with `network` in `NATIVE_HOME_NETWORKS`
 * — those rows render without a chain chip or chain badge overlay.
 * Everything else gets both.
 *
 * Icons are local — `wallet.tonkeeper.com` is this project's own prod
 * CDN, so a remote URL guess like `/img/eth.svg` 404s by definition.
 * The Android and iOS apps both ship their chain icons as bundled
 * assets; we follow suit via the `IcChain*20` components.
 */

interface NetworkInfo {
    label: string;
    icon: ReactNode;
}

export const NETWORK_INFO: Record<string, NetworkInfo> = {
    ton: { label: 'Ton', icon: <IcChainTon20 /> },
    eth: { label: 'Ethereum', icon: <IcChainEth20 /> },
    base: { label: 'Base', icon: <IcChainBase20 /> },
    arb: { label: 'Arbitrum', icon: <IcChainArb20 /> },
    bsc: { label: 'BSC', icon: <IcChainBsc20 /> },
    btc: { label: 'Bitcoin', icon: <IcChainBtc20 /> },
    tron: { label: 'Tron', icon: <IcChainTron20 /> }
};

const NATIVE_HOME_NETWORKS = new Set(['ton', 'eth', 'btc', 'tron', 'sol']);

export function parseAssetIdHead(assetId: string): { network: string; type: string } {
    const [network = '', _chain = '', type = ''] = assetId.split('/');
    return { network, type };
}

export function isNativeRow(assetId: string): boolean {
    const { network, type } = parseAssetIdHead(assetId);
    return type === 'coin' && NATIVE_HOME_NETWORKS.has(network);
}

export function networkLabel(networkCode: string): string {
    return NETWORK_INFO[networkCode]?.label ?? networkCode.toUpperCase();
}

export function networkIcon(networkCode: string): ReactNode {
    return NETWORK_INFO[networkCode]?.icon;
}
