/* eslint-disable import/no-extraneous-dependencies */
import { describe, expect, it, vi } from 'vitest';

import { getAssetCharts, getAssetDetails, getAssetsCatalog } from '../tradingService';

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

function urlOf(fetchImpl: typeof fetch): string {
    return (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
}

describe('getAssetDetails', () => {
    const rawDetails = {
        asset: {
            asset_type: 'jetton',
            id: 'ton/mainnet/coin',
            symbol: 'TON',
            name: 'Toncoin',
            decimals: 9,
            trust_score: 95,
            image_url: 'https://example/ton.svg',
            is_scam: false,
            verification: 'whitelist'
        },
        sections: {
            about: { enabled: true, text: 'About TON', source: 'dyor' },
            overview: {
                enabled: true,
                market_cap: '1000',
                total_supply: '5000',
                circulating_supply: '4000'
            },
            trading_activity: {
                enabled: false,
                volume_change_24h: '+1.2%',
                volume_24h: '500',
                note: 'unavailable for RWA'
            },
            links: {
                enabled: true,
                items: [{ name: 'Website', url: 'https://ton.org', type: 'website' }]
            }
        },
        data_freshness_sec: 30
    };

    it('maps the raw snake_case response into camelCase AssetDetails', async () => {
        const fetchImpl = makeFetch(200, rawDetails);
        const res = await getAssetDetails({
            assetId: 'ton/mainnet/coin',
            currency: 'USD',
            fetchImpl
        });

        expect(res.asset).toEqual({
            assetType: 'jetton',
            assetId: 'ton/mainnet/coin',
            symbol: 'TON',
            name: 'Toncoin',
            decimals: 9,
            trustScore: 95,
            image: 'https://example/ton.svg',
            isScam: false,
            verification: 'whitelist'
        });
        expect(res.overview).toMatchObject({
            enabled: true,
            marketCap: '1000',
            totalSupply: '5000',
            circulatingSupply: '4000'
        });
        expect(res.tradingActivity).toMatchObject({ enabled: false, volumeChange24h: '+1.2%' });
        expect(res.links.items).toEqual([
            { name: 'Website', url: 'https://ton.org', type: 'website' }
        ]);
        expect(res.dataFreshnessSec).toBe(30);
    });

    it('defaults links.items to an empty array when absent', async () => {
        const fetchImpl = makeFetch(200, {
            ...rawDetails,
            sections: { ...rawDetails.sections, links: { enabled: false } }
        });
        const res = await getAssetDetails({ assetId: 'x', currency: 'USD', fetchImpl });
        expect(res.links.items).toEqual([]);
    });

    it('lowercases the currency and encodes the assetId in the URL', async () => {
        const fetchImpl = makeFetch(200, rawDetails);
        await getAssetDetails({ assetId: 'ton/mainnet/coin', currency: 'EUR', fetchImpl });
        const url = urlOf(fetchImpl);
        expect(url).toContain('/assets/ton%2Fmainnet%2Fcoin/details?');
        expect(url).toContain('currency=eur');
    });

    it('throws on a non-2xx response', async () => {
        const fetchImpl = makeFetch(503, {});
        await expect(
            getAssetDetails({ assetId: 'ton', currency: 'USD', fetchImpl })
        ).rejects.toThrow(/503/);
    });
});

describe('getAssetsCatalog', () => {
    const rawCatalog = {
        items: [
            {
                asset: {
                    id: 'ton/mainnet/coin',
                    symbol: 'TON',
                    name: 'Toncoin',
                    decimals: 9,
                    image_url: 'https://example/ton.svg',
                    is_scam: false,
                    verification: 'whitelist'
                },
                metrics: {
                    price: '1.84',
                    change_24h_percent: '+7.32',
                    market_cap: '1000',
                    volume_24h: '500'
                }
            },
            {
                // Minimal item: no metrics, no image/verification/is_scam.
                asset: { id: 'eth/mainnet/coin', symbol: 'ETH', name: 'Ethereum', decimals: 18 }
            }
        ],
        next_cursor: 'page-2'
    };

    it('maps items and fills defaults for missing optional fields', async () => {
        const fetchImpl = makeFetch(200, rawCatalog);
        const res = await getAssetsCatalog({ currency: 'USD', fetchImpl });

        expect(res.items).toHaveLength(2);
        expect(res.items[0]).toEqual({
            assetId: 'ton/mainnet/coin',
            symbol: 'TON',
            name: 'Toncoin',
            decimals: 9,
            image: 'https://example/ton.svg',
            isScam: false,
            verification: 'whitelist',
            price: '1.84',
            change24hPercent: '+7.32',
            marketCap: '1000',
            volume24h: '500'
        });
        expect(res.items[1]).toMatchObject({
            assetId: 'eth/mainnet/coin',
            image: '',
            isScam: false,
            verification: 'none',
            price: undefined,
            marketCap: undefined
        });
        expect(res.nextCursor).toBe('page-2');
    });

    it('returns an empty nextCursor when the server omits it', async () => {
        const fetchImpl = makeFetch(200, { items: [] });
        const res = await getAssetsCatalog({ currency: 'USD', fetchImpl });
        expect(res.items).toEqual([]);
        expect(res.nextCursor).toBe('');
    });

    it('builds the URL with every supplied query parameter', async () => {
        const fetchImpl = makeFetch(200, { items: [], next_cursor: '' });
        await getAssetsCatalog({
            currency: 'EUR',
            query: 'ton',
            chain: 'ton',
            sort: 'market_cap',
            order: 'asc',
            pageSize: 25,
            cursor: 'c1',
            fetchImpl
        });
        const url = urlOf(fetchImpl);
        expect(url).toContain('/assets?');
        expect(url).toContain('currency=eur');
        expect(url).toContain('q=ton');
        expect(url).toContain('chain=ton');
        expect(url).toContain('sort=market_cap');
        expect(url).toContain('order=asc');
        expect(url).toContain('page_size=25');
        expect(url).toContain('cursor=c1');
    });

    it('omits unset optional query parameters', async () => {
        const fetchImpl = makeFetch(200, { items: [], next_cursor: '' });
        await getAssetsCatalog({ currency: 'USD', fetchImpl });
        const url = urlOf(fetchImpl);
        expect(url).not.toContain('chain=');
        expect(url).not.toContain('sort=');
        expect(url).not.toContain('cursor=');
    });

    it('throws on a non-2xx response', async () => {
        const fetchImpl = makeFetch(500, {});
        await expect(getAssetsCatalog({ currency: 'USD', fetchImpl })).rejects.toThrow(/500/);
    });
});

describe('getAssetCharts', () => {
    it('normalises the tuple-array response into ChartPoint objects', async () => {
        const fetchImpl = makeFetch(200, [
            [1700000000, 1.8],
            [1700003600, 1.95]
        ]);
        const res = await getAssetCharts({ assetId: 'ton', currency: 'USD', fetchImpl });
        expect(res).toEqual([
            { timestamp: 1700000000, price: 1.8 },
            { timestamp: 1700003600, price: 1.95 }
        ]);
    });

    it('passes the window and points-count query parameters', async () => {
        const fetchImpl = makeFetch(200, []);
        await getAssetCharts({
            assetId: 'ton/mainnet/coin',
            currency: 'USD',
            startDate: 100,
            endDate: 200,
            pointsCount: 50,
            fetchImpl
        });
        const url = urlOf(fetchImpl);
        expect(url).toContain('/assets/ton%2Fmainnet%2Fcoin/charts?');
        expect(url).toContain('start_date=100');
        expect(url).toContain('end_date=200');
        expect(url).toContain('points_count=50');
    });

    it('throws on a non-2xx response', async () => {
        const fetchImpl = makeFetch(404, {});
        await expect(
            getAssetCharts({ assetId: 'ton', currency: 'USD', fetchImpl })
        ).rejects.toThrow(/404/);
    });
});
