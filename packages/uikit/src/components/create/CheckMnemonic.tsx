import { wordlist } from '@ton/crypto/dist/mnemonic/wordlist';
import { FC, useEffect, useId, useMemo, useRef, useState } from 'react';
import styled, { css } from 'styled-components';
import { useTranslation } from '../../hooks/translation';
import { Body1, Body2Class, H2Label2Responsive } from '../Text';
import { ButtonResponsiveSize } from '../fields/Button';
import { NotificationFooter, NotificationFooterPortal } from '../Notification';
import { handleSubmit } from '../../libs/form';
import { WordInput } from './WordInput';

/**
 * Create-flow verification step. Picks three random positions (one from
 * each of the first / middle / last thirds of a 24-word phrase) and asks
 * the user to type those specific words. The "Continue" button only
 * enables once all three match.
 *
 * Lives next to `ShowMnemonic` — the user goes Show → Check during
 * onboarding's create flow.
 */

const Block = styled.div`
    display: flex;
    text-align: center;
    gap: 1rem;
    flex-direction: column;
    margin-bottom: 16px;

    & + & {
        margin-top: 2rem;
    }
`;

const BlockSmallGap = styled(Block)`
    ${p =>
        p.theme.displayType === 'full-width' &&
        css`
            gap: 8px;
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

const CheckForm = styled.form`
    display: flex;
    flex-direction: column;
    justify-content: center;
`;

function getRandomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min)) + min;
}

const formatOrdinals = (lang: string, n: number) => {
    if (lang === 'en') {
        const pr = new Intl.PluralRules(lang, { type: 'ordinal' });
        const suffixes = new Map([
            ['one', 'st'],
            ['two', 'nd'],
            ['few', 'rd'],
            ['other', 'th']
        ]);

        const rule = pr.select(n);
        const suffix = suffixes.get(rule);
        return `${n}${suffix}`;
    } else {
        return `${n}`;
    }
};

const compareWords = (word: string, testWord: string) =>
    word === '' || word.toLowerCase().trim() === testWord;

const getEmptyWordIndex = (words: string[]) => words.findIndex(word => word === '');
const getInvalidWordIndex = (words: string[]) =>
    words.findIndex(word => !(word === '' || wordlist.includes(word)));

const focusInput = (current: HTMLDivElement | null, index: number) => {
    if (!current) return;
    const wrapper = current.childNodes[index] as HTMLDivElement;
    if (!wrapper) return;
    wrapper.querySelector('input')?.focus();
};

export const CheckMnemonic: FC<{
    mnemonic: string[];
    onConfirm: () => void;
    isLoading?: boolean;
}> = ({ onConfirm, mnemonic, isLoading }) => {
    const { t, i18n } = useTranslation();
    const formId = useId();

    const ref = useRef<HTMLDivElement>(null);

    const [words, setWords] = useState(['', '', '']);
    const positions = useMemo(() => {
        return [getRandomInt(1, 8), getRandomInt(8, 16), getRandomInt(16, 24)];
    }, []);
    const [test1, test2, test3] = positions;

    const description = useMemo(() => {
        return t('check_words_caption')
            .replace('%1%', formatOrdinals(i18n.language, test1))
            .replace('%2%', formatOrdinals(i18n.language, test2))
            .replace('%3%', formatOrdinals(i18n.language, test3));
    }, [t, test1, test2, test3]);

    const isValid = useMemo(
        () => words.every((val, i) => val.toLowerCase().trim() === mnemonic[positions[i] - 1]),
        [words, mnemonic, positions]
    );

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key !== 'Enter' || isValid) return;

            const emptyIndex = getEmptyWordIndex(words);
            if (emptyIndex !== -1) {
                focusInput(ref.current, emptyIndex);

                return;
            }

            const invalidIndex = getInvalidWordIndex(words);
            if (invalidIndex !== -1) {
                focusInput(ref.current, invalidIndex);

                return;
            }
        };
        window.addEventListener('keydown', handler);

        return () => window.removeEventListener('keydown', handler);
    }, [words]);

    const handleChange = (changeValue: string, wordIndex: number) =>
        setWords(prevWordsState =>
            prevWordsState.map((prevWord, prevIndex) =>
                prevIndex === wordIndex ? changeValue : prevWord
            )
        );

    return (
        <CheckForm onSubmit={handleSubmit(onConfirm)} id={formId}>
            <Block>
                <div>
                    <H2Label2Responsive>{t('check_words_title')}</H2Label2Responsive>
                    <Body>{description}</Body>
                </div>
            </Block>

            <BlockSmallGap ref={ref}>
                {words.map((word, wordIndex) => (
                    <WordInput
                        key={wordIndex}
                        tabIndex={wordIndex + 1}
                        test={positions[wordIndex]}
                        value={word}
                        onChange={newValue => handleChange(newValue, wordIndex)}
                        isValid={compareWords(word, mnemonic[positions[wordIndex] - 1])}
                    />
                ))}
            </BlockSmallGap>
            <NotificationFooterPortal>
                <NotificationFooter>
                    <ButtonResponsiveSize
                        tabIndex={4}
                        fullWidth
                        primary
                        type="submit"
                        form={formId}
                        loading={isLoading}
                        disabled={!isValid}
                    >
                        {t('continue')}
                    </ButtonResponsiveSize>
                </NotificationFooter>
            </NotificationFooterPortal>
        </CheckForm>
    );
};
