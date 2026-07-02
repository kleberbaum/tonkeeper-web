import { FC, useMemo, useState } from 'react';
import BigNumber from 'bignumber.js';

import { MultichainWalletAsset } from '@tonkeeper/core/dist/service/multichainWalletService';

import { Button, Input, TokenSwitch } from '../../../primitives';
import { Modal, ModalFooter, ModalFooterPortal } from '../../../primitives/Modal';
import { cn } from '../../../libs/css';
import IcSwapVertical16 from '../../../icons/components/IcSwapVertical16';
import { useTranslation } from '../../../hooks/translation';
import { useAppContext } from '../../../hooks/appContext';
import { formatFiatCurrency, formatter } from '../../../hooks/balance';
import { useScanner } from '../../../hooks/scanner';
import {
    useChainAddressValidator,
    useEnsureChainKitReady
} from '../../../state/multichain/transfer/useMultichainTransfer';
import { parseAssetIdHead } from '../../../pages/home/multichain/multichain-utils';
import { SendAddressField } from './SendAddressField';
import {
    MultichainSendState,
    networkLabel,
    networkStandardLabel,
    tokenSwitchIcons
} from './multichainSendShared';

export interface SendFormScreenProps {
    isOpen: boolean;
    onClose: () => void;
    onBack?: () => void;
    asset: MultichainWalletAsset;
    /** Re-open the asset picker from the amount field's token pill. */
    onChangeToken: () => void;
    onContinue: (state: MultichainSendState) => void;
    /** Seed values when stepping back from the confirm screen. */
    initial?: Partial<Pick<MultichainSendState, 'toAddress' | 'amountDisplay' | 'comment'>>;
}

export const SendFormScreen: FC<SendFormScreenProps> = ({
    isOpen,
    onClose,
    onBack,
    asset,
    onChangeToken,
    onContinue,
    initial
}) => {
    const { t } = useTranslation();
    const { fiat, hideQrScanner } = useAppContext();

    const chainKitReady = useEnsureChainKitReady();
    const validateAddress = useChainAddressValidator(asset.chain);

    const [address, setAddress] = useState(initial?.toAddress ?? '');
    const [amountInput, setAmountInput] = useState(initial?.amountDisplay ?? '');
    const [inFiat, setInFiat] = useState(false);
    const [isMax, setIsMax] = useState(false);
    const [comment, setComment] = useState(initial?.comment ?? '');

    const [scanId, setScanId] = useState<number | null>(null);
    useScanner(scanId, result => {
        setAddress(result.trim());
        setAddressTouched(true);
    });

    // The address error is surfaced once the field has been "touched" (lost
    // focus at least once) and stays put when the user focuses back in — it
    // clears only when they actually change the value. Gating on focus alone
    // made the error flicker away the moment they tapped back into the field.
    const [addressTouched, setAddressTouched] = useState(false);

    const onAddressChange = (value: string) => {
        setAddress(value);
        setAddressTouched(false);
    };

    const supportsComment = asset.chain === 'ton';
    const price = asset.price;
    const balanceHuman = useMemo(
        () => new BigNumber(asset.balance).shiftedBy(-asset.decimals),
        [asset.balance, asset.decimals]
    );

    const parsedInput = new BigNumber(amountInput || '0');
    const cryptoHuman = inFiat
        ? price && price.gt(0)
            ? parsedInput.div(price)
            : new BigNumber(0)
        : parsedInput;
    const fiatValue = price ? cryptoHuman.multipliedBy(price) : undefined;

    // Until chain-kit finishes loading, `validateAddress` rejects everything
    // (its `Address` class isn't available yet), so treat validity as unknown
    // rather than invalid — never block or flag an address we can't yet check.
    const addressValid = chainKitReady && address.trim() !== '' && validateAddress(address);
    const amountValid = cryptoHuman.gt(0) && cryptoHuman.lte(balanceHuman);
    const canContinue = addressValid && amountValid;

    // Message for an address that isn't valid for the picked asset's network
    // (wrong format, or an address from a different chain). Names the expected
    // network + token standard so the user knows what to paste. Surfaced once
    // the field has been touched (and chain-kit can actually validate); it
    // persists across re-focus and clears only when the value changes.
    const addressError =
        chainKitReady && addressTouched && address.trim() !== '' && !addressValid
            ? (() => {
                  const std = networkStandardLabel(asset.assetId);
                  const net = networkLabel(parseAssetIdHead(asset.assetId).network);
                  return `${t('send_address_error')} ${
                      std
                          ? t('send_address_error_use_standard', { network: net, standard: std })
                          : t('send_address_error_use', { network: net })
                  }`;
              })()
            : undefined;

    const onAmountChange = (value: string) => {
        if (value !== '' && !/^\d*([.,]\d*)?$/.test(value)) return;
        setIsMax(false);
        setAmountInput(value.replace(',', '.'));
    };

    const onMax = () => {
        setInFiat(false);
        setIsMax(true);
        setAmountInput(balanceHuman.toFixed());
    };

    const onPaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text) onAddressChange(text.trim());
        } catch {
            /* clipboard unavailable / denied */
        }
    };

    const onToggleFiat = () => {
        if (!price || price.lte(0)) return;
        // Carry the typed value across the unit flip so the amount doesn't jump.
        setAmountInput(prev => {
            const n = new BigNumber(prev || '0');
            if (n.lte(0)) return prev;
            return inFiat ? n.div(price).toFixed() : n.multipliedBy(price).toFixed();
        });
        setInFiat(v => !v);
    };

    const submit = () => {
        if (!canContinue) return;
        onContinue({
            asset,
            toAddress: address.trim(),
            amount: BigInt(
                cryptoHuman.shiftedBy(asset.decimals).integerValue(BigNumber.ROUND_FLOOR).toFixed()
            ),
            amountDisplay: cryptoHuman.toFixed(),
            isMax,
            comment: supportsComment && comment.trim() ? comment.trim() : undefined
        });
    };

    const { icon, chainBadge } = tokenSwitchIcons(asset);
    const secondary = inFiat
        ? `${formatter.formatDisplay(cryptoHuman)} ${asset.symbol}`
        : fiatValue
        ? formatFiatCurrency(fiat, fiatValue)
        : '$ 0.00';

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            onBack={onBack}
            topBarTitle={t('send_title')}
            tall
            mobileHeight="full"
        >
            <div className="flex flex-col gap-4 pb-4">
                <SendAddressField
                    value={address}
                    onChange={onAddressChange}
                    onClear={() => onAddressChange('')}
                    onPaste={onPaste}
                    onBlur={() => setAddressTouched(true)}
                    // QR scan is only wired on the native mobile shell; the
                    // desktop/web/extension shells set `hideQrScanner`.
                    onScan={hideQrScanner ? undefined : () => setScanId(Date.now())}
                    error={addressError}
                />

                <div className="flex flex-col">
                    <div className="flex h-16 items-center gap-2 rounded-medium bg-fieldBackground px-4">
                        <div className="flex min-w-0 flex-1 flex-col">
                            <span className="text-body3 text-textSecondary">
                                {t('send_amount')}
                            </span>
                            <input
                                value={amountInput}
                                onChange={e => onAmountChange(e.target.value)}
                                inputMode="decimal"
                                placeholder="0"
                                aria-label={t('send_amount')}
                                className="w-full bg-transparent text-body1 font-medium text-textPrimary outline-none placeholder:text-textSecondary"
                            />
                        </div>
                        <TokenSwitch
                            icon={icon}
                            chainBadge={chainBadge}
                            symbol={asset.symbol}
                            onClick={onChangeToken}
                        />
                    </div>
                    <div className="flex items-start justify-between gap-2 px-0.5 pt-3 text-body2 text-textSecondary">
                        <button
                            type="button"
                            onClick={onToggleFiat}
                            disabled={!price || price.lte(0)}
                            className={cn(
                                'flex items-center gap-1',
                                price && price.gt(0) ? 'cursor-pointer' : 'cursor-default'
                            )}
                        >
                            <span>{secondary}</span>
                            {price && price.gt(0) && <IcSwapVertical16 className="h-4 w-4" />}
                        </button>
                        <div className="flex items-center gap-1 text-right">
                            <span>
                                {t('send_balance')}: {formatter.formatDisplay(balanceHuman)}{' '}
                                {asset.symbol}
                            </span>
                            <button type="button" onClick={onMax} className="text-textAccent">
                                {t('send_max')}
                            </button>
                        </div>
                    </div>
                </div>

                {supportsComment && (
                    <div className="flex flex-col">
                        <Input
                            id="send-comment"
                            value={comment}
                            onChange={setComment}
                            label={t('send_comment')}
                        />
                        {comment.trim() !== '' && (
                            <p className="px-0.5 pt-2 text-body2 text-textSecondary">
                                {t('send_comment_visible_hint')}
                            </p>
                        )}
                    </div>
                )}
            </div>

            <ModalFooterPortal>
                <ModalFooter>
                    <Button
                        variant="primaryBlue"
                        size="large"
                        fullWidth
                        disabled={!canContinue}
                        onClick={submit}
                    >
                        {t('continue')}
                    </Button>
                </ModalFooter>
            </ModalFooterPortal>
        </Modal>
    );
};
