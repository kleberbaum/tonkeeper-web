import { FC, useState } from 'react';

import { MultichainWalletAsset } from '@tonkeeper/core/dist/service/multichainWalletService';

import { useTranslation } from '../../../../hooks/translation';
import { SendIcon, ReceiveIcon } from '../../../../components/home/HomeIcons';
import { MultichainSendFlow } from '../../../../components/transfer/multichain/MultichainSendFlow';
import { MultichainReceiveSheet } from '../../../../components/receive/MultichainReceiveSheet';

const Ellipsis28 = () => (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="currentColor">
        <circle cx="5" cy="14" r="2" />
        <circle cx="14" cy="14" r="2" />
        <circle cx="23" cy="14" r="2" />
    </svg>
);

export const MultichainAssetActionBar: FC<{
    asset: MultichainWalletAsset;
    hasBalance: boolean;
    compact?: boolean;
}> = ({ asset, hasBalance, compact = false }) => {
    const { t } = useTranslation();
    const [menuOpen, setMenuOpen] = useState(false);
    const [sendOpen, setSendOpen] = useState(false);
    const [receiveOpen, setReceiveOpen] = useState(false);

    // Mobile: fixed to the viewport bottom (full-width bar across the screen).
    // Desktop: sticky to the bottom of the 520px content column — the page
    // is the direct scroll child of MultichainDesktopShell's column, so
    // `sticky bottom-0` pins it to the bottom of the column's scroll
    // viewport without leaking under the sidebar. `mt-auto` keeps it at
    // the column's bottom when the page content is shorter than the column.
    const position = compact ? 'sticky bottom-0 mt-auto' : 'fixed inset-x-0 bottom-0';
    return (
        <div className={`${position} z-10 bg-backgroundTransparent backdrop-blur`}>
            <div className="flex w-full items-center gap-3 px-6 py-4">
                <button
                    type="button"
                    className="flex h-14 flex-1 items-center justify-center rounded-medium bg-buttonPrimaryBackground px-6 text-label1 text-buttonPrimaryForeground"
                >
                    {t('wallet_buy')}
                </button>
                {hasBalance && (
                    <button
                        type="button"
                        className="flex h-14 flex-1 items-center justify-center rounded-medium bg-buttonPrimaryBackground px-6 text-label1 text-buttonPrimaryForeground"
                    >
                        {t('wallet_sell')}
                    </button>
                )}
                <div className="relative">
                    {menuOpen && (
                        <button
                            type="button"
                            aria-label="Close menu"
                            tabIndex={-1}
                            onClick={() => setMenuOpen(false)}
                            className="fixed inset-0 z-40 cursor-default"
                        />
                    )}
                    {menuOpen && (
                        <div className="absolute bottom-full right-0 z-50 mb-2 w-[200px] overflow-hidden rounded-medium bg-backgroundContent shadow-2xl">
                            <button
                                type="button"
                                onClick={() => {
                                    setMenuOpen(false);
                                    setSendOpen(true);
                                }}
                                className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left transition-colors hover:bg-backgroundContentTint"
                            >
                                <span className="text-label1 text-textPrimary">
                                    {t('wallet_send')}
                                </span>
                                <span className="text-textAccent">
                                    <SendIcon />
                                </span>
                            </button>
                            <div className="mx-4 h-px bg-separatorCommon" />
                            <button
                                type="button"
                                onClick={() => {
                                    setMenuOpen(false);
                                    setReceiveOpen(true);
                                }}
                                className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left transition-colors hover:bg-backgroundContentTint"
                            >
                                <span className="text-label1 text-textPrimary">
                                    {t('wallet_receive')}
                                </span>
                                <span className="text-textAccent">
                                    <ReceiveIcon />
                                </span>
                            </button>
                        </div>
                    )}
                    <button
                        type="button"
                        aria-label={t('wallet_asset_more_actions')}
                        aria-haspopup="menu"
                        aria-expanded={menuOpen}
                        onClick={() => setMenuOpen(v => !v)}
                        className="flex h-14 w-14 items-center justify-center rounded-full bg-buttonTertiaryBackground text-buttonTertiaryForeground"
                    >
                        <Ellipsis28 />
                    </button>
                </div>
            </div>
            <div className="h-[21px]" />

            {/* Mounted only once opened — keeps the action bar (and its
                isolated component test) free of the send flow's data hooks
                until the user actually picks Send/Receive. */}
            {sendOpen && (
                <MultichainSendFlow
                    isOpen
                    onClose={() => setSendOpen(false)}
                    initialAsset={asset}
                />
            )}
            {receiveOpen && <MultichainReceiveSheet isOpen onClose={() => setReceiveOpen(false)} />}
        </div>
    );
};
