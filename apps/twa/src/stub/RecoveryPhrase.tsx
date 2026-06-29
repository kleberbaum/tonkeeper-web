import {
    AccountId,
    AccountSecret,
    isMnemonicAndPassword
} from '@tonkeeper/core/dist/entries/account';
import { accountsStorage } from '@tonkeeper/core/dist/service/accountsStorage';
import { decryptWalletSecret } from '@tonkeeper/core/dist/service/mnemonicService';
import { validatePassword } from '@tonkeeper/core/dist/service/passwordService';
import { SpinnerRing } from '@tonkeeper/uikit/dist/components/Icon';
import { WorldNumber, WorldsGrid } from '@tonkeeper/uikit/dist/components/create/Words';
import { Body1, Body2, H2 } from '@tonkeeper/uikit/dist/components/Text';
import { Button } from '@tonkeeper/uikit/dist/components/fields/Button';
import { Input } from '@tonkeeper/uikit/dist/components/fields/Input';
import { useAppSdk } from '@tonkeeper/uikit/dist/hooks/appSdk';
import { useTranslation } from '@tonkeeper/uikit/dist/hooks/translation';
import { FC, FormEventHandler, useEffect, useState } from 'react';
import styled from 'styled-components';

const Root = styled.div`
    display: flex;
    flex-direction: column;
    min-height: var(--app-height, 100%);
    box-sizing: border-box;
    padding: 16px;
`;

const Center = styled.div`
    flex-grow: 1;
    display: flex;
    align-items: center;
    justify-content: center;
`;

const Heading = styled(H2)`
    text-align: center;
    margin: 8px 0 8px;
`;

const Caption = styled(Body2)`
    display: block;
    text-align: center;
    color: ${p => p.theme.textSecondary};
    margin-bottom: 8px;
    text-wrap: balance;
`;

const SkBox = styled.div`
    margin: 1rem 0;
    padding: 1rem;
    border-radius: 12px;
    background: ${p => p.theme.backgroundContent};
    font-family: ${p => p.theme.fontMono};
    word-break: break-all;
    color: ${p => p.theme.textPrimary};
`;

const Form = styled.form`
    display: flex;
    flex-direction: column;
    flex-grow: 1;
`;

const Bottom = styled.div`
    margin-top: auto;
    padding-top: 16px;
`;

/**
 * Decrypts and reveals the recovery phrase (or secret key) for a single
 * password-protected account.
 *
 * The password is entered through a self-contained form here rather than the
 * shared global UnlockNotification dialog: that dialog closes itself on the
 * first render after mount (its "close on navigation" effect re-runs when its
 * internal `active` flag flips), which in this router-less stub cancels the
 * request immediately ("Cancel auth request").
 *
 * Decryption happens entirely client-side via decryptWalletSecret — the secret
 * never leaves the device, and a wrong password simply fails the AES-GCM
 * decrypt. We use decryptWalletSecret directly (not getAccountSecret) to keep
 * this read-only: no v1->v2 re-encrypt write back to the deprecated app's
 * CloudStorage.
 */
export const RecoveryPhrase: FC<{ accountId: AccountId; onBack: () => void }> = ({
    accountId,
    onBack
}) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const [encryptedSecret, setEncryptedSecret] = useState<string | undefined>(undefined);
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [secret, setSecret] = useState<AccountSecret | undefined>(undefined);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const stored = await accountsStorage(sdk.storage).getAccount(accountId);
                if (!stored || !isMnemonicAndPassword(stored) || stored.auth.kind !== 'password') {
                    throw new Error('Account is not password-protected');
                }
                if (!cancelled) {
                    setEncryptedSecret(stored.auth.encryptedSecret);
                }
            } catch (e) {
                console.error(e);
                onBack();
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [accountId, sdk, onBack]);

    const onSubmit: FormEventHandler<HTMLFormElement> = async e => {
        e.preventDefault();
        if (!encryptedSecret || submitting || !validatePassword(password)) {
            return;
        }
        setSubmitting(true);
        setError(false);
        try {
            const decrypted = await decryptWalletSecret(encryptedSecret, password);
            setSecret(decrypted);
        } catch (err) {
            sdk.hapticNotification('error');
            setError(true);
        } finally {
            setSubmitting(false);
        }
    };

    // Account still loading from storage.
    if (!encryptedSecret) {
        return (
            <Center>
                <SpinnerRing />
            </Center>
        );
    }

    // Password gate.
    if (!secret) {
        return (
            <Root>
                <Heading>{t('twa_recovery_title')}</Heading>
                <Caption>{t('enter_password')}</Caption>
                <Form onSubmit={onSubmit}>
                    <Input
                        id="recovery-password"
                        type="password"
                        value={password}
                        onChange={value => {
                            setPassword(value);
                            setError(false);
                        }}
                        isValid={!error}
                        label={t('Password')}
                        disabled={submitting}
                    />
                    <Bottom>
                        <Button
                            primary
                            fullWidth
                            type="submit"
                            disabled={!validatePassword(password)}
                            loading={submitting}
                        >
                            {t('confirm')}
                        </Button>
                    </Bottom>
                </Form>
            </Root>
        );
    }

    const copyValue = secret.type === 'sk' ? secret.sk : secret.mnemonic.join(' ');

    return (
        <Root>
            <Heading>{t('twa_recovery_title')}</Heading>
            <Caption>{t('twa_recovery_subtitle')}</Caption>

            {secret.type === 'sk' ? (
                <SkBox>{secret.sk}</SkBox>
            ) : (
                <WorldsGrid wordsNumber={secret.mnemonic.length as 12 | 24}>
                    {secret.mnemonic.map((word, index) => (
                        <Body1 key={index}>
                            <WorldNumber> {index + 1}.</WorldNumber> {word}{' '}
                        </Body1>
                    ))}
                </WorldsGrid>
            )}

            <Bottom>
                <Button
                    primary
                    fullWidth
                    onClick={() => sdk.copyToClipboard(copyValue, t('copied'))}
                >
                    {t('twa_copy_phrase')}
                </Button>
            </Bottom>
        </Root>
    );
};
