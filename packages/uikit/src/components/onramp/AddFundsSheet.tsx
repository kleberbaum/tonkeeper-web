import { FC } from 'react';
import IcChevronRight16 from '../../icons/components/IcChevronRight16';
import IcQrCode28Color from '../../icons/components/IcQrCode28Color';
import { cn } from '../../libs/css';
import { Modal } from '../../primitives/Modal';
import { useTranslation } from '../../hooks/translation';
import type { OnrampLayoutCard } from '@tonkeeper/core/dist/onrampApi';

export interface AddFundsSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onReceive: () => void;
    /**
     * Called when a "Buy with …" card is tapped. The card's
     * `preferredCurrency` is the fiat the backend chose for the user's
     * region — pass it down into ChooseAsset / PaymentMethod / EnterAmount.
     */
    onBuy: (card: OnrampLayoutCard) => void;
    /** Cards returned by `useExchangeLayout('deposit')`. */
    cards?: OnrampLayoutCard[];
    isLoading?: boolean;
}

interface RowProps {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    onClick: () => void;
}

const Row: FC<RowProps> = ({ icon, title, subtitle, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className={cn(
            'flex w-full items-center rounded-medium bg-backgroundContent text-left',
            'transition-colors hover:bg-backgroundContentTint focus:outline-none focus-visible:ring-2 focus-visible:ring-accentBlue'
        )}
    >
        <div className="flex shrink-0 items-center py-4 pl-4">{icon}</div>
        <div className="flex min-w-0 flex-1 flex-col p-4">
            <p className="truncate text-label1 text-textPrimary">{title}</p>
            <p className="truncate text-body2 text-textSecondary">{subtitle}</p>
        </div>
        <div className="flex shrink-0 items-center py-4 pr-4">
            <IcChevronRight16 className="h-4 w-4 text-textTertiary" />
        </div>
    </button>
);

const ReceiveIcon: FC = () => (
    <div className="relative h-11 w-11 overflow-hidden rounded-full">
        <IcQrCode28Color className="absolute left-1/2 top-1/2 h-11 w-11 -translate-x-1/2 -translate-y-1/2 text-accentBlue" />
    </div>
);

const CardIcon: FC<{ image: string }> = ({ image }) =>
    image ? (
        <img src={image} alt="" className="h-11 w-11 rounded-full object-cover" loading="eager" />
    ) : (
        <div className="h-11 w-11 rounded-full bg-backgroundContentTint" />
    );

const ShimmerRow: FC = () => (
    <div className="flex w-full items-center rounded-medium bg-backgroundContent">
        <div className="flex shrink-0 items-center py-4 pl-4">
            <div className="h-11 w-11 animate-pulse rounded-full bg-backgroundContentTint" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1 p-4">
            <div className="h-4 w-32 animate-pulse rounded bg-backgroundContentTint" />
            <div className="h-3 w-48 animate-pulse rounded bg-backgroundContentTint" />
        </div>
    </div>
);

export const AddFundsContent: FC<Omit<AddFundsSheetProps, 'isOpen' | 'onClose'>> = ({
    onReceive,
    onBuy,
    cards,
    isLoading
}) => {
    const { t } = useTranslation();
    return (
        <div className="flex flex-col gap-2 pb-2">
            <Row
                icon={<ReceiveIcon />}
                title={t('add_funds_receive_tokens')}
                subtitle={t('add_funds_receive_subtitle')}
                onClick={onReceive}
            />
            {isLoading && !cards?.length && <ShimmerRow />}
            {cards?.map(card => (
                <Row
                    key={`${card.title}-${card.image}`}
                    icon={<CardIcon image={card.image} />}
                    title={card.title}
                    subtitle={card.description}
                    onClick={() => onBuy(card)}
                />
            ))}
        </div>
    );
};

export const AddFundsSheet: FC<AddFundsSheetProps> = ({
    isOpen,
    onClose,
    onReceive,
    onBuy,
    cards,
    isLoading
}) => {
    const { t } = useTranslation();
    return (
        <Modal isOpen={isOpen} onClose={onClose} topBarTitle={t('wallet_add_funds')}>
            <AddFundsContent
                onReceive={onReceive}
                onBuy={onBuy}
                cards={cards}
                isLoading={isLoading}
            />
        </Modal>
    );
};
