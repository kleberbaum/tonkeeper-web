import { FC, ReactNode, useState } from 'react';

import { MultichainWalletAsset } from '@tonkeeper/core/dist/service/multichainWalletService';

import { cn } from '../../../libs/css';
import { useTranslation } from '../../../hooks/translation';
import { parseAssetIdHead } from '../../../pages/home/multichain/multichain-utils';
import Wallet16 from '../../../icons/components/Wallet16';
import IcExclamationmarkCircle16 from '../../../icons/components/IcExclamationmarkCircle16';
import {
    AssetIcon,
    networkLabel,
    networkSpeedMinutesLabel,
    networkStandardLabel,
    truncateAddress
} from './multichainSendShared';

/**
 * Recipient value that reveals the full address on hover (desktop) or tap
 * (touch) — the address is truncated inline to fit the row.
 */
const RecipientValue: FC<{ address: string }> = ({ address }) => {
    const [open, setOpen] = useState(false);
    return (
        <span className="group relative inline-flex justify-end">
            <button
                type="button"
                onClick={() => setOpen(v => !v)}
                className="text-label1 text-textPrimary"
            >
                {truncateAddress(address)}
            </button>
            <span
                className={cn(
                    'pointer-events-none absolute bottom-full right-0 z-10 mb-1 max-w-[260px] break-all rounded-medium bg-backgroundContentTint px-3 py-2 text-left text-body3 text-textPrimary opacity-0 shadow-lg transition-opacity group-hover:opacity-100',
                    open && 'opacity-100'
                )}
            >
                {address}
            </span>
        </span>
    );
};

const DetailCell: FC<{ label: ReactNode; value: ReactNode; sub?: ReactNode; last?: boolean }> = ({
    label,
    value,
    sub,
    last
}) => (
    <div className={last ? '' : 'border-b border-separatorCommon'}>
        <div className="flex min-h-[56px] flex-col justify-center px-4 py-2">
            <div className="flex items-start gap-2">
                <span className="whitespace-nowrap text-body1 text-textSecondary">{label}</span>
                <span className="flex-1 text-right text-label1 text-textPrimary">{value}</span>
            </div>
            {sub && <span className="text-right text-body2 text-textSecondary">{sub}</span>}
        </div>
    </div>
);

export interface SendConfirmViewProps {
    asset: MultichainWalletAsset;
    accountName: string;
    toAddress: string;
    amountDisplay: string;
    /** Fiat equivalent of the amount, pre-formatted. */
    amountFiat?: string;
    comment?: string;
    /** Network-fee value node (see `NetworkFeeValue`). */
    fee: ReactNode;
    /** Show the "couldn't calculate network fee" banner. */
    feeError?: boolean;
    /** Send-failure message rendered under the table. */
    sendError?: string;
    /** Confirm action slot — the swipe slider (mobile) or a button (desktop). */
    action: ReactNode;
}

/**
 * Presentational body of the multichain send confirm screen: the asset header,
 * the wallet / recipient / network / amount / fee / comment table, and the
 * action slot. Pure — every value is a prop, so it renders identically in a
 * screenshot as in the app. `SendConfirmScreen` wires the data hooks and the
 * `Modal` chrome around it.
 */
export const SendConfirmView: FC<SendConfirmViewProps> = ({
    asset,
    accountName,
    toAddress,
    amountDisplay,
    amountFiat,
    comment,
    fee,
    feeError,
    sendError,
    action
}) => {
    const { t } = useTranslation();
    const network = parseAssetIdHead(asset.assetId).network;
    const standard = networkStandardLabel(asset.assetId);

    return (
        <div className="flex min-h-full flex-col">
            {feeError && (
                <div className="mb-2 flex justify-center">
                    <span className="inline-flex items-center gap-2 rounded-full bg-backgroundContent px-4 py-2 text-label2 text-textPrimary shadow-lg">
                        <span className="text-accentRed">
                            <IcExclamationmarkCircle16 className="h-5 w-5" />
                        </span>
                        {t('send_fee_error_banner')}
                    </span>
                </div>
            )}
            <div className="flex flex-col items-center pb-8 pt-2">
                <div className="pb-5">
                    <AssetIcon asset={asset} size={96} />
                </div>
                <p className="text-body1 text-textSecondary">{t('send_confirm_action')}</p>
                <p className="text-h3 text-textPrimary">
                    {t('send_confirm_transfer')} {asset.symbol}{' '}
                    <span className="text-textTertiary">{networkLabel(network)}</span>
                </p>
            </div>

            <div className="overflow-hidden rounded-medium bg-backgroundContent">
                <DetailCell
                    label={t('send_confirm_wallet')}
                    value={
                        <span className="inline-flex items-center justify-end gap-1.5">
                            <Wallet16 className="h-5 w-5" />
                            {accountName}
                        </span>
                    }
                />
                <DetailCell
                    label={t('send_confirm_recipient')}
                    value={<RecipientValue address={toAddress} />}
                />
                <DetailCell
                    label={t('send_confirm_network')}
                    value={networkLabel(network)}
                    sub={standard}
                />
                <DetailCell
                    label={t('send_amount')}
                    value={`${amountDisplay} ${asset.symbol}`}
                    sub={amountFiat}
                />
                <DetailCell
                    label={t('send_network_fee')}
                    value={fee}
                    sub={`${t('send_speed')}: ${networkSpeedMinutesLabel(network)}`}
                    last={!comment}
                />
                {comment && <DetailCell label={t('send_comment')} value={comment} last />}
            </div>

            {sendError && (
                <p className="px-1 pt-3 text-center text-body2 text-accentRed">{sendError}</p>
            )}

            <div className="mt-auto pt-4">{action}</div>
        </div>
    );
};
