import { useQueryClient } from '@tanstack/react-query';
import { Account, AccountId } from '@tonkeeper/core/dist/entries/account';
import { accountsStorage } from '@tonkeeper/core/dist/service/accountsStorage';
import { ListBlock, ListItem, ListItemPayload } from '@tonkeeper/uikit/dist/components/List';
import { Body2, H2, Label2 } from '@tonkeeper/uikit/dist/components/Text';
import { Button } from '@tonkeeper/uikit/dist/components/fields/Button';
import { ChevronRightIcon } from '@tonkeeper/uikit/dist/components/Icon';
import { useAppSdk } from '@tonkeeper/uikit/dist/hooks/appSdk';
import { useAccountLabel } from '@tonkeeper/uikit/dist/hooks/accountUtils';
import { useTranslation } from '@tonkeeper/uikit/dist/hooks/translation';
import { QueryKey } from '@tonkeeper/uikit/dist/libs/queryKey';
import { useAccountsStateQuery } from '@tonkeeper/uikit/dist/state/wallet';
import { FC, useCallback, useState } from 'react';
import styled from 'styled-components';
import { TwaAppSdk } from '../libs/appSdk';
import { useHandleBackButton } from '../libs/twaHooks';
import { AccountActionsSheet } from './AccountActionsSheet';
import { RecoveryPhrase } from './RecoveryPhrase';
import { SignOutSheet } from './SignOutSheet';

// TODO(open item): confirm final store / web URLs before production deploy.
const APP_STORE_URL = 'https://apps.apple.com/app/tonkeeper/id1587742107';
const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=com.ton_keeper';
const WEB_APP_URL = 'https://wallet.tonkeeper.com';

const Root = styled.div`
    display: flex;
    flex-direction: column;
    min-height: var(--app-height, 100%);
    box-sizing: border-box;
    padding: 16px;
`;

const Top = styled.div`
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 24px 0;
`;

const IconWrapper = styled.div`
    color: ${p => p.theme.accentBlue};
    margin-bottom: 16px;
`;

const Title = styled(H2)`
    text-align: center;
    margin: 0;
`;

const Subtitle = styled(Body2)`
    display: block;
    text-align: center;
    color: ${p => p.theme.textSecondary};
    text-wrap: balance;
    max-width: 320px;
`;

const Accounts = styled(ListBlock)`
    width: 100%;
    margin-top: 16px;
`;

const Row = styled(ListItemPayload)`
    justify-content: space-between;
    align-items: center;
`;

const RowText = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;
    overflow: hidden;
`;

const Address = styled(Body2)`
    color: ${p => p.theme.textSecondary};
`;

const Chevron = styled(ChevronRightIcon)`
    color: ${p => p.theme.iconTertiary};
    flex-shrink: 0;
`;

const Bottom = styled.div`
    padding-top: 16px;
`;

const WarningTriangle = () => (
    <svg width="68" height="68" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
            d="M12 3.5 21 19H3L12 3.5Z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
        />
        <path d="M12 9.5v4M12 16.2v.1" stroke="#10161F" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

const AccountRow: FC<{ account: Account; onSelect: () => void }> = ({ account, onSelect }) => {
    const label = useAccountLabel(account);
    return (
        <ListItem hover={false} onClick={onSelect}>
            <Row>
                <RowText>
                    <Label2>{account.name}</Label2>
                    <Address>{label}</Address>
                </RowText>
                <Chevron />
            </Row>
        </ListItem>
    );
};

const DownloadButton: FC<{ sdk: TwaAppSdk }> = ({ sdk }) => {
    const { t } = useTranslation();
    const platform = sdk.launchParams.platform;
    const { labelKey, url } =
        platform === 'ios'
            ? { labelKey: 'twa_download_ios', url: APP_STORE_URL }
            : platform === 'android' || platform === 'android_x'
            ? { labelKey: 'twa_download_android', url: GOOGLE_PLAY_URL }
            : { labelKey: 'twa_open_web', url: WEB_APP_URL };

    return (
        <Button primary fullWidth onClick={() => sdk.openPage(url)}>
            {t(labelKey)}
        </Button>
    );
};

export const MiniAppClosed: FC<{ sdk: TwaAppSdk }> = ({ sdk }) => {
    const { t } = useTranslation();
    const client = useQueryClient();
    const { data: accounts } = useAccountsStateQuery();

    const [actionAccount, setActionAccount] = useState<Account | null>(null);
    const [signOutAccount, setSignOutAccount] = useState<Account | null>(null);
    const [recoverAccountId, setRecoverAccountId] = useState<AccountId | null>(null);

    const closeAll = useCallback(() => {
        setActionAccount(null);
        setSignOutAccount(null);
    }, []);

    const backFromRecovery = useCallback(() => setRecoverAccountId(null), []);

    const onBack = useCallback(() => {
        if (recoverAccountId) {
            setRecoverAccountId(null);
        } else if (signOutAccount) {
            setSignOutAccount(null);
        } else if (actionAccount) {
            setActionAccount(null);
        } else {
            sdk.miniApp.close();
        }
    }, [recoverAccountId, signOutAccount, actionAccount, sdk]);

    // Show Telegram's native back button only on sub-screens (recovery phrase)
    // and open sheets; on the root list let Telegram show its close control.
    const showBackButton =
        recoverAccountId !== null || actionAccount !== null || signOutAccount !== null;
    useHandleBackButton(onBack, showBackButton);

    const onSignOutConfirm = useCallback(async () => {
        if (!signOutAccount) return;
        await accountsStorage(sdk.storage).removeAccountFromState(signOutAccount.id);
        await client.invalidateQueries([QueryKey.account]);
        setSignOutAccount(null);
    }, [signOutAccount, sdk, client]);

    if (recoverAccountId) {
        return <RecoveryPhrase accountId={recoverAccountId} onBack={backFromRecovery} />;
    }

    const hasWallets = !!accounts && accounts.length > 0;

    return (
        <Root>
            <Top>
                <IconWrapper>
                    <WarningTriangle />
                </IconWrapper>
                <Title>{t('twa_closed_title')}</Title>
                <Subtitle>
                    {hasWallets ? t('twa_closed_subtitle_wallets') : t('twa_closed_subtitle')}
                </Subtitle>

                {hasWallets && (
                    <Accounts>
                        {accounts!.map(account => (
                            <AccountRow
                                key={account.id}
                                account={account}
                                onSelect={() => setActionAccount(account)}
                            />
                        ))}
                    </Accounts>
                )}
            </Top>

            <Bottom>
                <DownloadButton sdk={sdk} />
            </Bottom>

            <AccountActionsSheet
                account={actionAccount}
                onClose={closeAll}
                onShowRecovery={() => {
                    const id = actionAccount?.id ?? null;
                    closeAll();
                    setRecoverAccountId(id);
                }}
                onSignOut={() => {
                    const account = actionAccount;
                    setActionAccount(null);
                    setSignOutAccount(account);
                }}
            />

            <SignOutSheet
                account={signOutAccount}
                onClose={() => setSignOutAccount(null)}
                onBackUp={() => {
                    const id = signOutAccount?.id ?? null;
                    setSignOutAccount(null);
                    setRecoverAccountId(id);
                }}
                onConfirm={onSignOutConfirm}
            />
        </Root>
    );
};
