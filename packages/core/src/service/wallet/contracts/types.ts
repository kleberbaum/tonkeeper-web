import { ChainId } from '../../../chains/types';

/**
 * Strategy that produces a chain-specific "wallet contract" handle from a
 * chain-specific args bag. Today only TON is wired up; the parameters are
 * left fully generic so Phase 2+ chains can return whatever shape they
 * need (EVM contract instance, BTC PSBT factory, etc.) without forcing a
 * lowest-common-denominator interface here.
 *
 * The MD prescribes a `WalletContractLike` minimum surface (`address`,
 * `init`, `createTransfer`, `createRequest` for V5). In practice today's
 * call sites already depend on the concrete `WalletContractVxxx` union —
 * gasless / battery / two-fa senders downcast to `WalletContractV5R1`,
 * `externalMessage()` consumes the union directly — so narrowing the
 * return to a structural interface would break those casts. Instead we
 * keep the union as the TON return type and treat `WalletContractLike` as
 * a documentary aspiration for Phase 2 when the casts get cleaned up.
 */
export interface WalletContractStrategy<TArgs = unknown, TContract = unknown> {
    readonly chain: ChainId;
    create(args: TArgs): TContract;
}
