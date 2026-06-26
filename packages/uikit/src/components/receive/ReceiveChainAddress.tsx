import { FC, useCallback } from 'react';
import { QRCode } from 'react-qrcode-logo';
import { useAppSdk } from '../../hooks/appSdk';
import { tReplace, useTranslation } from '../../hooks/translation';
import { cn } from '../../libs/css';
import IcCopy16 from '../../icons/components/IcCopy16';
import IcShare16 from '../../icons/components/IcShare16';
import { ReceiveChain } from './receiveChains';

interface ReceiveChainAddressProps {
    chain: ReceiveChain;
    address: string;
}

const PillButton: FC<{
    onClick: () => void;
    label?: string;
    ariaLabel?: string;
    icon: React.ReactNode;
    iconOnly?: boolean;
}> = ({ onClick, label, ariaLabel, icon, iconOnly }) => (
    <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel ?? label}
        className={cn(
            'flex h-12 items-center justify-center gap-2 rounded-full border-0 bg-buttonSecondaryBackground text-buttonSecondaryForeground transition-colors hover:bg-buttonSecondaryBackgroundHighlighted',
            iconOnly ? 'w-12 px-0' : 'px-5'
        )}
    >
        <span className="flex h-4 w-4 items-center justify-center [&>svg]:h-4 [&>svg]:w-4">
            {icon}
        </span>
        {!iconOnly && label && <span className="text-label1">{label}</span>}
    </button>
);

export const ReceiveChainAddress: FC<ReceiveChainAddressProps> = ({ chain, address }) => {
    const sdk = useAppSdk();
    const { t } = useTranslation();
    const warningTemplate = t('receive_chain_warning');
    const warningText =
        warningTemplate === 'receive_chain_warning'
            ? `Send only ${chain.nativeSymbol} and tokens in ${chain.displayName} network to this address, or you might lose your funds.`
            : tReplace(warningTemplate, {
                  coin: chain.nativeSymbol,
                  network: chain.displayName
              });

    const handleCopy = useCallback(() => {
        sdk.copyToClipboard(address, t('copied'));
    }, [sdk, address, t]);

    const handleShare = useCallback(async () => {
        if (typeof navigator !== 'undefined' && navigator.share) {
            try {
                await navigator.share({ text: address });
                return;
            } catch {
                // User cancelled or share unsupported in this context — fall through to copy.
            }
        }
        sdk.copyToClipboard(address, t('copied'));
    }, [sdk, address, t]);

    return (
        <div className="flex flex-col items-center gap-4 pb-2">
            <p className="px-4 text-center text-body1 text-textSecondary">{warningText}</p>

            <div className="relative flex flex-col items-center gap-3 rounded-large bg-constantWhite p-6">
                <div className="relative h-[248px] w-[248px]">
                    <QRCode
                        size={248}
                        value={address}
                        ecLevel="H"
                        quietZone={0}
                        qrStyle="dots"
                        eyeRadius={{ inner: 2, outer: 16 }}
                    />
                    <div
                        aria-hidden
                        className="pointer-events-none absolute left-1/2 top-1/2 h-[78px] w-[78px] -translate-x-1/2 -translate-y-1/2 bg-constantWhite"
                    />
                    <div
                        aria-hidden
                        className="pointer-events-none absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full [&>svg]:h-14 [&>svg]:w-14"
                    >
                        {chain.icon}
                    </div>
                </div>
                <p className="max-w-[240px] break-all text-center font-mono text-body1 leading-[22px] text-constantBlack">
                    {address}
                </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
                <PillButton
                    onClick={handleCopy}
                    label={t('Copy')}
                    icon={<IcCopy16 width={16} height={16} />}
                />
                <PillButton
                    onClick={handleShare}
                    iconOnly
                    ariaLabel={t('Share')}
                    icon={<IcShare16 width={16} height={16} />}
                />
            </div>
        </div>
    );
};
