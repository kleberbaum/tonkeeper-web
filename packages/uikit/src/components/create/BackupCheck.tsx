import { wordlist } from '@ton/crypto/dist/mnemonic/wordlist';
import { FC, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useTranslation } from '../../hooks/translation';
import { Button } from '../../primitives/Button';
import { FieldWord } from '../../primitives/FieldWord';
import { handleSubmit } from '../../libs/form';

/**
 * Create-flow backup verification (Figma `5228:177352` Empty /
 * `5228:177364` Filled). Picks three random word positions — one from
 * each third of the 24-word phrase — and asks the user to retype them.
 * The action button enables once all three match.
 *
 */

const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min)) + min;

const focusInput = (root: HTMLDivElement | null, index: number) => {
    if (!root) return;
    const wrapper = root.childNodes[index] as HTMLDivElement | undefined;
    wrapper?.querySelector('input')?.focus();
};

const getEmptyWordIndex = (words: string[]) => words.findIndex(w => w === '');
const getInvalidWordIndex = (words: string[]) =>
    words.findIndex(w => !(w === '' || wordlist.includes(w)));

export const BackupCheck: FC<{
    mnemonic: string[];
    onConfirm: () => void;
    isLoading?: boolean;
}> = ({ mnemonic, onConfirm, isLoading }) => {
    const { t } = useTranslation();
    const formId = useId();
    const fieldsRef = useRef<HTMLDivElement>(null);

    // One position from each third of the phrase, matching the legacy
    // CheckMnemonic behaviour. For 24 words: [1-7], [8-15], [16-23].
    const positions = useMemo(() => {
        const third = Math.floor(mnemonic.length / 3);
        return [
            getRandomInt(1, third + 1),
            getRandomInt(third + 1, 2 * third + 1),
            getRandomInt(2 * third + 1, mnemonic.length)
        ];
    }, [mnemonic.length]);

    const [words, setWords] = useState<string[]>(['', '', '']);
    const [touched, setTouched] = useState<boolean[]>([false, false, false]);

    const isValid = useMemo(
        () => words.every((val, i) => val.toLowerCase().trim() === mnemonic[positions[i] - 1]),
        [words, mnemonic, positions]
    );

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key !== 'Enter' || isValid) return;
            const empty = getEmptyWordIndex(words);
            if (empty !== -1) return focusInput(fieldsRef.current, empty);
            const invalid = getInvalidWordIndex(words);
            if (invalid !== -1) return focusInput(fieldsRef.current, invalid);
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [words, isValid]);

    const onChange = (value: string, index: number) =>
        setWords(prev => prev.map((w, i) => (i === index ? value.toLowerCase() : w)));

    const onBlur = (index: number) =>
        setTouched(prev => prev.map((v, i) => (i === index ? true : v)));

    const description = t('check_backup_caption')
        .replace('%1%', String(positions[0]))
        .replace('%2%', String(positions[1]))
        .replace('%3%', String(positions[2]));

    return (
        <form
            id={formId}
            onSubmit={handleSubmit(onConfirm)}
            className="mx-auto flex w-full max-w-[524px] flex-col"
        >
            <div className="flex flex-col items-center gap-1 pb-4 text-center">
                <h2 className="text-h2 text-textPrimary">{t('check_words_title')}</h2>
                <p className="text-balance text-body1 text-textSecondary">{description}</p>
            </div>

            <div ref={fieldsRef} className="flex flex-col gap-4 py-4">
                {words.map((word, i) => {
                    const expected = mnemonic[positions[i] - 1];
                    const matches = word === '' || word.toLowerCase().trim() === expected;
                    return (
                        <FieldWord
                            key={i}
                            value={word}
                            number={positions[i]}
                            error={touched[i] && !matches}
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck={false}
                            tabIndex={i + 1}
                            onChange={v => onChange(v, i)}
                            onBlur={() => onBlur(i)}
                        />
                    );
                })}
            </div>

            <Button
                size="large"
                variant="primaryBlue"
                fullWidth
                type="submit"
                form={formId}
                loading={isLoading}
                disabled={!isValid}
                className="mt-4"
            >
                {t('create_wallet_done_button')}
            </Button>
        </form>
    );
};
