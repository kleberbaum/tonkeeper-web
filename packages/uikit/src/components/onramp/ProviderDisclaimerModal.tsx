import { FC } from 'react';
import { Button } from '../../primitives/Button';
import { Modal, ModalFooter, ModalFooterPortal } from '../../primitives/Modal';
import { tReplace, useTranslation } from '../../hooks/translation';

export interface ProviderDisclaimerModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** Called when the user accepts and wants to open the provider URL. */
    onConfirm: () => void;
    /** Provider name (e.g. "Mercuryo"). */
    providerName: string;
    /** Loading state while `createOnrampOrder` is in flight. */
    isLoading?: boolean;
}

/**
 * Final confirmation before the on-ramp flow opens the provider's external
 * widget. Tonkeeper is not party to the transaction — the disclaimer makes
 * that explicit.
 */
export const ProviderDisclaimerModal: FC<ProviderDisclaimerModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    providerName,
    isLoading
}) => {
    const { t } = useTranslation();
    const body = tReplace(t('onramp_disclaimer_body'), { provider: providerName });
    return (
        <Modal isOpen={isOpen} onClose={onClose} hideCloseButton={isLoading}>
            <div className="flex flex-col items-center gap-4 pb-2 text-center">
                {/* TODO: per-merchant logo from ExchangeMerchantInfo.image
                    when useExchangeMerchants lookup is wired. */}
                {!isLoading && <div className="h-16 w-16 rounded-large bg-backgroundContentTint" />}
                <h2 className="text-h2 text-textPrimary capitalize">{providerName}</h2>
                <p className="max-w-xs text-body2 text-textSecondary">{body}</p>
            </div>
            <ModalFooterPortal>
                <ModalFooter>
                    <Button variant="primaryBlue" onClick={onConfirm} disabled={isLoading}>
                        {t('onramp_disclaimer_open')}
                    </Button>
                </ModalFooter>
            </ModalFooterPortal>
        </Modal>
    );
};
