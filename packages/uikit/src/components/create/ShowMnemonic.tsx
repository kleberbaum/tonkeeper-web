import { FC, useEffect } from 'react';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { CenterContainer } from '../Layout';
import { ButtonResponsiveSize } from '../fields/Button';
import { NotificationFooter, NotificationFooterPortal } from '../Notification';
import { MnemonicDisplay } from './MnemonicDisplay';

/**
 * Create-flow screen that shows a freshly generated mnemonic + a
 * "Continue" footer button. The user copies / writes down the phrase
 * here, then the create flow advances to the `CheckMnemonic` step which
 * verifies they recorded it correctly.
 *
 * `showMamInfo` switches `MnemonicDisplay` into the MAM variant so the
 * MAM-account explanation callout appears above the grid.
 */
export const ShowMnemonic: FC<{
    mnemonic: string[];
    onCheck: () => void;
    showMamInfo?: boolean;
}> = ({ mnemonic, onCheck, showMamInfo }) => {
    const sdk = useAppSdk();
    const { t } = useTranslation();

    useEffect(() => {
        if (sdk.twaExpand) {
            sdk.twaExpand();
        }
    }, []);

    return (
        <CenterContainer>
            <MnemonicDisplay mnemonic={mnemonic} type={showMamInfo ? 'mam' : 'standard'} />

            <NotificationFooterPortal>
                <NotificationFooter>
                    <ButtonResponsiveSize fullWidth primary marginTop onClick={onCheck}>
                        {t('continue')}
                    </ButtonResponsiveSize>
                </NotificationFooter>
            </NotificationFooterPortal>
        </CenterContainer>
    );
};
