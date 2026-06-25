import { ReactNode } from 'react';
import type { ChainId } from '@tonkeeper/core/dist/chains/types';
import IcChainTon20 from '../../icons/components/IcChainTon20';
import IcChainEth20 from '../../icons/components/IcChainEth20';
import IcChainBtc20 from '../../icons/components/IcChainBtc20';
import IcChainBase20 from '../../icons/components/IcChainBase20';
import IcChainArb20 from '../../icons/components/IcChainArb20';
import IcChainBsc20 from '../../icons/components/IcChainBsc20';
import IcChainTron20 from '../../icons/components/IcChainTron20';

/**
 * One row per network the user can receive funds on. EVM L1/L2s
 * (Ethereum, BSC, Base, Arbitrum, …) collapse into the single
 * `'evm'` `ChainId` at the account-model layer — every EVM row in
 * the picker shows the same `rawAddress` from `getWalletByChain('evm')`.
 *
 * `nativeSymbol` is the ticker shown in the warning copy on the
 * per-chain QR page ("Send only {{nativeSymbol}} …"). `displayName`
 * is the row label and the "Your {{displayName}} address" title.
 */
export interface ReceiveChain {
    id: string;
    chainId: ChainId;
    displayName: string;
    nativeSymbol: string;
    icon: ReactNode;
}

export const RECEIVE_CHAINS: ReceiveChain[] = [
    {
        id: 'ton',
        chainId: 'ton',
        displayName: 'TON',
        nativeSymbol: 'Toncoin',
        icon: <IcChainTon20 />
    },
    {
        id: 'eth',
        chainId: 'evm',
        displayName: 'Ethereum',
        nativeSymbol: 'Ether',
        icon: <IcChainEth20 />
    },
    {
        id: 'btc',
        chainId: 'btc',
        displayName: 'Bitcoin',
        nativeSymbol: 'BTC',
        icon: <IcChainBtc20 />
    },
    {
        id: 'base',
        chainId: 'evm',
        displayName: 'Base',
        nativeSymbol: 'Ether',
        icon: <IcChainBase20 />
    },
    {
        id: 'bsc',
        chainId: 'evm',
        displayName: 'BSC',
        nativeSymbol: 'BNB',
        icon: <IcChainBsc20 />
    },
    {
        id: 'arb',
        chainId: 'evm',
        displayName: 'Arbitrum',
        nativeSymbol: 'Ether',
        icon: <IcChainArb20 />
    },
    {
        id: 'tron',
        chainId: 'tron',
        displayName: 'Tron',
        nativeSymbol: 'TRX',
        icon: <IcChainTron20 />
    }
];
