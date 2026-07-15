import { NFT } from '@tonkeeper/core/dist/entries/nft';
import { FC } from 'react';
import styled from 'styled-components';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { TonDiamondsAccents, tonDiamondsAccentKeyByNft } from '../../styles/tonDiamonds';
import { Body2, Label1 } from '../Text';

const Wrap = styled.div`
    width: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1rem;
    background: ${props => props.theme.backgroundContent};
    border-radius: ${props => props.theme.cornerMedium};
`;

const Description = styled(Body2)`
    color: ${props => props.theme.textSecondary};
`;

const FeatureButton = styled.button<{ $color: string; $highlight: string }>`
    border: 0;
    outline: 0;
    cursor: pointer;
    align-self: flex-start;
    margin-top: 0.25rem;
    padding: 0.5rem 1rem;
    border-radius: ${props => props.theme.cornerSmall};
    background: ${props => props.$color};
    color: ${props => props.theme.constantWhite};
    transition: background-color 0.1s ease;

    &:hover {
        background: ${props => props.$highlight};
    }
`;

export const TonDiamondsFeature: FC<{ nftItem: NFT }> = ({ nftItem }) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();

    const accentKey = tonDiamondsAccentKeyByNft(nftItem);
    if (!accentKey) {
        return null;
    }
    const accent = TonDiamondsAccents[accentKey];

    return (
        <Wrap>
            <Label1>{t('nft_features')}</Label1>
            <Description>{t('nft_diamonds_description')}</Description>
            <FeatureButton
                type="button"
                $color={accent.primary}
                $highlight={accent.light}
                onClick={() =>
                    sdk.uiEvents.emit('appearance', {
                        method: 'appearance',
                        params: { nftAddress: nftItem.address }
                    })
                }
            >
                <Label1>{t('nft_change_theme')}</Label1>
            </FeatureButton>
        </Wrap>
    );
};
