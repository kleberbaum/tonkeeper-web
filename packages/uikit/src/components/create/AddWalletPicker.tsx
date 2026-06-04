import { FC, ReactNode } from 'react';
import { isAccountCanManageMultisigs } from '@tonkeeper/core/dist/entries/account';
import { AddWalletMethod } from '@tonkeeper/core/src/entries/wallet';
import { useAppContext } from '../../hooks/appContext';
import { useTranslation } from '../../hooks/translation';
import { useAccountsState, useActiveAccountQuery, useActiveConfig } from '../../state/wallet';
import { useSecurityCheck } from '../../state/password';
import { Badge } from '../shared';
import { ChevronRightIcon } from '../Icon';
import { cn } from '../../libs/css';
import {
    WalletFireblocksIcon,
    WalletImportIcon,
    WalletKeystoneIcon,
    WalletLedgerIcon,
    WalletMagnifyingGlassIcon,
    WalletPencilIcon,
    WalletPlusIcon,
    WalletSignerIcon,
    WalletTestnetIcon
} from './WalletIcons';

/**
 * Picker for the "Add wallet" / "Import wallet" sheet (Figma 579:50871).
 *
 * Two `mode`s share one component:
 *   - `'all'`  — everything the user can add (create / import / hardware /
 *                other). Used from the in-app entry points where existing
 *                users add another wallet.
 *   - `'import'` — only import-shaped entries (existing seed, hardware
 *                  pairings, watch-only, testnet). Used by the onboarding
 *                  start screen, where the multichain create flow lives
 *                  behind a separate primary action.
 *
 * The Figma redesign uses one card per method with title + description +
 * chevron; cards are grouped by purpose with an "Other options" divider.
 *
 * ## Multichain mode
 *
 * `multichainEnabled` toggles the **outcome** of the create-standard
 * entry — same picker, same route, but the create flow lands an
 * `AccountMultichain` instead of `AccountTonMnemonic`. Picker entries
 * that aren't wired for multichain yet (MAM / hardware / watch-only /
 * multisig / fireblocks / testnet) stay visible-but-disabled when the
 * flag is on, so users see what's coming without being able to click
 * into a flow that hasn't been wired up. Import stays enabled always —
 * its mnemonic-shape detection routes BIP39 to multichain internally.
 */

export type AddWalletPickerMode = 'all' | 'import';

interface AddWalletEntryProps {
    icon: ReactNode;
    title: ReactNode;
    description: ReactNode;
    badge?: ReactNode;
    disabled?: boolean;
    onClick: () => void;
}

const AddWalletEntry: FC<AddWalletEntryProps> = ({
    icon,
    title,
    description,
    badge,
    disabled,
    onClick
}) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={cn(
            'flex w-full items-center gap-3 overflow-hidden rounded-medium border-0 bg-backgroundContent px-4 py-3.5 text-left transition-colors',
            disabled
                ? 'cursor-not-allowed opacity-40'
                : 'cursor-pointer hover:bg-backgroundHighlighted active:bg-backgroundHighlighted'
        )}
    >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center text-accentBlue">
            {icon}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
            <span className="flex items-center gap-2 text-label1 text-textPrimary">
                {title}
                {badge}
            </span>
            <span className="text-body2 text-textSecondary">{description}</span>
        </span>
        <ChevronRightIcon className="shrink-0 text-iconTertiary" />
    </button>
);

const SectionDivider: FC<{ children: ReactNode }> = ({ children }) => (
    <p className="py-3 text-center text-body1 text-textSecondary">{children}</p>
);

export const AddWalletPicker: FC<{
    onSelect: (path: AddWalletMethod) => void;
    mode?: AddWalletPickerMode;
}> = ({ onSelect: onSelectProp, mode = 'all' }) => {
    const { t } = useTranslation();
    const {
        hideMam,
        hideSigner,
        hideLedger,
        hideKeystone,
        hideMultisig,
        hideFireblocks,
        multichainEnabled
    } = useAppContext();
    const signerDisabled = useActiveConfig().flags.disable_signer;

    const accounts = useAccountsState();
    const { data: activeAccount } = useActiveAccountQuery();

    const canHaveProSubscription = accounts.some(
        acc => acc.type === 'mnemonic' || acc.type === 'mam'
    );
    const canAddMultisig =
        accounts.some(acc => isAccountCanManageMultisigs(acc)) &&
        activeAccount?.type !== 'testnet' &&
        canHaveProSubscription;
    const { mutateAsync: securityCheck } = useSecurityCheck();

    const onSelect = async (method: AddWalletMethod) => {
        try {
            await securityCheck();
            onSelectProp(method);
        } catch (e) {
            console.error(e);
        }
    };

    // `create-standard` is wired for both modes — its inner flow branches
    // on `multichainEnabled` to either generate a BIP39 multichain account
    // or the legacy TON-only one. Other create / hardware / watch-only
    // entries aren't wired for multichain yet; they stay
    // visible-but-disabled when the flag is on so users see what's coming.
    const disableNonImport = multichainEnabled;

    // Cells the user sees first — actively creating or importing a wallet.
    // The Figma's "Import wallet" sheet shows only the import-shaped entries
    // (existing seed + hardware); the in-app "Add wallet" sheet additionally
    // shows the create-* / multisig options at the top of this section.
    const primarySection: ReactNode[] = [];

    if (mode === 'all') {
        primarySection.push(
            <AddWalletEntry
                key="create-standard"
                icon={<WalletPlusIcon />}
                title={t('import_new_wallet')}
                description={t('import_new_wallet_description')}
                onClick={() => onSelect('create-standard')}
            />
        );
        if (!hideMam) {
            primarySection.push(
                <AddWalletEntry
                    key="create-mam"
                    icon={<WalletPlusIcon />}
                    title={t('add_wallet_modal_mam_title')}
                    description={t('add_wallet_modal_mam_subtitle')}
                    badge={<Badge color="accentOrange">Beta</Badge>}
                    disabled={disableNonImport}
                    onClick={() => onSelect('create-mam')}
                />
            );
        }
    }

    primarySection.push(
        <AddWalletEntry
            key="import"
            icon={<WalletImportIcon />}
            title={t('import_existing_wallet')}
            description={t('import_existing_wallet_description_extended')}
            onClick={() => onSelect('import')}
        />
    );

    if (mode === 'all' && canAddMultisig && !hideMultisig) {
        primarySection.push(
            <AddWalletEntry
                key="multisig"
                icon={<WalletPencilIcon />}
                title={t('add_wallet_new_multisig_title')}
                description={t('add_wallet_new_multisig_description')}
                badge={<Badge color="accentBlue">PRO</Badge>}
                disabled={disableNonImport}
                onClick={() => onSelect('multisig')}
            />
        );
    }

    // Hardware-wallet pairings. The Figma sheet treats these as part of the
    // primary list (no "Hardware Wallets" header); only the `'all'` mode
    // surfaces the header for parity with the previous in-app design.
    const hardwareSection: ReactNode[] = [];
    if (!hideSigner && !signerDisabled) {
        hardwareSection.push(
            <AddWalletEntry
                key="signer"
                icon={<WalletSignerIcon />}
                title={t('import_signer')}
                description={t('import_signer_description')}
                disabled={disableNonImport}
                onClick={() => onSelect('signer')}
            />
        );
    }
    if (!hideKeystone) {
        hardwareSection.push(
            <AddWalletEntry
                key="keystone"
                icon={<WalletKeystoneIcon />}
                title={t('keystone_pair_title')}
                description={t('keystone_pair_subtitle')}
                disabled={disableNonImport}
                onClick={() => onSelect('keystone')}
            />
        );
    }
    if (!hideLedger) {
        hardwareSection.push(
            <AddWalletEntry
                key="ledger"
                icon={<WalletLedgerIcon />}
                title={t('ledger_pair_title')}
                description={t('ledger_pair_subtitle')}
                disabled={disableNonImport}
                onClick={() => onSelect('ledger')}
            />
        );
    }

    const otherSection: ReactNode[] = [
        <AddWalletEntry
            key="watch-only"
            icon={<WalletMagnifyingGlassIcon />}
            title={t('add_wallet_modal_watch_only_title')}
            description={t('add_wallet_modal_watch_only_subtitle')}
            disabled={disableNonImport}
            onClick={() => onSelect('watch-only')}
        />
    ];
    if (mode === 'all' && !hideFireblocks && canHaveProSubscription) {
        otherSection.push(
            <AddWalletEntry
                key="sk_fireblocks"
                icon={<WalletFireblocksIcon />}
                title={t('add_wallet_modal_fireblocks_title')}
                description={t('add_wallet_modal_fireblocks_description')}
                badge={<Badge color="accentBlue">PRO</Badge>}
                disabled={disableNonImport}
                onClick={() => onSelect('sk_fireblocks')}
            />
        );
    }
    otherSection.push(
        <AddWalletEntry
            key="testnet"
            icon={<WalletTestnetIcon />}
            title={t('add_wallet_modal_testnet_title')}
            description={t('add_wallet_modal_testnet_subtitle')}
            disabled={disableNonImport}
            onClick={() => onSelect('testnet')}
        />
    );

    return (
        <div className="mx-auto flex w-full max-w-[460px] flex-col gap-2">
            {primarySection}
            {hardwareSection.length > 0 && mode === 'all' && (
                <SectionDivider>{t('add_wallet_group_hardware_title')}</SectionDivider>
            )}
            {hardwareSection}
            {otherSection.length > 0 && (
                <SectionDivider>{t('add_wallet_group_other_options')}</SectionDivider>
            )}
            {otherSection}
        </div>
    );
};
