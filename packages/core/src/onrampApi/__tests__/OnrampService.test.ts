/* eslint-disable import/no-extraneous-dependencies */
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
    createOnrampOrder,
    fetchExchangeLayout,
    fetchOnrampAsset,
    fetchOnrampConfiguration,
    fetchOnrampQuote
} from '../OnrampService';
import type { CreateOnrampOrderBody, OnrampQuoteRequestBody } from '../types';

const BASE = 'https://swaps.tonkeeper.com/';

let fetchMock: ReturnType<typeof vi.fn>;

function stubFetch(status: number, body: unknown): void {
    fetchMock = vi.fn(async () => {
        return {
            ok: status >= 200 && status < 300,
            status,
            statusText: 'STATUS',
            json: async () => body
        } as Response;
    });
    vi.stubGlobal('fetch', fetchMock);
}

function lastCall(): [string, RequestInit] {
    return fetchMock.mock.calls[0] as [string, RequestInit];
}

afterEach(() => vi.unstubAllGlobals());

describe('fetchOnrampConfiguration', () => {
    it('maps assets and defaults available methods/fiats to empty arrays', async () => {
        stubFetch(200, {
            assets: [
                {
                    asset_id: 'ton/mainnet/coin',
                    symbol: 'TON',
                    network_name: 'TON',
                    decimals: 9,
                    stablecoin: false,
                    extra_id_required: false,
                    available_methods: ['card'],
                    available_fiats: ['USD', 'EUR']
                },
                {
                    asset_id: 'eth/mainnet/coin',
                    symbol: 'ETH',
                    decimals: 18,
                    stablecoin: false,
                    extra_id_required: false
                }
            ],
            next_cursor: 'c1'
        });
        const res = await fetchOnrampConfiguration(BASE, {});
        expect(res.assets[0]).toMatchObject({
            assetId: 'ton/mainnet/coin',
            networkName: 'TON',
            availableMethods: ['card'],
            availableFiats: ['USD', 'EUR']
        });
        expect(res.assets[1].availableMethods).toEqual([]);
        expect(res.assets[1].availableFiats).toEqual([]);
        expect(res.nextCursor).toBe('c1');
    });

    it('builds a query-less URL when no params are given', async () => {
        stubFetch(200, { assets: [] });
        await fetchOnrampConfiguration(BASE, {});
        const [url] = lastCall();
        expect(url).toBe('https://swaps.tonkeeper.com/v2/onramp/configuration');
    });

    it('appends supplied params and strips the trailing slash from baseUrl', async () => {
        stubFetch(200, { assets: [] });
        await fetchOnrampConfiguration(BASE, { fiat: 'USD', destinationChain: 'ton' });
        const [url] = lastCall();
        expect(url).toContain('/v2/onramp/configuration?');
        expect(url).toContain('fiat=USD');
        expect(url).toContain('destination_chain=ton');
    });

    it('throws on a non-2xx response', async () => {
        stubFetch(500, {});
        await expect(fetchOnrampConfiguration(BASE, {})).rejects.toThrow(/HTTP 500/);
    });
});

describe('fetchOnrampAsset', () => {
    it('maps the asset detail with nested payment methods, providers and limits', async () => {
        stubFetch(200, {
            asset_id: 'ton/mainnet/coin',
            symbol: 'TON',
            decimals: 9,
            stablecoin: false,
            extra_id_required: true,
            extra_id_name: 'memo',
            payment_methods: [
                {
                    type: 'card',
                    name: 'Card',
                    image: 'card.svg',
                    providers: [
                        { merchant: 'mercuryo', fiat: 'USD', limits: { min: 10, max: 1000 } },
                        { merchant: 'neocrypto', fiat: 'EUR' }
                    ]
                }
            ]
        });
        const res = await fetchOnrampAsset(BASE, { assetId: 'ton/mainnet/coin' });
        expect(res).toMatchObject({
            assetId: 'ton/mainnet/coin',
            extraIdRequired: true,
            extraIdName: 'memo'
        });
        expect(res.paymentMethods[0].providers[0].limits).toEqual({ min: 10, max: 1000 });
        expect(res.paymentMethods[0].providers[1].limits).toBeUndefined();
    });

    it('puts the assetId in the query string', async () => {
        stubFetch(200, {
            asset_id: 'x',
            symbol: 'X',
            decimals: 0,
            stablecoin: false,
            extra_id_required: false
        });
        await fetchOnrampAsset(BASE, { assetId: 'ton/mainnet/coin' });
        const [url] = lastCall();
        expect(url).toContain('/v2/onramp/asset?');
        expect(url).toContain('asset_id=ton%2Fmainnet%2Fcoin');
    });

    it('throws on a non-2xx response', async () => {
        stubFetch(404, {});
        await expect(fetchOnrampAsset(BASE, { assetId: 'x' })).rejects.toThrow(/HTTP 404/);
    });
});

describe('fetchExchangeLayout', () => {
    it('maps layout cards and sends the flow parameter', async () => {
        stubFetch(200, {
            items: [
                {
                    title: 'Buy crypto',
                    description: 'Cards, P2P & more',
                    image: 'buy.svg',
                    preferred_currency: 'USD'
                }
            ]
        });
        const res = await fetchExchangeLayout(BASE, { flow: 'deposit', currency: 'USD' });
        expect(res.items[0]).toEqual({
            title: 'Buy crypto',
            description: 'Cards, P2P & more',
            image: 'buy.svg',
            preferredCurrency: 'USD'
        });
        const [url] = lastCall();
        expect(url).toContain('flow=deposit');
        expect(url).toContain('currency=USD');
    });

    it('throws on a non-2xx response', async () => {
        stubFetch(502, {});
        await expect(fetchExchangeLayout(BASE, { flow: 'withdraw' })).rejects.toThrow(/HTTP 502/);
    });
});

describe('fetchOnrampQuote', () => {
    const body = {
        targetAssetId: 'ton/mainnet/coin',
        fiat: 'USD',
        amount: '100',
        reverse: false,
        paymentMethod: 'card',
        merchant: 'mercuryo'
    } as unknown as OnrampQuoteRequestBody;

    it('POSTs a snake_case wire body and maps the response', async () => {
        stubFetch(200, {
            items: [
                {
                    merchant: 'mercuryo',
                    payment_method: 'card',
                    amount_in: '100',
                    amount_out: '54',
                    rate: '0.54',
                    fees: {},
                    date_expire: '2026-01-01T00:00:00Z',
                    merchant_transaction_id: 'tx-1'
                }
            ],
            unavailable_reason: undefined
        });
        const res = await fetchOnrampQuote(BASE, { body });

        const [url, options] = lastCall();
        expect(url).toContain('/v2/onramp/quote');
        expect(options.method).toBe('POST');
        expect(JSON.parse(options.body as string)).toEqual({
            target_asset_id: 'ton/mainnet/coin',
            fiat: 'USD',
            amount: '100',
            reverse: false,
            payment_method: 'card',
            merchant: 'mercuryo'
        });

        expect(res.items[0]).toMatchObject({
            paymentMethod: 'card',
            amountIn: '100',
            amountOut: '54',
            merchantTransactionId: 'tx-1'
        });
        expect(res.suggested).toEqual([]);
    });

    it('omits optional wire fields that are unset', async () => {
        stubFetch(200, { items: [] });
        await fetchOnrampQuote(BASE, {
            body: {
                targetAssetId: 'ton',
                fiat: 'USD',
                amount: '100'
            } as unknown as OnrampQuoteRequestBody
        });
        const [, options] = lastCall();
        const wire = JSON.parse(options.body as string);
        expect(wire).not.toHaveProperty('payment_method');
        expect(wire).not.toHaveProperty('merchant');
        expect(wire).not.toHaveProperty('reverse');
    });

    it('throws on a non-2xx response', async () => {
        stubFetch(400, {});
        await expect(fetchOnrampQuote(BASE, { body })).rejects.toThrow(/HTTP 400/);
    });
});

describe('createOnrampOrder', () => {
    const body = {
        targetAssetId: 'ton/mainnet/coin',
        fiat: 'USD',
        amount: '100',
        destinationAddress: 'EQ...abc',
        paymentMethod: 'card',
        merchant: 'mercuryo',
        merchantTransactionId: 'tx-1'
    } as unknown as CreateOnrampOrderBody;

    it('POSTs a snake_case wire body and maps the order response', async () => {
        stubFetch(200, {
            id: 'order-1',
            merchant: 'mercuryo',
            merchant_transaction_id: 'tx-1',
            status: 'pending',
            widget_url: 'https://widget',
            destination_address: 'EQ...abc',
            amount_in: '100',
            amount_out: '54',
            rate: '0.54',
            fees: {},
            date_create: '2026-01-01T00:00:00Z'
        });
        const res = await createOnrampOrder(BASE, { body });

        const [url, options] = lastCall();
        expect(url).toContain('/v2/onramp/orders');
        expect(options.method).toBe('POST');
        expect(JSON.parse(options.body as string)).toMatchObject({
            target_asset_id: 'ton/mainnet/coin',
            destination_address: 'EQ...abc',
            payment_method: 'card',
            merchant: 'mercuryo',
            merchant_transaction_id: 'tx-1'
        });

        expect(res).toMatchObject({
            id: 'order-1',
            widgetUrl: 'https://widget',
            destinationAddress: 'EQ...abc',
            amountOut: '54'
        });
    });

    it('throws on a non-2xx response', async () => {
        stubFetch(409, {});
        await expect(createOnrampOrder(BASE, { body })).rejects.toThrow(/HTTP 409/);
    });
});
