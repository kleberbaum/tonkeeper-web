import { FC } from 'react';
import { useTranslation } from '../../hooks/translation';
import { H2Label2Responsive } from '../Text';
import { ButtonResponsiveSize } from '../fields/Button';
import { ModalFooter, ModalFooterPortal } from '../../primitives/Modal';

/**
 * Which seed shape the imported phrase should be interpreted as.
 * `tonKeychain` is a MAM-style HD seed (TonKeychainRoot); `tonMnemonic`
 * is the legacy 24-word TON-only mnemonic; `bip39` is a standard BIP39
 * phrase (the multichain-eligible shape).
 */
export type ImportMnemonicType = 'tonKeychain' | 'tonMnemonic' | 'bip39';

/**
 * Prompt the user to pick which seed shape to import as, when the
 * entered phrase is valid for more than one (e.g. a 12-word BIP39 that's
 * also valid against the legacy TON 12-word path). Single-option cases
 * skip this step entirely in the caller.
 */
export const SelectMnemonicType: FC<{
    availableTypes: ImportMnemonicType[];
    onSelect: (type: ImportMnemonicType) => void;
    isLoading?: boolean;
}> = ({ availableTypes, onSelect, isLoading }) => {
    const { t } = useTranslation();

    return (
        <>
            <div className="mb-4 flex flex-col gap-4 text-center">
                <H2Label2Responsive>{t('import_chose_mnemonic_type_title')}</H2Label2Responsive>
                <p className="mx-auto block max-w-[450px] text-balance text-body1 text-textSecondary">
                    {t('import_chose_mnemonic_type_description')}
                </p>
            </div>
            <ModalFooterPortal>
                <ModalFooter>
                    {isLoading ? (
                        <ButtonResponsiveSize fullWidth secondary loading />
                    ) : (
                        availableTypes.map(type => (
                            <ButtonResponsiveSize
                                key={type}
                                fullWidth
                                secondary
                                onClick={() => onSelect(type)}
                            >
                                {t(`import_chose_mnemonic_option_${type}`)}
                            </ButtonResponsiveSize>
                        ))
                    )}
                </ModalFooter>
            </ModalFooterPortal>
        </>
    );
};
