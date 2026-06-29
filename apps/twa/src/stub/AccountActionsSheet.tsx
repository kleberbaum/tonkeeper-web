import { Account } from '@tonkeeper/core/dist/entries/account';
import { ListBlock, ListItem, ListItemPayload } from '@tonkeeper/uikit/dist/components/List';
import { Notification } from '@tonkeeper/uikit/dist/components/Notification';
import { ChevronRightIcon } from '@tonkeeper/uikit/dist/components/Icon';
import { KeyIcon, LogOutIcon } from '@tonkeeper/uikit/dist/components/settings/SettingsIcons';
import { Label2 } from '@tonkeeper/uikit/dist/components/Text';
import { useTranslation } from '@tonkeeper/uikit/dist/hooks/translation';
import { FC } from 'react';
import styled from 'styled-components';

const Payload = styled(ListItemPayload)`
    align-items: center;
    gap: 12px;
`;

const IconBlue = styled.span`
    display: flex;
    color: ${p => p.theme.accentBlue};
`;

const IconRed = styled.span`
    display: flex;
    color: ${p => p.theme.accentRed};
`;

const Grow = styled.div`
    flex-grow: 1;
`;

const Chevron = styled(ChevronRightIcon)`
    color: ${p => p.theme.iconTertiary};
    flex-shrink: 0;
`;

const RedLabel = styled(Label2)`
    color: ${p => p.theme.accentRed};
`;

export const AccountActionsSheet: FC<{
    account: Account | null;
    onClose: () => void;
    onShowRecovery: () => void;
    onSignOut: () => void;
}> = ({ account, onClose, onShowRecovery, onSignOut }) => {
    const { t } = useTranslation();

    return (
        <Notification isOpen={!!account} handleClose={onClose} title={account?.name}>
            {afterClose => (
                <ListBlock>
                    <ListItem hover={false} onClick={() => afterClose(onShowRecovery)}>
                        <Payload>
                            <IconBlue>
                                <KeyIcon />
                            </IconBlue>
                            <Grow>
                                <Label2>{t('twa_show_recovery_phrase')}</Label2>
                            </Grow>
                            <Chevron />
                        </Payload>
                    </ListItem>
                    <ListItem hover={false} onClick={() => afterClose(onSignOut)}>
                        <Payload>
                            <IconRed>
                                <LogOutIcon />
                            </IconRed>
                            <Grow>
                                <RedLabel>{t('twa_sign_out')}</RedLabel>
                            </Grow>
                            <Chevron />
                        </Payload>
                    </ListItem>
                </ListBlock>
            )}
        </Notification>
    );
};
