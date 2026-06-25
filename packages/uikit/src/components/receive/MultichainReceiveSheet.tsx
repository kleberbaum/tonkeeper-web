import { FC, useState } from 'react';
import { Modal, useSetModalOnBack } from '../../primitives/Modal';
import { useTranslation } from '../../hooks/translation';
import { ReceiveChainList } from './ReceiveChainList';
import { ReceiveChainAddress } from './ReceiveChainAddress';
import { ReceiveChain } from './receiveChains';

export interface MultichainReceiveSheetProps {
    isOpen: boolean;
    onClose: () => void;
}

interface Selection {
    chain: ReceiveChain;
    address: string;
}

/**
 * Content-only receive body — chain list, then per-chain QR. Renders its
 * own heading inline so it can be embedded in a shared Modal alongside
 * other steps (e.g. `AddFundsContent`) without forcing the parent to
 * track the list-vs-address sub-state.
 */
export const MultichainReceiveBody: FC = () => {
    const { t } = useTranslation();
    const [selection, setSelection] = useState<Selection | undefined>();

    useSetModalOnBack(selection ? () => setSelection(undefined) : undefined);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-1 text-center">
                <h2 className="text-h2 text-textPrimary">
                    {selection
                        ? t('receive_chain_title', { chain: selection.chain.displayName })
                        : t('receive_title')}
                </h2>
                {!selection && (
                    <p className="text-body1 text-textSecondary">{t('receive_subtitle')}</p>
                )}
            </div>
            {selection ? (
                <ReceiveChainAddress chain={selection.chain} address={selection.address} />
            ) : (
                <ReceiveChainList onSelect={(chain, address) => setSelection({ chain, address })} />
            )}
        </div>
    );
};

export const MultichainReceiveSheet: FC<MultichainReceiveSheetProps> = ({ isOpen, onClose }) => (
    <Modal isOpen={isOpen} onClose={onClose}>
        {isOpen && <MultichainReceiveBody />}
    </Modal>
);
