import { FC, ReactNode } from 'react';

import { AccountMultichain } from '@tonkeeper/core/dist/entries/account';

import { MultichainDesktopSidebar } from './MultichainDesktopSidebar';

/**
 * Desktop layout for multichain accounts.
 *
 * Window: 24px padding on all sides.
 * Sidebar: fixed-width column on the left, full height of the window
 * container (height stretches to the window).
 * Content: flex-centered 520px column with 24px vertical padding (the
 * outer 24px already accounts for that, so the column simply lives
 * inside the flex track and renders its own scroll area).
 *
 * Mobile is unchanged — `AppMobile.tsx` keeps rendering pages without
 * any shell. Only AppDesktop swaps in this layout for multichain
 * accounts.
 */
export const MultichainDesktopShell: FC<{
    account: AccountMultichain;
    children: ReactNode;
}> = ({ account, children }) => {
    return (
        <div className="flex h-screen gap-6 overflow-hidden bg-backgroundPage p-6">
            <MultichainDesktopSidebar account={account} />
            <main className="flex flex-1 justify-center">
                <div className="flex h-full w-full max-w-[520px] flex-col overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {children}
                </div>
            </main>
        </div>
    );
};
