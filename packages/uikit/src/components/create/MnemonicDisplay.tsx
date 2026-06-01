import { FC } from 'react';
import styled, { css } from 'styled-components';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { useActiveConfig } from '../../state/wallet';
import { hexToRGBA } from '../../libs/css';
import { Body1, Body2, Body2Class, Body3, H2Label2Responsive } from '../Text';
import { BorderSmallResponsive } from '../shared/Styles';
import { ExclamationMarkCircleIcon } from '../Icon';
import { Button } from '../fields/Button';

/**
 * Renders a known mnemonic phrase as a 2-column numbered grid with a
 * heading + caption above. Used both inside the create flow (after
 * generating a fresh phrase) and in the settings recovery screen
 * (revealing an existing wallet's phrase).
 *
 * `type` switches the heading/caption between standard / MAM / TRON
 * variants and pulls in the appropriate explanation callout.
 */

const HeadingBlock = styled.div`
    display: flex;
    text-align: center;
    gap: 1rem;
    flex-direction: column;
    margin-bottom: 16px;

    ${p =>
        p.theme.displayType === 'full-width' &&
        css`
            gap: 2px;
        `}
`;

const Body = styled(Body1)`
    user-select: none;
    text-align: center;
    color: ${props => props.theme.textSecondary};
    ${p =>
        p.theme.displayType === 'full-width' &&
        css`
            ${Body2Class};
            max-width: 450px;
            display: block;
            margin: 0 auto;
        `}
    text-wrap: balance;
`;

const WordsGrid = styled.div<{ wordsNumber: 12 | 24 }>`
    display: grid;
    grid-template-rows: repeat(${p => p.wordsNumber / 2}, minmax(0, 1fr));
    grid-auto-flow: column;
    gap: 0.5rem;
    place-content: space-evenly;
    margin: 0 0 1rem;
    white-space: normal;
`;

const WordNumber = styled(Body2)`
    display: inline-block;
    width: 24px;
    line-height: 24px;
    color: ${props => props.theme.textSecondary};
    user-select: none;
`;

const MamAccountCallout = styled.div`
    background: ${p => p.theme.backgroundContent};
    ${BorderSmallResponsive};
    padding: 8px 12px;
    display: flex;
    gap: 12px;
    margin-bottom: 24px;
`;

const TronAccountCallout = styled.div`
    background: ${p => hexToRGBA(p.theme.accentOrange, 0.16)};
    ${BorderSmallResponsive};
    padding: 8px 12px;
    display: flex;
    gap: 12px;
    margin-bottom: 24px;
`;

const Body3Secondary = styled(Body3)`
    color: ${p => p.theme.textSecondary};
`;

const Body3Orange = styled(Body3)`
    color: ${p => p.theme.accentOrange};
`;

const ExclamationMarkCircleIconStyled = styled(ExclamationMarkCircleIcon)`
    margin-top: 4px;
    height: 16px;
    width: 16px;
    color: ${p => p.theme.accentOrange};
    flex-shrink: 0;
`;

const LinkStyled = styled(Body3)`
    color: ${p => p.theme.accentBlueConstant};
    cursor: pointer;
`;

const H2Label2ResponsiveStyled = styled(H2Label2Responsive)`
    ${p =>
        p.theme.displayType === 'compact' &&
        css`
            padding: 0 40px;
        `}
`;

export const MnemonicDisplay: FC<{
    mnemonic: string[];
    type?: 'standard' | 'mam' | 'tron';
    allowCopy?: boolean;
    descriptionDown?: boolean;
}> = ({ mnemonic, type, allowCopy, descriptionDown }) => {
    const { t } = useTranslation();
    const config = useActiveConfig();
    const sdk = useAppSdk();
    type ??= 'standard';

    const MamNotice = type === 'mam' && (
        <MamAccountCallout>
            <div>
                <Body3Secondary>{t('mam_account_explanation') + ' '}</Body3Secondary>
                {!!config.mam_learn_more_url && (
                    <LinkStyled onClick={() => sdk.openPage(config.mam_learn_more_url!)}>
                        {t('learn_more')}
                    </LinkStyled>
                )}
            </div>
            <ExclamationMarkCircleIconStyled />
        </MamAccountCallout>
    );

    return (
        <>
            <HeadingBlock>
                <H2Label2ResponsiveStyled>
                    {t(
                        type === 'mam'
                            ? 'secret_words_account_title'
                            : type === 'tron'
                            ? 'export_trc_20_wallet'
                            : 'secret_words_title'
                    )}
                </H2Label2ResponsiveStyled>
                {!descriptionDown && (
                    <Body>
                        {t(
                            mnemonic.length === 12
                                ? 'secret_words_caption_12'
                                : 'secret_words_caption'
                        )}
                    </Body>
                )}
            </HeadingBlock>

            {!descriptionDown && MamNotice}

            {type === 'tron' && (
                <TronAccountCallout>
                    <div>
                        <Body3Orange>{t('tron_account_export_warning_explanation')}</Body3Orange>
                    </div>
                    <ExclamationMarkCircleIconStyled />
                </TronAccountCallout>
            )}

            <WordsGrid wordsNumber={mnemonic.length as 12 | 24}>
                {mnemonic.map((world, index) => (
                    <Body1 key={index}>
                        <WordNumber> {index + 1}.</WordNumber> {world}{' '}
                    </Body1>
                ))}
            </WordsGrid>

            {descriptionDown && (
                <>
                    {MamNotice}
                    <Body>
                        {t(
                            mnemonic.length === 12
                                ? 'secret_words_caption_12'
                                : 'secret_words_caption'
                        )}
                    </Body>
                </>
            )}

            {allowCopy && (
                <Button
                    onClick={() => sdk.copyToClipboard(mnemonic.join(' '), t('copied'))}
                    marginTop
                >
                    {t('recovery_phrase_copy_button')}
                </Button>
            )}
        </>
    );
};
