import { FC, useLayoutEffect, useRef, useState } from 'react';

import { MultichainWalletAsset } from '@tonkeeper/core/dist/service/multichainWalletService';

import { SendChooseAssetScreen } from './SendChooseAssetScreen';
import { SendFormScreen } from './SendFormScreen';
import { SendConfirmScreen } from './SendConfirmScreen';
import { MultichainSendState } from './multichainSendShared';

export interface MultichainSendFlowProps {
    isOpen: boolean;
    onClose: () => void;
    /** Opens the add-funds flow from the picker's empty state. */
    onAddFunds?: () => void;
    /**
     * Start the flow on the form with this asset pre-selected (e.g. launched
     * from a token page's Send action), skipping the asset picker. The form
     * becomes the first screen (no back); the token pill can still re-open the
     * picker.
     */
    initialAsset?: MultichainWalletAsset;
}

type Step = 'choose_asset' | 'form' | 'confirm';

/**
 * Multichain send flow orchestrator: Choose asset → Send form → Confirm
 * (which owns its own Done state). Mirrors the onramp step-machine in
 * `HomeMultichainActions`: each step is its own `Modal`, gated on `step`,
 * and the parent owns the picked asset + assembled form state.
 */
export const MultichainSendFlow: FC<MultichainSendFlowProps> = ({
    isOpen,
    onClose,
    onAddFunds,
    initialAsset
}) => {
    const firstStep: Step = initialAsset ? 'form' : 'choose_asset';
    const [step, setStep] = useState<Step>(firstStep);
    const [asset, setAsset] = useState<MultichainWalletAsset | undefined>(initialAsset);
    const [sendState, setSendState] = useState<MultichainSendState | undefined>();

    // Snap back to the entry step whenever the flow opens, so a new session
    // never inherits the previous one's step/asset/confirm state. Resetting on
    // open (before paint) — rather than on a delayed timer after close — keeps
    // the last screen visible through the close animation and avoids the race
    // where reopening quickly cancels a pending reset.
    const wasOpen = useRef(isOpen);
    useLayoutEffect(() => {
        const justOpened = isOpen && !wasOpen.current;
        wasOpen.current = isOpen;
        if (!justOpened) return;
        setStep(firstStep);
        setAsset(initialAsset);
        setSendState(undefined);
    }, [isOpen, firstStep, initialAsset]);

    return (
        <>
            <SendChooseAssetScreen
                isOpen={isOpen && step === 'choose_asset'}
                onClose={onClose}
                onBack={initialAsset ? () => setStep('form') : undefined}
                onSelect={picked => {
                    setAsset(picked);
                    setStep('form');
                }}
                selectedAssetId={asset?.assetId}
                onAddFunds={onAddFunds}
            />
            {asset && (
                <SendFormScreen
                    key={asset.assetId}
                    isOpen={isOpen && step === 'form'}
                    onClose={onClose}
                    onBack={initialAsset ? undefined : () => setStep('choose_asset')}
                    asset={asset}
                    onChangeToken={() => setStep('choose_asset')}
                    onContinue={state => {
                        setSendState(state);
                        setStep('confirm');
                    }}
                    initial={
                        sendState && sendState.asset.assetId === asset.assetId
                            ? {
                                  toAddress: sendState.toAddress,
                                  amountDisplay: sendState.amountDisplay,
                                  comment: sendState.comment
                              }
                            : undefined
                    }
                />
            )}
            {sendState && (
                <SendConfirmScreen
                    isOpen={isOpen && step === 'confirm'}
                    onClose={onClose}
                    onBack={() => setStep('form')}
                    state={sendState}
                />
            )}
        </>
    );
};
