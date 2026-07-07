import { FC, ReactNode } from 'react';
import BigNumber from 'bignumber.js';

import {
    explorerLinkForActivity,
    MultichainActivity,
    MultichainActivityAsset
} from '@tonkeeper/core/dist/service/multichainActivityService';
import { FiatCurrencies } from '@tonkeeper/core/dist/entries/fiat';

import { Button } from '../../../../primitives';
import { Modal, ModalFooter, ModalFooterPortal } from '../../../../primitives/Modal';
import { cn } from '../../../../libs/css';
import { useAppSdk } from '../../../../hooks/appSdk';
import { formatFiatCurrency } from '../../../../hooks/balance';
import { useTranslation } from '../../../../hooks/translation';
import { networkIcon, networkLabel } from '../multichain-utils';
import {
    detailAddress,
    formatHistoryAmount,
    formatHistoryDateTime,
    tokenStandardLabel
} from './multichain-history-utils';

const TokenCircle: FC<{ token?: MultichainActivityAsset; chain: string; className: string }> = ({
    token,
    chain,
    className
}) =>
    token?.image ? (
        <img src={token.image} alt="" className={cn('rounded-full object-cover', className)} />
    ) : (
        <div
            className={cn(
                'flex items-center justify-center overflow-hidden rounded-full bg-backgroundContent [&>svg]:size-full',
                className
            )}
        >
            {networkIcon(chain)}
        </div>
    );

const ChainBadge: FC<{ chain: string; className: string }> = ({ chain, className }) => (
    <div
        className={cn(
            'absolute overflow-hidden rounded-full border-4 border-backgroundPage [&>svg]:size-full',
            className
        )}
    >
        {networkIcon(chain)}
    </div>
);

const AmountTitle: FC<{ sign: string; amount: string; symbol: string; network: string }> = ({
    sign,
    amount,
    symbol,
    network
}) => (
    <>
        {sign} {amount} {symbol} <span className="text-textTertiary">{network}</span>
    </>
);

const Cell: FC<{ children: ReactNode; last?: boolean }> = ({ children, last }) => (
    <div className={cn('bg-backgroundContent px-4', !last && 'border-b border-separatorCommon')}>
        {children}
    </div>
);

const LabelValueCell: FC<{ label: string; value: ReactNode; sub?: ReactNode; last?: boolean }> = ({
    label,
    value,
    sub,
    last
}) => (
    <Cell last={last}>
        <div className="flex flex-col justify-center py-4">
            <div className="flex items-start gap-2 text-body1">
                <span className="shrink-0 text-textSecondary">{label}</span>
                <span className="min-w-0 flex-1 text-right text-label1 text-textPrimary">
                    {value}
                </span>
            </div>
            {sub && <div className="text-right text-body2 text-textSecondary">{sub}</div>}
        </div>
    </Cell>
);

function fiat(usd?: number): string | undefined {
    return usd === undefined
        ? undefined
        : formatFiatCurrency(FiatCurrencies.USD, new BigNumber(usd));
}

export const MultichainHistoryDetail: FC<{
    activity?: MultichainActivity;
    isOpen: boolean;
    onClose: () => void;
}> = ({ activity, isOpen, onClose }) => {
    const {
        t,
        i18n: { language }
    } = useTranslation();
    const sdk = useAppSdk();

    if (!activity) return null;

    const isSwap = activity.activityType === 'swap';
    const isReceive = activity.activityType === 'receive';
    const isFailed = activity.status === 'failed' || activity.status === 'dropped';
    const isPending = activity.status === 'pending';

    const primaryToken = isReceive ? activity.inToken : activity.outToken;
    const primaryUsd = isReceive ? activity.inAmountUsd : activity.outAmountUsd;

    const dateKey = isSwap
        ? 'multichain_history_swapped_date'
        : isReceive
        ? 'transaction_receive_date'
        : 'transaction_sent_date';

    const counterparty = isReceive ? activity.fromAddress : activity.toAddress;
    const addressLabel = isReceive
        ? t('multichain_history_sender_address')
        : t('multichain_history_recipient_address');

    const networkValue = isSwap ? (
        <>
            {networkLabel(activity.fromChain)} <span className="text-textSecondary">→</span>{' '}
            {networkLabel(activity.toChain)}
        </>
    ) : (
        networkLabel(activity.fromChain)
    );
    const networkSub = isSwap ? undefined : tokenStandardLabel(primaryToken);

    const feeVisible = Boolean(activity.feeToken && activity.feeAmount);
    const comment =
        typeof activity.meta?.comment === 'string'
            ? activity.meta.comment
            : typeof activity.meta?.memo === 'string'
            ? activity.meta.memo
            : undefined;

    const explorer = explorerLinkForActivity(activity);

    return (
        <Modal isOpen={isOpen} onClose={onClose} mobileHeight="auto">
            <div className="flex flex-col items-center pb-8">
                {isSwap ? (
                    <div className="relative h-[72px] w-[136px]">
                        <TokenCircle
                            token={activity.outToken}
                            chain={activity.fromChain}
                            className="absolute left-0 top-0 size-[72px] bg-backgroundContent"
                        />
                        <TokenCircle
                            token={activity.inToken}
                            chain={activity.toChain}
                            className="absolute left-16 top-0 size-[72px] border-4 border-backgroundPage bg-backgroundContent"
                        />
                        <ChainBadge
                            chain={activity.fromChain}
                            className="-bottom-1 left-[2px] size-[26px]"
                        />
                        <ChainBadge
                            chain={activity.toChain}
                            className="-bottom-1 right-[2px] size-[26px]"
                        />
                    </div>
                ) : (
                    <div className="relative size-24">
                        <TokenCircle
                            token={primaryToken}
                            chain={activity.fromChain}
                            className="size-24 bg-backgroundContent"
                        />
                        <ChainBadge
                            chain={activity.fromChain}
                            className="-bottom-1 -right-1 size-8"
                        />
                    </div>
                )}

                <div className="mt-5 flex flex-col items-center gap-1 px-8 text-center">
                    <h2 className="text-h2 text-textPrimary">
                        {isSwap ? (
                            <>
                                <div>
                                    <AmountTitle
                                        sign="−"
                                        amount={formatHistoryAmount(
                                            activity.outAmount ?? '0',
                                            activity.outToken?.decimals ?? 0
                                        )}
                                        symbol={activity.outToken?.symbol ?? ''}
                                        network={networkLabel(activity.fromChain)}
                                    />
                                </div>
                                <div>
                                    <AmountTitle
                                        sign="+"
                                        amount={formatHistoryAmount(
                                            activity.inAmount ?? '0',
                                            activity.inToken?.decimals ?? 0
                                        )}
                                        symbol={activity.inToken?.symbol ?? ''}
                                        network={networkLabel(activity.toChain)}
                                    />
                                </div>
                            </>
                        ) : (
                            <AmountTitle
                                sign={isReceive ? '+' : '−'}
                                amount={formatHistoryAmount(
                                    (isReceive ? activity.inAmount : activity.outAmount) ?? '0',
                                    primaryToken?.decimals ?? 0
                                )}
                                symbol={primaryToken?.symbol ?? ''}
                                network={networkLabel(
                                    isReceive ? activity.toChain : activity.fromChain
                                )}
                            />
                        )}
                    </h2>
                    {fiat(primaryUsd) && (
                        <div className="text-body1 text-textSecondary">{fiat(primaryUsd)}</div>
                    )}
                    <div className="text-body1 text-textSecondary">
                        {t(dateKey, {
                            date: formatHistoryDateTime(language, activity.blockTimeMs)
                        })}
                    </div>
                    {isFailed && (
                        <div className="text-body1 text-accentOrange">
                            {t('multichain_history_failed')}
                        </div>
                    )}
                    {isPending && (
                        <div className="flex items-center gap-1.5 text-body1 text-textSecondary">
                            {t('multichain_history_pending')}
                            <span className="size-4 animate-spin rounded-full border-2 border-iconSecondary border-t-transparent" />
                        </div>
                    )}
                </div>

                <div className="mt-2 w-full px-4">
                    <div className="overflow-hidden rounded-medium">
                        {counterparty && (
                            <Cell>
                                <div className="flex flex-col gap-0.5 py-3">
                                    <span className="text-body2 text-textSecondary">
                                        {addressLabel}
                                    </span>
                                    <span className="break-all text-label1 text-textPrimary">
                                        {detailAddress(counterparty, activity.fromChain)}
                                    </span>
                                </div>
                            </Cell>
                        )}
                        <LabelValueCell
                            label={t('send_confirm_network')}
                            value={networkValue}
                            sub={networkSub}
                            last={!feeVisible && !comment}
                        />
                        {feeVisible && (
                            <LabelValueCell
                                label={t('send_network_fee')}
                                value={`${formatHistoryAmount(
                                    activity.feeAmount as string,
                                    activity.feeToken?.decimals ?? 0
                                )} ${activity.feeToken?.symbol ?? ''}`}
                                sub={fiat(activity.feeAmountUsd)}
                                last={!comment}
                            />
                        )}
                        {comment && (
                            <LabelValueCell label={t('send_comment')} value={comment} last />
                        )}
                    </div>
                </div>
            </div>

            <ModalFooterPortal>
                <ModalFooter>
                    {explorer && (
                        <Button
                            variant="secondary"
                            size="small"
                            fullWidth
                            onClick={() => sdk.openPage(explorer.url)}
                        >
                            {t('multichain_history_transaction')} {explorer.shortHash}
                        </Button>
                    )}
                </ModalFooter>
            </ModalFooterPortal>
        </Modal>
    );
};
