import { FC, useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import {
    useMutateTonDiamondsAccent,
    useOwnedTonDiamondsAccents,
    useTonDiamondsAccentAutoRevert,
    useTonDiamondsAccentValue
} from '../../state/tonDiamonds';
import {
    TonDiamondsAccentKey,
    TonDiamondsAccents,
    tonDiamondsAccentKeys,
    tonDiamondsMarketplaceUrl
} from '../../styles/tonDiamonds';
import { DoneIcon } from '../Icon';
import { ListBlock, ListItemElement, ListItemPayload } from '../List';
import { Notification } from '../Notification';
import { Body2, Label1 } from '../Text';

const ColorDot = styled.div<{ $color?: string }>`
    width: 24px;
    height: 24px;
    flex-shrink: 0;
    border-radius: ${props => props.theme.cornerFull};
    background: ${props => props.$color ?? props.theme.accentBlueConstant};
`;

const RowLeft = styled.div`
    display: flex;
    align-items: center;
    gap: 1rem;
`;

const RowRight = styled.div`
    display: flex;
    align-items: center;
    color: ${props => props.theme.accentBlue};
`;

const MarketLabel = styled(Body2)`
    color: ${props => props.theme.textSecondary};
`;

const AccentRow: FC<{
    accentKey: TonDiamondsAccentKey | 'default';
    owned: boolean;
    selected: boolean;
    onSelect: (key: TonDiamondsAccentKey | 'default') => void;
}> = ({ accentKey, owned, selected, onSelect }) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const color = accentKey === 'default' ? undefined : TonDiamondsAccents[accentKey].primary;

    return (
        <ListItemElement
            hover
            onClick={() => {
                if (owned) {
                    onSelect(accentKey);
                } else {
                    sdk.openPage(tonDiamondsMarketplaceUrl(accentKey as TonDiamondsAccentKey));
                }
            }}
        >
            <ListItemPayload>
                <RowLeft>
                    <ColorDot $color={color} />
                    <Label1>{t(`appearance_accent_name_${accentKey}`)}</Label1>
                </RowLeft>
                <RowRight>
                    {selected ? (
                        <DoneIcon />
                    ) : owned ? null : (
                        <MarketLabel>{t('nft_open_in_marketplace')}</MarketLabel>
                    )}
                </RowRight>
            </ListItemPayload>
        </ListItemElement>
    );
};

const TonDiamondsAppearanceContent: FC<{ onClose: () => void }> = ({ onClose }) => {
    const current = useTonDiamondsAccentValue() ?? 'default';
    const owned = useOwnedTonDiamondsAccents();
    const { mutateAsync } = useMutateTonDiamondsAccent();

    const handleSelect = async (key: TonDiamondsAccentKey | 'default') => {
        await mutateAsync(key === 'default' ? undefined : key);
        onClose();
    };

    const ownedKeys = tonDiamondsAccentKeys.filter(key => owned.has(key));
    const lockedKeys = tonDiamondsAccentKeys.filter(key => !owned.has(key));

    return (
        <ListBlock margin={false}>
            <AccentRow
                accentKey="default"
                owned
                selected={current === 'default'}
                onSelect={handleSelect}
            />
            {ownedKeys.map(key => (
                <AccentRow
                    key={key}
                    accentKey={key}
                    owned
                    selected={current === key}
                    onSelect={handleSelect}
                />
            ))}
            {lockedKeys.map(key => (
                <AccentRow
                    key={key}
                    accentKey={key}
                    owned={false}
                    selected={current === key}
                    onSelect={handleSelect}
                />
            ))}
        </ListBlock>
    );
};

const TonDiamondsAppearanceNotification = () => {
    const sdk = useAppSdk();
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);

    useTonDiamondsAccentAutoRevert();

    const handleClose = useCallback(() => setIsOpen(false), []);

    useEffect(() => {
        const handler = () => setIsOpen(true);
        sdk.uiEvents.on('appearance', handler);
        return () => {
            sdk.uiEvents.off('appearance', handler);
        };
    }, [sdk]);

    const Content = useCallback(() => {
        if (!isOpen) return undefined;
        return <TonDiamondsAppearanceContent onClose={handleClose} />;
    }, [isOpen, handleClose]);

    return (
        <Notification
            isOpen={isOpen}
            handleClose={handleClose}
            hideButton
            backShadow
            title={t('appearance_title')}
        >
            {Content}
        </Notification>
    );
};

export default TonDiamondsAppearanceNotification;
