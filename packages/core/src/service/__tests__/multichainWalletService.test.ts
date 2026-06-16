/* eslint-disable import/no-extraneous-dependencies */
import { describe, expect, it, vi } from 'vitest';

import { computeMultichainWalletId, getMultichainWalletAssets } from '../multichainWalletService';

describe('computeMultichainWalletId', () => {
    it('returns hex sha256 of mnemonic-words joined by single spaces', () => {
        const mnemonic = [
            'abandon',
            'abandon',
            'abandon',
            'abandon',
            'abandon',
            'abandon',
            'abandon',
            'abandon',
            'abandon',
            'abandon',
            'abandon',
            'about'
        ];
        const id = computeMultichainWalletId(mnemonic);
        expect(id).toMatch(/^[0-9a-f]{64}$/);
        expect(id).toBe('c557eec878dfd852ba3f88087c4f350f09c55537ab5e549c3cd14320ec3cef38');
    });

    it('is stable for the same mnemonic across calls', () => {
        const m = ['orbit', 'before', 'frozen', 'elbow'];
        expect(computeMultichainWalletId(m)).toBe(computeMultichainWalletId(m));
    });

    it('differs for different mnemonics', () => {
        expect(computeMultichainWalletId(['alpha'])).not.toBe(computeMultichainWalletId(['beta']));
    });
});

describe('getMultichainWalletAssets', () => {
    const sampleResponse = {
        assets: [
            {
                asset: {
                    asset_id: 'ton/mainnet/coin',
                    name: 'Ton Coin',
                    symbol: 'TON',
                    decimals: 9,
                    image: 'https://example/ton.svg'
                },
                price: {
                    prices: { USD: 1.84 },
                    diff_24h: { USD: '+7.32%' }
                },
                is_hidden: false,
                balance: '2345000000000'
            },
            {
                asset: {
                    asset_id: 'eth/mainnet/coin',
                    name: 'Ethereum',
                    symbol: 'ETH',
                    decimals: 18,
                    image: 'https://example/eth.svg'
                },
                price: {
                    prices: { USD: 2069.87 },
                    diff_24h: { USD: '+0.05%' }
                },
                is_hidden: false,
                balance: '560000000000000000'
            },
            {
                asset: {
                    asset_id: 'unsupported/whatever',
                    name: 'Mystery',
                    symbol: 'XYZ',
                    decimals: 0,
                    image: ''
                },
                is_hidden: false,
                balance: '0'
            }
        ],
        fiat_price: { USD: '1.0' },
        next_cursor: ''
    };

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

    it('maps the raw response into MultichainWalletAsset rows and drops unknown chains', async () => {
        const fetchImpl = makeFetch(200, sampleResponse);
        const res = await getMultichainWalletAssets({
            walletId: 'a'.repeat(64),
            currency: 'USD',
            fetchImpl
        });

        expect(res.assets).toHaveLength(2);
        expect(res.assets[0]).toMatchObject({
            chain: 'ton',
            symbol: 'TON',
            balance: '2345000000000',
            diff24h: '+7.32%'
        });
        expect(res.assets[0].price?.toString()).toBe('1.84');
        expect(res.assets[1]).toMatchObject({
            chain: 'evm',
            symbol: 'ETH',
            balance: '560000000000000000',
            diff24h: '+0.05%'
        });
    });

    it('builds the correct URL with cursor and chain filter', async () => {
        const fetchImpl = vi.fn(async () => {
            return {
                ok: true,
                status: 200,
                statusText: 'OK',
                json: async () => ({ assets: [], fiat_price: {}, next_cursor: '' })
            } as Response;
        }) as unknown as typeof fetch;
        await getMultichainWalletAssets({
            walletId: 'wallet-xyz',
            currency: 'EUR',
            chain: 'eth',
            limit: 25,
            cursor: 'page-2',
            availableOnly: true,
            fetchImpl
        });
        const url = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
        expect(url).toContain('/wallets/wallet-xyz/assets?');
        expect(url).toContain('currencies=eur');
        expect(url).toContain('chain=eth');
        expect(url).toContain('limit=25');
        expect(url).toContain('cursor=page-2');
        expect(url).toContain('available_only=true');
    });

    it('throws on non-2xx response', async () => {
        const fetchImpl = makeFetch(404, { error: 'not found' });
        await expect(
            getMultichainWalletAssets({
                walletId: 'unknown',
                currency: 'USD',
                fetchImpl
            })
        ).rejects.toThrow(/404/);
    });
});
