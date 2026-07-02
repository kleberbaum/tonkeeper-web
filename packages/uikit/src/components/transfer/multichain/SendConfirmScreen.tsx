import { FC, ReactNode, useEffect, useMemo } from 'react';
import BigNumber from 'bignumber.js';

import {
    MultichainTransferInput,
    parseTransferAsset
} from '@tonkeeper/core/dist/service/chainkit/multichainTransferService';

import { Button, SwipeToConfirm } from '../../../primitives';
import { Modal } from '../../../primitives/Modal';
import { useTranslation } from '../../../hooks/translation';
import { useIsFullWidthMode } from '../../../hooks/useIsFullWidthMode';
import { useAppContext } from '../../../hooks/appContext';
import { formatFiatCurrency, formatter } from '../../../hooks/balance';
import { useActiveAccount, useActiveWalletForChain } from '../../../state/wallet';
import { useMultichainWalletAssets } from '../../../state/multichain/useMultichainWalletAssets';
import {
    useMultichainEstimateTransfer,
    useMultichainSendTransfer
} from '../../../state/multichain/transfer/useMultichainTransfer';
import { isNativeRow, parseAssetIdHead } from '../../../pages/home/multichain/multichain-utils';
import { NetworkFeeValue } from './NetworkFeeValue';
import { SendConfirmView } from './SendConfirmView';
import { MultichainSendState } from './multichainSendShared';

export interface SendConfirmScreenProps {
    isOpen: boolean;
    onClose: () => void;
    onBack?: () => void;
    state: MultichainSendState;
}

export const SendConfirmScreen: FC<SendConfirmScreenProps> = ({
    isOpen,
    onClose,
    onBack,
    state
}) => {
    const { t } = useTranslation();
    const { fiat } = useAppContext();
    const isFullWidth = useIsFullWidthMode();
    const account = useActiveAccount();
    const fromWallet = useActiveWalletForChain(state.asset.chain);
    const { data: assetsData } = useMultichainWalletAssets();

    const send = useMultichainSendTransfer();
    // No back while the transfer is in-flight or done.
    const backHandler = send.isLoading || send.isSuccess ? undefined : onBack;

    const { asset } = state;
    const network = parseAssetIdHead(asset.assetId).network;

    const input = useMemo<MultichainTransferInput | undefined>(() => {
        const parsed = parseTransferAsset(asset.assetId, {
            symbol: asset.symbol,
            name: asset.name,
            decimals: asset.decimals
        });
        if (!parsed || !fromWallet?.rawAddress) return undefined;
        return {
            asset: parsed,
            fromAddress: fromWallet.rawAddress,
            toAddress: state.toAddress,
            amount: state.amount,
            isMax: state.isMax,
            comment: state.comment
        };
    }, [asset, fromWallet, state]);

    const estimate = useMultichainEstimateTransfer({ input, enabled: isOpen && !!input });

    // Native-coin fiat rate for the chain, used to render the fee in USD
    // (the reference apps show the network fee in fiat only).
    const nativePrice = useMemo(() => {
        const native = (assetsData?.assets ?? []).find(
            a => isNativeRow(a.assetId) && parseAssetIdHead(a.assetId).network === network
        );
        return native?.price;
    }, [assetsData, network]);

    const feeNode = useMemo<ReactNode>(() => {
        const human = estimate.data
            ? new BigNumber(estimate.data.feeAmount.toString()).shiftedBy(
                  -estimate.data.feeDecimals
              )
            : undefined;
        return (
            <NetworkFeeValue
                loading={estimate.isLoading}
                error={estimate.isError}
                onRetry={() => estimate.refetch()}
                fiatText={
                    human && nativePrice
                        ? formatFiatCurrency(fiat, human.multipliedBy(nativePrice))
                        : undefined
                }
                cryptoText={
                    human
                        ? `${formatter.formatDisplay(human)} ${estimate.data!.feeSymbol}`
                        : undefined
                }
                symbol={estimate.data?.feeSymbol}
            />
        );
    }, [estimate, nativePrice, fiat]);

    const amountFiat = asset.price
        ? formatFiatCurrency(fiat, new BigNumber(state.amountDisplay).multipliedBy(asset.price))
        : undefined;

    const status = send.isLoading ? 'loading' : send.isSuccess ? 'done' : 'idle';

    useEffect(() => {
        if (!send.isSuccess) return undefined;
        const handle = window.setTimeout(onClose, 1800);
        return () => window.clearTimeout(handle);
    }, [send.isSuccess, onClose]);

    const onConfirm = () => {
        if (input) send.mutate(input);
    };

    // Desktop has no swipe affordance — a plain Confirm button; mobile swipes.
    const action =
        isFullWidth && status !== 'done' ? (
            <Button
                variant="primaryBlue"
                size="large"
                fullWidth
                loading={send.isLoading}
                disabled={!input || estimate.isLoading}
                onClick={onConfirm}
            >
                {t('send_confirm_swipe_title')}
            </Button>
        ) : (
            <SwipeToConfirm
                onConfirm={onConfirm}
                status={status}
                disabled={!input || estimate.isLoading}
                label={t('send_confirm_swipe_title')}
                hint={t('send_confirm_swipe_hint')}
                doneLabel={t('send_done')}
            />
        );

    return (
        <Modal isOpen={isOpen} onClose={onClose} onBack={backHandler} tall>
            <SendConfirmView
                asset={asset}
                accountName={account.name}
                toAddress={state.toAddress}
                amountDisplay={state.amountDisplay}
                amountFiat={amountFiat}
                comment={state.comment}
                fee={feeNode}
                feeError={estimate.isError}
                sendError={send.isError ? send.error?.message ?? t('send_failed') : undefined}
                action={action}
            />
        </Modal>
    );
};
