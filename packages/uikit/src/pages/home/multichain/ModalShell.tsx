import { FC, ReactNode } from 'react';

/**
 * Sheet/modal container shared by the multichain Crypto catalog and
 * Manage Crypto views.
 *
 * Mobile (`compact = false`): the modal covers the whole viewport
 * (`fixed inset-0`), no border-radius — full-bleed sheet.
 *
 * Desktop (`compact = true`): the modal is constrained to the same
 * 520px content column as the home portfolio. Geometry mirrors
 * `MultichainDesktopShell`:
 *   - 24px window padding (top/bottom/right)
 *   - sidebar `w-[280px]` + 24px gap → column area starts at 328px
 *   - column itself centered, `max-w-[520px]`
 * Rounded 24px corners and a dark fill match the mockup.
 *
 * The numeric `left-[328px]` matches the sidebar+padding+gap math in
 * `MultichainDesktopShell.tsx`. Keep them in sync if either changes.
 */
export const ModalShell: FC<{ compact?: boolean; children: ReactNode }> = ({
    compact = false,
    children
}) => {
    if (compact) {
        return (
            <div className="fixed inset-y-6 left-[328px] right-6 z-50 flex justify-center">
                <div className="relative flex h-full w-full max-w-[520px] flex-col overflow-hidden rounded-3xl bg-backgroundPage">
                    {children}
                </div>
            </div>
        );
    }
    return <div className="fixed inset-0 z-50 flex flex-col bg-backgroundPage">{children}</div>;
};
