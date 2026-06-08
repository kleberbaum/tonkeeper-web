import { FC, FormEvent, useState } from 'react';

import { passwordStorage, validatePassword } from '@tonkeeper/core/dist/service/passwordService';

import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { useIsPasswordSet } from '../../state/wallet';
import { Button } from '../../primitives/Button';
import { Input } from '../../primitives/Input';

/**
 * Inline wizard step that collects the app password before the create
 * flow shows any secret material. Two render branches share the layout:
 *
 *   - first wallet on this device (`useIsPasswordSet() === false`) →
 *     create a new password (set + confirm, validated locally)
 *   - existing wallet on this device (`useIsPasswordSet() === true`) →
 *     enter the existing password (validated against `passwordStorage`)
 *
 * Collecting the password up front (rather than via
 * `getPasswordByNotification` inside the create-account mutation) lets
 * the caller pass the captured password straight into the mutation,
 * skipping the global UnlockNotification round-trip.
 *
 * Platforms with `sdk.keychain` (desktop, mobile) don't need a password
 * at all — secrets land in the OS keychain. The caller is expected to
 * skip mounting this step on those platforms.
 */
export const PasswordStep: FC<{ onSubmit: (password: string) => void }> = ({ onSubmit }) => {
    const isPasswordSet = useIsPasswordSet();
    return isPasswordSet ? <UnlockForm onSubmit={onSubmit} /> : <CreateForm onSubmit={onSubmit} />;
};

const CreateForm: FC<{ onSubmit: (password: string) => void }> = ({ onSubmit }) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    // `'password'` = entered password fails `validatePassword`, `'confirm'` =
    // confirmation doesn't match. Cleared on any keystroke.
    const [error, setError] = useState<'password' | 'confirm'>();

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!validatePassword(password)) {
            sdk.hapticNotification('error');
            setError('password');
            return;
        }
        if (password !== confirm) {
            sdk.hapticNotification('error');
            setError('confirm');
            return;
        }
        onSubmit(password);
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="mx-auto flex w-full max-w-[524px] flex-col items-center gap-4 text-center"
        >
            <div className="flex flex-col gap-1 px-8 pb-2">
                <h2 className="text-h2 text-textPrimary">{t('Create_password')}</h2>
                <p className="text-balance text-body1 text-textSecondary">{t('MinPassword')}</p>
            </div>
            <Input
                id="create-password"
                type="password"
                label={t('Password')}
                value={password}
                autoFocus
                isValid={error !== 'password'}
                helpText={error === 'password' ? t('MinPassword') : undefined}
                onChange={value => {
                    setError(undefined);
                    setPassword(value);
                }}
            />
            <Input
                id="create-password-confirm"
                type="password"
                label={t('ConfirmPassword')}
                value={confirm}
                isValid={error !== 'confirm'}
                helpText={error === 'confirm' ? t('PasswordDoNotMatch') : undefined}
                onChange={value => {
                    setError(undefined);
                    setConfirm(value);
                }}
            />
            <Button
                type="submit"
                variant="primaryBlue"
                size="large"
                fullWidth
                disabled={!password || !confirm}
            >
                {t('continue')}
            </Button>
        </form>
    );
};

const UnlockForm: FC<{ onSubmit: (password: string) => void }> = ({ onSubmit }) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const [password, setPassword] = useState('');
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!validatePassword(password)) return;
        setIsLoading(true);
        const valid = await passwordStorage(sdk.storage).isPasswordValid(password);
        setIsLoading(false);
        if (!valid) {
            sdk.hapticNotification('error');
            setIsError(true);
            return;
        }
        onSubmit(password);
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="mx-auto flex w-full max-w-[524px] flex-col items-center gap-4 text-center"
        >
            <div className="flex flex-col gap-1 px-8 pb-2">
                <h2 className="text-h2 text-textPrimary">{t('enter_password')}</h2>
            </div>
            <Input
                id="unlock-password"
                type="password"
                label={t('Password')}
                value={password}
                autoFocus
                disabled={isLoading}
                isValid={!isError}
                onChange={value => {
                    setIsError(false);
                    setPassword(value);
                }}
            />
            <Button
                type="submit"
                variant="primaryBlue"
                size="large"
                fullWidth
                loading={isLoading}
                disabled={!validatePassword(password)}
            >
                {t('confirm')}
            </Button>
        </form>
    );
};
