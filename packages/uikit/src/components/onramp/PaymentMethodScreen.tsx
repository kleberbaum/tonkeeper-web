import { FC, Fragment, useMemo } from 'react';
import type {
    ExchangePaymentMethodType,
    OnrampAssetDetail,
    OnrampPaymentMethod
} from '@tonkeeper/core/dist/onrampApi';
import IcChevronRight16 from '../../icons/components/IcChevronRight16';
import { Modal, useSetModalOnBack } from '../../primitives/Modal';
import { useTranslation } from '../../hooks/translation';

export interface PaymentMethodScreenProps {
    isOpen: boolean;
    onClose: () => void;
    onBack?: () => void;
    /** Asset chosen on the previous screen — used to fetch eligible methods. */
    assetId?: string;
    /** Fiat currency currently selected for this purchase. */
    fiat?: string;
    /** Asset detail returned by `useOnrampAsset(assetId)`. */
    asset?: OnrampAssetDetail;
    isLoading?: boolean;
    /** Called when the user taps a non-P2P method (continues to EnterAmount). */
    onSelect: (method: ExchangePaymentMethodType) => void;
    /** Called when the user taps the P2P Market row (branches to P2P session). */
    onSelectP2P: () => void;
    /** Called when the user taps the currency in the subtitle. */
    onChangeFiat?: () => void;
}

const filterMethods = (
    methods: OnrampPaymentMethod[],
    fiat: string | undefined
): OnrampPaymentMethod[] => {
    if (!fiat) return methods;
    return methods.filter(m => m.providers.some(p => p.fiat === fiat));
};

const MethodIcon: FC<{ image: string }> = ({ image }) =>
    image ? (
        <img
            src={image}
            alt=""
            className="h-7 w-7 shrink-0 rounded-full object-cover"
            loading="lazy"
        />
    ) : (
        <div className="h-7 w-7 shrink-0 rounded-full bg-backgroundContentTint" />
    );

const MethodRow: FC<{
    method: OnrampPaymentMethod;
    onClick: () => void;
    showDivider: boolean;
}> = ({ method, onClick, showDivider }) => (
    <>
        <button
            type="button"
            onClick={onClick}
            className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-backgroundContentTint focus:outline-none focus-visible:bg-backgroundContentTint"
        >
            <MethodIcon image={method.image} />
            <span className="text-label1 text-textPrimary">{method.name}</span>
        </button>
        {showDivider && <div className="ml-14 h-px bg-separatorCommon" />}
    </>
);

const TopBarTitle: FC<{
    title: string;
    subtitle: string;
    fiat?: string;
    onChangeFiat?: () => void;
}> = ({ title, subtitle, fiat, onChangeFiat }) => (
    <div className="flex flex-col items-center">
        <span className="text-label1 text-textPrimary">{title}</span>
        <div className="flex items-center gap-1 text-body3">
            <span className="text-textSecondary">{subtitle}</span>
            {fiat && (
                <button
                    type="button"
                    onClick={onChangeFiat}
                    disabled={!onChangeFiat}
                    aria-label={onChangeFiat ? `Change currency from ${fiat}` : undefined}
                    className="-mx-1 -my-0.5 inline-flex cursor-pointer items-center gap-0.5 rounded px-1 py-0.5 text-accentBlue hover:bg-backgroundContentTint hover:opacity-80 focus:outline-none focus-visible:bg-backgroundContentTint disabled:cursor-default disabled:hover:bg-transparent disabled:hover:opacity-100"
                >
                    {fiat}
                    {onChangeFiat && (
                        <IcChevronRight16
                            className="h-3 w-3 rotate-90 text-accentBlue"
                            aria-hidden
                        />
                    )}
                </button>
            )}
        </div>
    </div>
);

export const PaymentMethodScreen: FC<PaymentMethodScreenProps> = ({
    isOpen,
    onClose,
    onBack,
    fiat,
    asset,
    isLoading,
    onSelect,
    onSelectP2P,
    onChangeFiat
}) => {
    const { t } = useTranslation();

    useSetModalOnBack(onBack);

    const methods = useMemo(() => filterMethods(asset?.paymentMethods ?? [], fiat), [asset, fiat]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            topBarTitle={
                <TopBarTitle
                    title={t('payment_method_title')}
                    subtitle={t('payment_method_subtitle')}
                    fiat={fiat}
                    onChangeFiat={onChangeFiat}
                />
            }
        >
            <div className="pb-4">
                {isLoading && methods.length === 0 && (
                    <p className="py-8 text-center text-body2 text-textSecondary">{t('loading')}</p>
                )}
                {!isLoading && methods.length === 0 && (
                    <p className="py-8 text-center text-body2 text-textSecondary">
                        {t('payment_method_none_available')}
                    </p>
                )}
                {methods.length > 0 && (
                    <div className="overflow-hidden rounded-medium bg-backgroundContent">
                        {methods.map((m, i) => (
                            <Fragment key={m.type}>
                                <MethodRow
                                    method={m}
                                    onClick={() =>
                                        m.type === 'p2p' ? onSelectP2P() : onSelect(m.type)
                                    }
                                    showDivider={i < methods.length - 1}
                                />
                            </Fragment>
                        ))}
                    </div>
                )}
            </div>
        </Modal>
    );
};
