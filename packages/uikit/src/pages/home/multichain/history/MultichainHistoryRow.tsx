import { FC, ReactNode } from 'react';

import {
    MultichainActivity,
    shortenMultichainAddress
} from '@tonkeeper/core/dist/service/multichainActivityService';

import { cn } from '../../../../libs/css';
import { useTranslation } from '../../../../hooks/translation';
import IcTrayArrowUp28 from '../../../../icons/components/IcTrayArrowUp28';
import IcTrayArrowDown28 from '../../../../icons/components/IcTrayArrowDown28';
import IcSwapHorizontalAlternative28 from '../../../../icons/components/IcSwapHorizontalAlternative28';
import IcExclamationmarkCircle16 from '../../../../icons/components/IcExclamationmarkCircle16';
import {
    assetChainCode,
    chainBadgeLabel,
    formatHistoryAmount,
    formatHistoryTimestamp
} from './multichain-history-utils';

interface Cell {
    content: ReactNode;
    className?: string;
}

const AmountText: FC<{
    sign: string;
    amount: string;
    symbol: string;
    chain: string;
    positive: boolean;
}> = ({ sign, amount, symbol, chain, positive }) => (
    <>
        <span className={positive ? 'text-accentGreen' : 'text-textPrimary'}>
            {sign} {amount} {symbol}{' '}
        </span>
        <span className="text-textSecondary">{chainBadgeLabel(chain)}</span>
    </>
);

function leadingIcon(activity: MultichainActivity): ReactNode {
    if (activity.status === 'failed' || activity.status === 'dropped') {
        return <IcExclamationmarkCircle16 className="size-7" />;
    }
    switch (activity.activityType) {
        case 'send':
            return <IcTrayArrowUp28 className="size-7" />;
        case 'receive':
            return <IcTrayArrowDown28 className="size-7" />;
        case 'swap':
            return <IcSwapHorizontalAlternative28 className="size-7" />;
    }
}

export const MultichainHistoryRow: FC<{ activity: MultichainActivity; onClick?: () => void }> = ({
    activity,
    onClick
}) => {
    const {
        t,
        i18n: { language }
    } = useTranslation();

    const isSwap = activity.activityType === 'swap';
    const isReceive = activity.activityType === 'receive';
    const isFailed = activity.status === 'failed' || activity.status === 'dropped';
    const isPending = activity.status === 'pending';

    const title = isSwap
        ? t('wallet_swap')
        : isReceive
        ? t('transaction_type_receive')
        : t('transaction_type_sent');

    const counterparty = isReceive
        ? activity.fromAddress
        : activity.toAddress ?? activity.fromAddress;
    const subtitle = counterparty
        ? shortenMultichainAddress(counterparty, activity.fromChain)
        : activity.protocol;

    const time = formatHistoryTimestamp(language, activity.blockTimeMs);

    const leftLines: Cell[] = [{ content: title, className: 'text-label1 text-textPrimary' }];
    if (subtitle) leftLines.push({ content: subtitle, className: 'text-body2 text-textSecondary' });
    if (isFailed) {
        leftLines.push({
            content: t('multichain_history_failed'),
            className: 'text-body2 text-accentOrange'
        });
    }

    const rightLines: Cell[] = [];
    if (isSwap) {
        if (activity.inToken && activity.inAmount) {
            rightLines.push({
                className: 'text-label1',
                content: (
                    <AmountText
                        sign="+"
                        amount={formatHistoryAmount(activity.inAmount, activity.inToken.decimals)}
                        symbol={activity.inToken.symbol}
                        chain={assetChainCode(activity.inToken) || activity.toChain}
                        positive
                    />
                )
            });
        }
        if (activity.outToken && activity.outAmount) {
            rightLines.push({
                className: 'text-label1',
                content: (
                    <AmountText
                        sign="−"
                        amount={formatHistoryAmount(activity.outAmount, activity.outToken.decimals)}
                        symbol={activity.outToken.symbol}
                        chain={assetChainCode(activity.outToken) || activity.fromChain}
                        positive={false}
                    />
                )
            });
        }
    } else {
        const token = isReceive ? activity.inToken : activity.outToken;
        const amount = isReceive ? activity.inAmount : activity.outAmount;
        if (token && amount) {
            rightLines.push({
                className: 'text-label1',
                content: (
                    <AmountText
                        sign={isReceive ? '+' : '−'}
                        amount={formatHistoryAmount(amount, token.decimals)}
                        symbol={token.symbol}
                        chain={assetChainCode(token) || activity.fromChain}
                        positive={isReceive}
                    />
                )
            });
        }
    }
    rightLines.push({ content: time, className: 'text-body2 text-textSecondary' });

    const lineCount = Math.max(leftLines.length, rightLines.length);

    return (
        <button
            type="button"
            onClick={onClick}
            className="flex w-full items-start rounded-medium bg-backgroundContent text-left"
        >
            <div className="flex items-center py-4 pl-4">
                <div className="relative size-11">
                    <div className="flex size-11 items-center justify-center overflow-hidden rounded-full bg-backgroundContentTint text-iconSecondary">
                        {leadingIcon(activity)}
                    </div>
                    {isPending && (
                        <div className="absolute -left-0.5 -top-0.5 size-3.5 animate-spin rounded-full border-2 border-iconSecondary border-t-transparent ring-2 ring-backgroundContent" />
                    )}
                </div>
            </div>
            <div className="flex min-w-0 flex-1 flex-col p-4">
                {Array.from({ length: lineCount }).map((_, i) => (
                    <div key={i} className="flex items-start justify-between gap-4">
                        <span className={cn('min-w-0 flex-1 truncate', leftLines[i]?.className)}>
                            {leftLines[i]?.content}
                        </span>
                        <span
                            className={cn(
                                'shrink-0 whitespace-nowrap text-right',
                                rightLines[i]?.className
                            )}
                        >
                            {rightLines[i]?.content}
                        </span>
                    </div>
                ))}
            </div>
        </button>
    );
};
