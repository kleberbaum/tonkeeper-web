/* eslint-disable import/no-extraneous-dependencies */
import { describe, expect, it } from 'vitest';

import { TonContract, TonWalletStandard, WalletVersion } from '../../entries/wallet';
import { Network } from '../../entries/network';
import { CHAIN_IDS, ChainId } from '../types';
import { selectActiveWalletForChain } from '../wallet-selector';

const FIXTURE_TON_WALLET: TonWalletStandard = {
    id: 'fixture-wallet-id',
    rawAddress: '0:0000000000000000000000000000000000000000000000000000000000000000',
    publicKey: '00'.repeat(32),
    version: WalletVersion.V5R1,
    network: Network.MAINNET
};

const FIXTURE_TON_CONTRACT: TonContract = {
    id: 'fixture-contract-id',
    rawAddress: '0:1111111111111111111111111111111111111111111111111111111111111111'
};

describe('chains/wallet-selector', () => {
    it("returns the active wallet for chain 'ton' — parity with useActiveWallet()", () => {
        expect(selectActiveWalletForChain(FIXTURE_TON_WALLET, 'ton')).toBe(FIXTURE_TON_WALLET);
    });

    it("preserves identity (===) for chain 'ton', no defensive cloning", () => {
        const result = selectActiveWalletForChain(FIXTURE_TON_WALLET, 'ton');
        expect(result).toBe(FIXTURE_TON_WALLET);
    });

    it.each(CHAIN_IDS.filter((c): c is Exclude<ChainId, 'ton'> => c !== 'ton'))(
        'returns undefined for non-TON chain %s',
        chain => {
            expect(selectActiveWalletForChain(FIXTURE_TON_WALLET, chain)).toBeUndefined();
        }
    );

    it('works on a non-standard TonContract (e.g. multisig parent shape)', () => {
        expect(selectActiveWalletForChain(FIXTURE_TON_CONTRACT, 'ton')).toBe(FIXTURE_TON_CONTRACT);
    });
});
