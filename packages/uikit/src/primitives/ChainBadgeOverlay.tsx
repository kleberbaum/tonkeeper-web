import { FC, ReactNode } from 'react';
import { cn } from '../libs/css';

export interface ChainBadgeOverlayProps {
    /**
     * Chain badge icon, typically one of the `IcChain*20` components in
     * `icons/components/`. Omit for native coin rows — no badge renders.
     */
    icon?: ReactNode;
    /** The token icon to wrap. */
    children: ReactNode;
    className?: string;
}

/**
 * Wraps a token icon and overlays a small chain badge at the bottom-right.
 * Used on the multichain portfolio row to disambiguate same-symbol tokens
 * across chains (e.g. ETH-on-Ethereum vs ETH-on-Base).
 *
 * Chain icons are local components — `wallet.tonkeeper.com` is this
 * project's own production CDN, not a third-party config source, so the
 * badge always ships from the bundle rather than over the network.
 */
export const ChainBadgeOverlay: FC<ChainBadgeOverlayProps> = ({ icon, children, className }) => (
    <div className={cn('relative inline-block', className)}>
        {children}
        {icon && (
            <div className="absolute -bottom-0.5 -right-0.5 h-5 w-5 overflow-hidden rounded-full ring-2 ring-backgroundPage [&>svg]:h-5 [&>svg]:w-5">
                {icon}
            </div>
        )}
    </div>
);
