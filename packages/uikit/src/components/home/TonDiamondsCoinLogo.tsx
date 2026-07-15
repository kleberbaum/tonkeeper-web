import { FC } from 'react';
import styled, { css } from 'styled-components';
import { useTonDiamondsAccentValue } from '../../state/tonDiamonds';
import { TonDiamondsAccents } from '../../styles/tonDiamonds';
import { Image } from '../shared/Image';

const Wrap = styled.div<{ $glow: string }>`
    width: 44px;
    height: 44px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: ${props => props.theme.cornerFull};
    background: radial-gradient(
        circle at 50% 50%,
        ${props => props.$glow}4D 0%,
        ${props => props.$glow}14 60%,
        transparent 75%
    );
    pointer-events: none;

    ${p =>
        p.theme.proDisplayType === 'mobile' &&
        css`
            width: 40px;
            height: 40px;
        `}
`;

const DiamondImage = styled(Image)`
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: ${props => props.theme.cornerFull};
`;

export const TonDiamondsCoinLogo: FC<{ image: string; className?: string }> = ({
    image,
    className
}) => {
    const accent = useTonDiamondsAccentValue();
    const glow = accent ? TonDiamondsAccents[accent].primary : '#45AEF5';

    return (
        <Wrap $glow={glow} className={className}>
            <DiamondImage src={image} alt="" />
        </Wrap>
    );
};
