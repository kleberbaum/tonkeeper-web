import UR from '@ngraveio/bc-ur/dist/ur';
import { FC, useCallback, useContext } from 'react';
import { Button } from '../../components/fields/Button';
import { useKeystoneScanner } from '../../hooks/keystoneScanner';
import { useTranslation } from '../../hooks/translation';
import { usePairKeystoneMutation } from '../../state/keystone';
import { WalletKeystoneIcon } from '../../components/create/WalletIcons';
import { AddWalletContext } from '../../components/create/AddWalletContext';
import { useSetModalOnBack } from '../../primitives/Modal';

export const CreateKeystoneWallet: FC<{ afterCompleted: () => void }> = ({ afterCompleted }) => {
    const { t } = useTranslation();

    const { mutateAsync, reset, isLoading } = usePairKeystoneMutation();
    const onSubmit = useCallback(
        async (result: UR) => {
            reset();
            await mutateAsync(result);
            afterCompleted();
        },
        [reset, mutateAsync, afterCompleted]
    );

    const openScanner = useKeystoneScanner(Date.now(), onSubmit);

    const { navigateHome } = useContext(AddWalletContext);
    useSetModalOnBack(navigateHome);

    return (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="text-accentBlue">
                <WalletKeystoneIcon size={144} />
            </div>
            <div className="mb-4">
                <h2 className="text-h2 text-textPrimary">{t('keystone_pair_title')}</h2>
                <p className="text-body2 text-textSecondary">{t('keystone_pair_subtitle')}</p>
            </div>
            <Button
                size="large"
                fullWidth
                primary
                loading={isLoading}
                marginTop
                onClick={openScanner}
            >
                {t('scan_qr_title')}
            </Button>
        </div>
    );
};
