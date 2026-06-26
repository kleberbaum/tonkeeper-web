import { FC } from 'react';

import { useTranslation } from '../../../../hooks/translation';

const SearchIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
);

export const CryptoCatalogSearch: FC<{
    value: string;
    onChange: (v: string) => void;
}> = ({ value, onChange }) => {
    const { t } = useTranslation();
    return (
        <div className="flex items-center gap-2 rounded-medium bg-fieldBackground px-3 py-3 text-textSecondary">
            <SearchIcon />
            <input
                type="text"
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={t('crypto_catalog_search_placeholder')}
                className="flex-1 bg-transparent text-body1 text-textPrimary outline-none placeholder:text-textSecondary"
            />
        </div>
    );
};
