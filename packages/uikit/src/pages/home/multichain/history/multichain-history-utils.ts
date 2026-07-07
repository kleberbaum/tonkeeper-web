import BigNumber from 'bignumber.js';

import {
    formatMultichainAddress,
    MultichainActivity,
    MultichainActivityAsset
} from '@tonkeeper/core/dist/service/multichainActivityService';
import { intlLocale } from '@tonkeeper/core/dist/entries/language';

import { formatter } from '../../../../hooks/balance';
import { parseAssetIdHead } from '../multichain-utils';

/** `[groupKey, activities]`, newest group first, newest item first within. */
export type MultichainActivityGroup = [string, MultichainActivity[]];

/**
 * Bucket an activity into a date group, mirroring the legacy TON history
 * (`today` / `yesterday` / `month-<day>` / `year-<y>-<m>`) so both feeds
 * read identically. `getActivityTitle` renders the same keys.
 */
function groupKeyFor(ms: number, today: Date, yesterday: Date): string {
    const date = new Date(ms);
    if (today.toDateString() === date.toDateString()) return 'today';
    if (yesterday.toDateString() === date.toDateString() && today.getMonth() === date.getMonth()) {
        return 'yesterday';
    }
    if (today.getMonth() === date.getMonth() && today.getFullYear() === date.getFullYear()) {
        return `month-${date.getDate()}`;
    }
    return `year-${date.getFullYear()}-${date.getMonth() + 1}`;
}

export function groupMultichainActivities(
    list: MultichainActivity[],
    now: Date = new Date()
): MultichainActivityGroup[] {
    const sorted = [...list].sort((a, b) => b.blockTimeMs - a.blockTimeMs);

    const today = now;
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    const groups = new Map<string, MultichainActivity[]>();
    for (const activity of sorted) {
        const key = groupKeyFor(activity.blockTimeMs, today, yesterday);
        const bucket = groups.get(key);
        if (bucket) bucket.push(activity);
        else groups.set(key, [activity]);
    }
    return [...groups.entries()];
}

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

/**
 * Group header label, mirroring the legacy TON history so both feeds read
 * identically: `today` / `yesterday` render the relative day, `month-<day>`
 * spells out the day + month, earlier years add the year, and any other
 * current-year group names just the month.
 */
export function historyGroupTitle(language: string, key: string, ms: number): string {
    const locale = intlLocale(language);

    if (key === 'today') {
        return capitalize(
            new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(0, 'day')
        );
    }
    if (key === 'yesterday') {
        return capitalize(
            new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(-1, 'day')
        );
    }

    const date = new Date(ms);
    if (key.startsWith('month')) {
        return capitalize(
            new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long' }).format(date)
        );
    }
    if (date.getFullYear() < new Date().getFullYear()) {
        return capitalize(
            new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(date)
        );
    }
    return capitalize(new Intl.DateTimeFormat(locale, { month: 'long' }).format(date));
}

export function formatHistoryTime(language: string, ms: number): string {
    return new Intl.DateTimeFormat(language.replaceAll('_', '-'), {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).format(new Date(ms));
}

/**
 * Row timestamp: today / yesterday / this month show only the time; an earlier
 * month in the current year adds the locale-formatted date (`Jun 12, 14:30` in
 * en); an earlier year also adds the year. The month-group header only names the
 * month, so the day has to live on the row.
 */
export function formatHistoryTimestamp(
    language: string,
    ms: number,
    now: Date = new Date()
): string {
    const date = new Date(ms);
    const time = formatHistoryTime(language, ms);

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();
    const sameYear = date.getFullYear() === now.getFullYear();
    const sameMonth = sameYear && date.getMonth() === now.getMonth();

    if (isToday || isYesterday || sameMonth) return time;

    const dayMonth = new Intl.DateTimeFormat(language.replaceAll('_', '-'), {
        day: '2-digit',
        month: 'short',
        ...(sameYear ? {} : { year: 'numeric' })
    }).format(date);
    return `${dayMonth}, ${time}`;
}

/**
 * Short uppercase chain code shown beside a row amount (e.g. `ETH`,
 * `TRON`, `BSC`). Polygon collapses to `POL`, matching the mockup.
 */
export function chainBadgeLabel(chainCode: string): string {
    return chainCode === 'polygon' ? 'POL' : chainCode.toUpperCase();
}

/** The chain code an asset lives on, taken from its `assetId` head. */
export function assetChainCode(asset: MultichainActivityAsset | undefined): string {
    return asset ? parseAssetIdHead(asset.assetId).network : '';
}

/** Human amount string with thin-space grouping, e.g. `1 016`. */
export function formatHistoryAmount(rawAmount: string, decimals: number): string {
    return formatter.formatDisplay(new BigNumber(rawAmount).shiftedBy(-decimals));
}

/** Detail-view date + time, e.g. `Sep 4, 17:32` in en, for the "Sent on {date}" line. */
export function formatHistoryDateTime(language: string, ms: number): string {
    const locale = language.replaceAll('_', '-');
    const date = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(
        new Date(ms)
    );
    return `${date}, ${formatHistoryTime(language, ms)}`;
}

/**
 * Detail-view counterparty address: chain-aware full format (TON →
 * non-bounceable) with the middle elided to a single line, e.g.
 * `UQF1eGnRj2WulAuII…t41JTu43sWeG21Z`.
 */
export function detailAddress(address: string, chain: string): string {
    const full = formatMultichainAddress(address, chain);
    if (full.length <= 32) return full;
    return `${full.slice(0, 16)}…${full.slice(-14)}`;
}

const TOKEN_STANDARD: Record<string, string> = {
    erc20: 'ERC20',
    trc20: 'TRC20',
    bep20: 'BEP20'
};

/** Token standard shown under the network name (ERC20 / TRC20 / …), or `undefined`
 *  for native coins and jettons that have no standard suffix. */
export function tokenStandardLabel(asset: MultichainActivityAsset | undefined): string | undefined {
    if (!asset) return undefined;
    const type = asset.assetId.split('/')[2] ?? '';
    return TOKEN_STANDARD[type];
}
