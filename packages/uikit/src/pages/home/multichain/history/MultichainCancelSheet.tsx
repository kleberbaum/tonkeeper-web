import { FC } from 'react';

import { Button } from '../../../../primitives';
import { Modal, ModalFooter, ModalFooterPortal } from '../../../../primitives/Modal';
import { useTranslation } from '../../../../hooks/translation';

/**
 * "Cancel transaction?" confirmation for a pending transfer. Cancelling
 * on-chain means broadcasting a replacement transaction, which chain-kit
 * does not expose — so `onConfirm` execution is a deferred follow-up; the
 * sheet itself is built to the mockup.
 */
export const MultichainCancelSheet: FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}> = ({ isOpen, onClose, onConfirm }) => {
    const { t } = useTranslation();
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            heading={t('multichain_history_cancel_title')}
            subheading={t('multichain_history_cancel_body')}
        >
            <ModalFooterPortal>
                <ModalFooter>
                    <Button variant="destructive" size="large" fullWidth onClick={onConfirm}>
                        {t('multichain_history_cancel_confirm')}
                    </Button>
                    <Button variant="secondary" size="small" fullWidth onClick={onClose}>
                        {t('multichain_history_cancel_back')}
                    </Button>
                </ModalFooter>
            </ModalFooterPortal>
        </Modal>
    );
};
