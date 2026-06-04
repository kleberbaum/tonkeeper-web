import { lazy, ReactElement, Suspense, useCallback, useEffect, useMemo, useState } from 'react';

import { AddWalletContext } from '../create/AddWalletContext';
import { AddWalletPicker, AddWalletPickerMode } from '../create/AddWalletPicker';
import { createModalControl } from './createModalControl';
import { useAppSdk } from '../../hooks/appSdk';
import { useAtom } from '../../libs/useAtom';
import { useProFeaturesNotification } from './ProFeaturesNotificationControlled';
import { useProState } from '../../state/pro';
import { useSecurityCheck } from '../../state/password';
import { useTranslation } from '../../hooks/translation';

import { AddWalletMethod } from '@tonkeeper/core/dist/entries/wallet';
import { isValidSubscription } from '@tonkeeper/core/dist/entries/pro';

import { Loader } from '../../primitives/Loader';
import { Modal } from '../../primitives/Modal';

/**
 * The "Add wallet" flow modal — owns the picker plus every per-method
 * onboarding screen (create / MAM / import / watch-only / signer /
 * keystone / ledger / SK-fireblocks / multisig / testnet). Opened
 * imperatively via `useAddWalletFlow` from every "+ add wallet" entry
 * point in the app (header, sidebar, start screen, settings, etc).
 *
 * Per-method screens are code-split via `React.lazy`, so the initial
 * bundle ships only the picker. Clicking a method fetches that
 * method's chunk on demand — keeping the Ledger USB transport, the
 * multisig contract encoder, the Fireblocks SDK, BIP39 wordlists, and
 * other heavy onboarding deps off the cold-start path.
 */

// ─── Per-method screens (lazy) ─────────────────────────────────────

const CreateStandardWallet = lazy(() =>
    import('../../pages/import/CreateStandardWallet').then(m => ({
        default: m.CreateStandardWallet
    }))
);
const CreateMAMWallet = lazy(() =>
    import('../../pages/import/CreateMAMWallet').then(m => ({ default: m.CreateMAMWallet }))
);
const ImportExistingWallet = lazy(() =>
    import('../../pages/import/ImportExistingWallet').then(m => ({
        default: m.ImportExistingWallet
    }))
);
const ImportTestnetWallet = lazy(() =>
    import('../../pages/import/ImportTestnetWallet').then(m => ({
        default: m.ImportTestnetWallet
    }))
);
const CreateWatchOnlyWallet = lazy(() =>
    import('../../pages/import/CreateWatchOnlyWallet').then(m => ({
        default: m.CreateWatchOnlyWallet
    }))
);
const CreateSignerWallet = lazy(() =>
    import('../../pages/import/CreateSignerWallet').then(m => ({ default: m.CreateSignerWallet }))
);
const CreateKeystoneWallet = lazy(() =>
    import('../../pages/import/CreateKeystoneWallet').then(m => ({
        default: m.CreateKeystoneWallet
    }))
);
const CreateLedgerWallet = lazy(() =>
    import('../../pages/import/CreateLedgerWallet').then(m => ({ default: m.CreateLedgerWallet }))
);
const CreateMultisig = lazy(() =>
    import('../create/Multisig').then(m => ({ default: m.CreateMultisig }))
);
const ImportBySKWallet = lazy(() =>
    import('../../pages/import/ImportBySKWallet').then(m => ({ default: m.ImportBySKWallet }))
);

/**
 * Map of `AddWalletMethod` → renderer. Each renderer takes a single
 * `completed` callback and returns the per-method screen. Inlining
 * the JSX here smooths over each component's slightly different
 * prop shape (most take `afterCompleted`; multisig takes `onClose`;
 * sk-fireblocks needs a `signingAlgorithm` literal) without forcing
 * every screen to grow an adapter.
 *
 * The `Record<AddWalletMethod, …>` type also serves as the
 * exhaustiveness check the old `switch` used `assertUnreachable` for —
 * adding a new method to the union forces an entry here.
 */
const renderMethod: Record<AddWalletMethod, (completed: () => void) => ReactElement> = {
    'create-standard': cb => <CreateStandardWallet afterCompleted={cb} />,
    'create-mam': cb => <CreateMAMWallet afterCompleted={cb} />,
    import: cb => <ImportExistingWallet afterCompleted={cb} />,
    testnet: cb => <ImportTestnetWallet afterCompleted={cb} />,
    'watch-only': cb => <CreateWatchOnlyWallet afterCompleted={cb} />,
    signer: cb => <CreateSignerWallet afterCompleted={cb} />,
    keystone: cb => <CreateKeystoneWallet afterCompleted={cb} />,
    ledger: cb => <CreateLedgerWallet afterCompleted={cb} />,
    multisig: cb => <CreateMultisig onClose={cb} />,
    sk_fireblocks: cb => <ImportBySKWallet signingAlgorithm="fireblocks" afterCompleted={cb} />
};

// ─── Open params & modal control ──────────────────────────────────

type OpenParams = {
    walletType?: AddWalletMethod;
    /**
     * `'import'` narrows the picker to import-shaped entries — used
     * from the onboarding start screen, which has a separate primary
     * action for the create flow. Defaults to `'all'`.
     */
    pickerMode?: AddWalletPickerMode;
};

const { hook, paramsControl } = createModalControl<OpenParams | undefined>();

const requiresPro = (m: AddWalletMethod): boolean => m === 'multisig' || m === 'sk_fireblocks';

// ─── Public hook ──────────────────────────────────────────────────

/**
 * Imperative open / close handle for the Add Wallet modal. When
 * `walletType` is preselected, the hook runs a security check first
 * (password / mnemonic confirm) so the modal can skip its own auth
 * gate. `skipSecurityCheck` bypasses that — used by the extension's
 * new-tab auto-mount path, where the popup already verified the user
 * before spawning a fresh tab.
 */
export const useAddWalletFlow = () => {
    const { mutateAsync: securityCheck } = useSecurityCheck();
    const { onOpen: openModal, ...rest } = hook();

    const onOpen = useCallback(
        async (params?: OpenParams & { skipSecurityCheck?: boolean }) => {
            try {
                if (params?.walletType && !params.skipSecurityCheck) {
                    await securityCheck();
                }
                openModal(params);
            } catch (e) {
                console.error(e);
            }
        },
        [securityCheck, openModal]
    );

    return { ...rest, onOpen };
};

// ─── Modal component ──────────────────────────────────────────────

export const AddWalletFlow = () => {
    const sdk = useAppSdk();
    const { t } = useTranslation();
    const { isOpen, onClose, onOpen } = useAddWalletFlow();
    const [params] = useAtom(paramsControl);

    const { onOpen: openBuyPro } = useProFeaturesNotification();
    const { data: subscription } = useProState();
    const hasValidPro = isValidSubscription(subscription);

    const [selectedMethod, setSelectedMethod] = useState<AddWalletMethod | undefined>(
        params?.walletType
    );

    // Extension new-tab auto-mount: when the popup spawned a fresh
    // tab with `?add_wallet=:method`, the SDK exposes that method
    // here. Auto-open the modal and skip the security check — the
    // popup already authenticated the user before opening the tab.
    useEffect(() => {
        const autoMount = sdk.addWalletPage?.getAutoMountMethod();
        if (autoMount) {
            onOpen({ walletType: autoMount, skipSecurityCheck: true });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Sync selectedMethod with the latest open params, and bounce
    // pro-gated entries to Buy Pro when the user has no subscription.
    useEffect(() => {
        if (!isOpen) return;
        const wallet = params?.walletType;
        if (wallet && requiresPro(wallet) && !hasValidPro) {
            onClose();
            openBuyPro();
            return;
        }
        if (wallet) {
            sdk.addWalletPage?.open(wallet);
        }
        setSelectedMethod(wallet);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, params?.walletType]);

    const handleClose = useCallback(() => {
        sdk.addWalletPage?.close();
        onClose();
    }, [onClose, sdk]);

    const handlePickMethod = useCallback(
        (method: AddWalletMethod) => {
            if (requiresPro(method) && !hasValidPro) {
                onClose();
                openBuyPro();
                return;
            }
            sdk.addWalletPage?.open(method);
            setSelectedMethod(method);
        },
        [hasValidPro, openBuyPro, onClose, sdk]
    );

    const pickerMode = params?.pickerMode ?? 'all';
    const isPicker = !selectedMethod;

    // Sub-screens call AddWalletContext.navigateHome to return to
    // the picker. When the modal was opened with a preselected
    // walletType there's no picker to go back to — leave it undefined
    // so the back-to-picker affordance is hidden.
    const navigateHome = useMemo(
        () => (params?.walletType ? undefined : () => setSelectedMethod(undefined)),
        [params?.walletType]
    );

    return (
        <AddWalletContext.Provider value={{ navigateHome }}>
            <Modal
                isOpen={isOpen}
                onClose={handleClose}
                mobileFullScreen
                disableHeightAnimation
                tall={!isPicker}
                tag={`add-wallet-${selectedMethod}`}
                afterClose={() => setSelectedMethod(undefined)}
                heading={isPicker ? t(headingKey(pickerMode)) : undefined}
                subheading={isPicker ? t(subheadingKey(pickerMode)) : undefined}
            >
                {isPicker ? (
                    <AddWalletPicker mode={pickerMode} onSelect={handlePickMethod} />
                ) : (
                    <Suspense fallback={<MethodLoadingFallback />}>
                        {renderMethod[selectedMethod](handleClose)}
                    </Suspense>
                )}
            </Modal>
        </AddWalletContext.Provider>
    );
};

// ─── Locals ───────────────────────────────────────────────────────

const headingKey = (mode: AddWalletPickerMode) =>
    mode === 'import' ? 'import_existing_wallet' : 'import_add_wallet';

const subheadingKey = (mode: AddWalletPickerMode) =>
    mode === 'import' ? 'import_wallet_picker_subtitle' : 'import_add_wallet_description';

const MethodLoadingFallback = () => (
    <div className="flex min-h-[280px] items-center justify-center">
        <Loader size="medium" />
    </div>
);
