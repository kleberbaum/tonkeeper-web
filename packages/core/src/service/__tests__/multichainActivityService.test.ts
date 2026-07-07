/* eslint-disable import/no-extraneous-dependencies */
import { describe, expect, it, vi } from 'vitest';

import {
    explorerLinkForActivity,
    formatMultichainAddress,
    getMultichainWalletActivities,
    MultichainActivity,
    multichainExplorerUrl,
    parseTxId,
    shortenMultichainAddress
} from '../multichainActivityService';

function makeFetch(status: number, body: unknown): typeof fetch {
    return vi.fn(async () => {
        return {
            ok: status >= 200 && status < 300,
            status,
            statusText: 'STATUS',
            json: async () => body
        } as Response;
    }) as unknown as typeof fetch;
}

const sendActivity = {
    activity_type: 'send',
    status: 'confirmed',
    block_time: '2024-09-04T17:32:00Z',
    from_chain: 'eth',
    to_chain: 'eth',
    direction: 'out',
    tx_ids: ['eth:0xdeadbeef'],
    from_address: '0xsender',
    to_address: '0xrecipient',
    out_token: {
        asset_id: 'eth/mainnet/erc20/0xshib',
        name: 'Shiba Inu',
        symbol: 'SHIB',
        decimals: 18,
        image: 'https://example/shib.png'
    },
    out_amount: '1016000000000000000000',
    out_amount_usd: 10.81,
    fee_token: {
        asset_id: 'ton/mainnet/coin',
        name: 'Toncoin',
        symbol: 'TON',
        decimals: 9,
        image: ''
    },
    fee_amount: '7400000',
    fee_amount_usd: 0.03,
    protocol: null
};

const swapActivity = {
    activity_type: 'swap',
    status: 'confirmed',
    block_time: '2024-09-04T17:32:00Z',
    from_chain: 'base',
    to_chain: 'arb',
    direction: 'self',
    tx_ids: ['base:0xaaa', 'arb:0xbbb'],
    out_token: {
        asset_id: 'base/mainnet/erc20/0xdai',
        name: 'Dai',
        symbol: 'DAI',
        decimals: 18,
        image: ''
    },
    out_amount: '1017000000000000000000',
    in_token: {
        asset_id: 'arb/mainnet/erc20/0xdai',
        name: 'Dai',
        symbol: 'DAI',
        decimals: 18,
        image: ''
    },
    in_amount: '1017000000000000000000',
    protocol: 'stargate'
};

describe('getMultichainWalletActivities', () => {
    it('normalizes the raw response, including nested tokens and missing optional fields', async () => {
        const fetchImpl = makeFetch(200, {
            activities: [sendActivity, swapActivity],
            next_cursor: 'page-2'
        });

        const res = await getMultichainWalletActivities({ walletId: 'w1', fetchImpl });

        expect(res.nextCursor).toBe('page-2');
        expect(res.activities).toHaveLength(2);

        const send = res.activities[0];
        expect(send).toMatchObject({
            activityType: 'send',
            status: 'confirmed',
            fromChain: 'eth',
            toChain: 'eth',
            direction: 'out',
            outAmount: '1016000000000000000000',
            outAmountUsd: 10.81,
            feeAmount: '7400000'
        });
        expect(send.blockTimeMs).toBe(Date.parse('2024-09-04T17:32:00Z'));
        expect(send.outToken).toMatchObject({ symbol: 'SHIB', decimals: 18 });
        expect(send.inToken).toBeUndefined();
        // The generated client's FromJSON normalizes an absent/`null` optional to `undefined`.
        expect(send.protocol).toBeUndefined();

        const swap = res.activities[1];
        expect(swap.outToken?.symbol).toBe('DAI');
        expect(swap.inToken?.symbol).toBe('DAI');
        expect(swap.feeToken).toBeUndefined();
    });

    it('coerces an unparseable block_time to 0 and defaults missing arrays', async () => {
        const fetchImpl = makeFetch(200, {
            activities: [{ ...sendActivity, block_time: 'not-a-date', tx_ids: undefined }]
        });
        const res = await getMultichainWalletActivities({ walletId: 'w1', fetchImpl });
        expect(res.activities[0].blockTimeMs).toBe(0);
        expect(res.activities[0].txIds).toEqual([]);
        expect(res.nextCursor).toBe('');
    });

    it('builds the URL with wallet id, chain, activity_type, limit and cursor', async () => {
        const fetchImpl = makeFetch(200, { activities: [], next_cursor: '' });
        await getMultichainWalletActivities({
            walletId: 'wallet/xyz',
            chain: 'tron',
            activityType: 'receive',
            limit: 30,
            cursor: 'c-9',
            fetchImpl
        });
        const url = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
        expect(url).toContain('/wallets/wallet%2Fxyz/activities?');
        expect(url).toContain('chain=tron');
        expect(url).toContain('activity_type=receive');
        expect(url).toContain('limit=30');
        expect(url).toContain('cursor=c-9');
    });

    it('omits the query string entirely when no filters are given', async () => {
        const fetchImpl = makeFetch(200, { activities: [], next_cursor: '' });
        await getMultichainWalletActivities({ walletId: 'w1', fetchImpl });
        const url = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
        expect(url).toMatch(/\/wallets\/w1\/activities$/);
    });

    it('throws on a non-2xx response', async () => {
        const fetchImpl = makeFetch(500, {});
        // The generated client raises a ResponseError on any non-2xx status.
        await expect(
            getMultichainWalletActivities({ walletId: 'w1', fetchImpl })
        ).rejects.toThrow();
    });
});

describe('multichainExplorerUrl', () => {
    it('maps each known chain to its explorer host', () => {
        expect(multichainExplorerUrl('ton', 'H')).toBe('https://tonviewer.com/transaction/H');
        expect(multichainExplorerUrl('eth', 'H')).toBe('https://etherscan.io/tx/H');
        expect(multichainExplorerUrl('base', 'H')).toBe('https://basescan.org/tx/H');
        expect(multichainExplorerUrl('btc', 'H')).toBe('https://mempool.space/tx/H');
        expect(multichainExplorerUrl('tron', 'H')).toBe('https://tronscan.org/#/transaction/H');
        expect(multichainExplorerUrl('arb', 'H')).toBe('https://arbiscan.io/tx/H');
        expect(multichainExplorerUrl('bsc', 'H')).toBe('https://bscscan.com/tx/H');
    });

    it('returns undefined for an unknown chain', () => {
        expect(multichainExplorerUrl('polygon', 'H')).toBeUndefined();
    });
});

describe('parseTxId', () => {
    it('splits on the first colon only', () => {
        expect(parseTxId('eth:0xabc')).toEqual({ chain: 'eth', hash: '0xabc' });
        expect(parseTxId('ton:hash:with:colons')).toEqual({
            chain: 'ton',
            hash: 'hash:with:colons'
        });
    });

    it('treats a colon-less value as a bare hash', () => {
        expect(parseTxId('0xabc')).toEqual({ chain: '', hash: '0xabc' });
    });
});

describe('explorerLinkForActivity', () => {
    const base = {
        activityType: 'send',
        status: 'confirmed',
        blockTimeMs: 0,
        direction: 'out',
        txIds: ['eth:0xdeadbeef']
    } as unknown as MultichainActivity;

    it('returns a link for a same-chain activity using the matching tx id', () => {
        const link = explorerLinkForActivity({ ...base, fromChain: 'eth', toChain: 'eth' });
        expect(link).toMatchObject({
            url: 'https://etherscan.io/tx/0xdeadbeef',
            hash: '0xdeadbeef'
        });
    });

    it('returns undefined for a cross-chain swap', () => {
        const link = explorerLinkForActivity({
            ...base,
            fromChain: 'base',
            toChain: 'arb',
            txIds: ['base:0xaaa', 'arb:0xbbb']
        });
        expect(link).toBeUndefined();
    });

    it('returns undefined when there is no tx id', () => {
        expect(
            explorerLinkForActivity({ ...base, fromChain: 'eth', toChain: 'eth', txIds: [] })
        ).toBeUndefined();
    });
});

describe('address formatting', () => {
    const tonRaw = '0:8f5d3e0a9d3e0a9d3e0a9d3e0a9d3e0a9d3e0a9d3e0a9d3e0a9d3e0a9d3e0a9d';

    it('renders TON addresses in non-bounceable friendly form', () => {
        const friendly = formatMultichainAddress(tonRaw, 'ton');
        expect(friendly.startsWith('U')).toBe(true);
        expect(friendly).not.toBe(tonRaw);
    });

    it('passes non-TON addresses through untouched', () => {
        expect(formatMultichainAddress('0xAbC123', 'eth')).toBe('0xAbC123');
    });

    it('falls back to the raw string for an unparseable TON address', () => {
        expect(formatMultichainAddress('not-an-address', 'ton')).toBe('not-an-address');
    });

    it('shortens a long address to 4…4', () => {
        expect(shortenMultichainAddress('0x1234567890abcdef', 'eth')).toBe('0x12…cdef');
    });
});
