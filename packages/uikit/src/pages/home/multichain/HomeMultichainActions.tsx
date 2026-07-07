import { FC, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { IconButton } from '../../../primitives';
import { useAppSdk } from '../../../hooks/appSdk';
import { useTranslation } from '../../../hooks/translation';
import { useNavigate } from '../../../hooks/router/useNavigate';
import {
    AppRoute,
    MULTICHAIN_ACTION_ADD_FUNDS,
    MULTICHAIN_ACTION_PARAM,
    MultichainRoute
} from '../../../libs/routes';
import { SendIcon, ReceiveIcon } from '../../../components/home/HomeIcons';
import IcSwapHorizontalOutline28 from '../../../icons/components/IcSwapHorizontalOutline28';
import IcStakingOutline28 from '../../../icons/components/IcStakingOutline28';
import { useSwapMobileNotification } from '../../../state/swap/useSwapMobileNotification';
import { AddFundsContent } from '../../../components/onramp/AddFundsSheet';
import { ChooseAssetScreen, OnrampAssetRow } from '../../../components/onramp/ChooseAssetScreen';
import { CurrencyPickerScreen } from '../../../components/onramp/CurrencyPickerScreen';
import { EnterAmountScreen } from '../../../components/onramp/EnterAmountScreen';
import { PaymentMethodScreen } from '../../../components/onramp/PaymentMethodScreen';
import { ProviderDisclaimerModal } from '../../../components/onramp/ProviderDisclaimerModal';
import { MultichainReceiveBody } from '../../../components/receive/MultichainReceiveSheet';
import { MultichainSendFlow } from '../../../components/transfer/multichain/MultichainSendFlow';
import { Modal } from '../../../primitives/Modal';
import {
    useCreateOnrampOrder,
    useCreateP2PSession,
    useDestinationAddress,
    useExchangeLayout,
    useOnrampAsset,
    useOnrampConfiguration
} from '../../../state/onramp';
import type {
    ExchangePaymentMethodType,
    OnrampLayoutCard,
    OnrampQuoteResult
} from '@tonkeeper/core/dist/onrampApi';

type Step =
    | 'closed'
    | 'add_funds'
    | 'choose_asset'
    | 'payment_method'
    | 'currency_picker'
    | 'enter_amount'
    | 'disclaimer'
    | 'receive';

export const HomeMultichainActions: FC = () => {
    const sdk = useAppSdk();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const [, setSwapOpen] = useSwapMobileNotification();
    const [step, setStep] = useState<Step>('closed');
    const [sendOpen, setSendOpen] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState<OnrampAssetRow | undefined>(undefined);
    const [selectedMethod, setSelectedMethod] = useState<ExchangePaymentMethodType | undefined>(
        undefined
    );
    const [selectedQuote, setSelectedQuote] = useState<OnrampQuoteResult | undefined>(undefined);
    // Buying fiat — region-derived, set when the user taps a layout card.
    // Intentionally NOT seeded from the app-wide display fiat (which is a
    // separate idea: that one defaults to USD for price/balance display).
    const [preferredFiat, setPreferredFiat] = useState<string | undefined>(undefined);
    // Which step opened the currency picker — back/select returns here.
    const [pickerOrigin, setPickerOrigin] = useState<'payment_method' | 'enter_amount'>(
        'payment_method'
    );

    // Deep-link entry: the history empty-state routes here with an action flag
    // to open Add Funds. Consume the flag and strip it so a refresh or back-nav
    // doesn't reopen the sheet.
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get(MULTICHAIN_ACTION_PARAM) === MULTICHAIN_ACTION_ADD_FUNDS) {
            setStep('add_funds');
            navigate(MultichainRoute.home, { replace: true });
        }
    }, [location.search, navigate]);

    const { data: layout, isLoading: isLayoutLoading } = useExchangeLayout('deposit');
    const { data: configuration, isLoading: isConfigurationLoading } = useOnrampConfiguration();
    const { data: assetDetail, isLoading: isAssetDetailLoading } = useOnrampAsset(
        selectedAsset?.assetId
    );

    // All fiats any provider on the chosen asset supports — the list the
    // currency picker offers and the constraint the auto-fallback respects.
    const availableFiats = useMemo<string[]>(() => {
        if (!assetDetail) return [];
        const set = new Set<string>();
        for (const m of assetDetail.paymentMethods) {
            for (const p of m.providers) set.add(p.fiat);
        }
        return Array.from(set);
    }, [assetDetail]);

    // The card's `preferredCurrency` reflects the region (e.g. RSD for RS) but
    // the chosen asset may not have a provider that supports it. Mirror iOS:
    // fall back to USD if available, then to whatever the asset offers first.
    const fiat = useMemo<string | undefined>(() => {
        if (!assetDetail) return preferredFiat;
        const available = new Set(availableFiats);
        if (preferredFiat && available.has(preferredFiat)) return preferredFiat;
        if (available.has('USD')) return 'USD';
        return availableFiats[0] ?? preferredFiat;
    }, [assetDetail, availableFiats, preferredFiat]);
    const createP2P = useCreateP2PSession();
    const createOrder = useCreateOnrampOrder();
    const destinationAddress = useDestinationAddress(selectedAsset?.assetId);

    const onSend = () => setSendOpen(true);

    const onAddFunds = () => setStep('add_funds');

    const onReceive = () => setStep('receive');

    const onBuy = (card: OnrampLayoutCard) => {
        setPreferredFiat(card.preferredCurrency);
        setStep('choose_asset');
    };

    const onSwap = () => setSwapOpen(true);

    const onStake = () => navigate(AppRoute.staking);

    return (
        <>
            <div className="flex items-center justify-center gap-2 py-4">
                <IconButton icon={<SendIcon />} label={t('wallet_send')} onClick={onSend} />
                <IconButton
                    icon={<ReceiveIcon />}
                    label={t('wallet_add_funds')}
                    onClick={onAddFunds}
                />
                <IconButton
                    icon={<IcSwapHorizontalOutline28 className="h-7 w-7" />}
                    label={t('swap_title')}
                    onClick={onSwap}
                />
                <IconButton
                    icon={<IcStakingOutline28 className="h-7 w-7" />}
                    label={t('staking_title')}
                    onClick={onStake}
                />
            </div>
            <MultichainSendFlow
                isOpen={sendOpen}
                onClose={() => setSendOpen(false)}
                onAddFunds={() => {
                    setSendOpen(false);
                    setStep('add_funds');
                }}
            />
            <Modal
                isOpen={step === 'add_funds' || step === 'receive'}
                onClose={() => setStep('closed')}
                topBarTitle={step === 'add_funds' ? t('wallet_add_funds') : undefined}
            >
                {step === 'add_funds' && (
                    <AddFundsContent
                        onReceive={onReceive}
                        onBuy={onBuy}
                        cards={layout?.items}
                        isLoading={isLayoutLoading}
                    />
                )}
                {step === 'receive' && <MultichainReceiveBody />}
            </Modal>
            <ChooseAssetScreen
                isOpen={step === 'choose_asset'}
                onClose={() => setStep('closed')}
                onBack={() => setStep('add_funds')}
                onSelect={asset => {
                    setSelectedAsset(asset);
                    setStep('payment_method');
                }}
                configuration={configuration}
                isLoading={isConfigurationLoading}
            />
            <PaymentMethodScreen
                isOpen={step === 'payment_method'}
                onClose={() => setStep('closed')}
                onBack={() => setStep('choose_asset')}
                assetId={selectedAsset?.assetId}
                fiat={fiat}
                asset={assetDetail}
                isLoading={isAssetDetailLoading}
                onChangeFiat={
                    availableFiats.length > 1
                        ? () => {
                              setPickerOrigin('payment_method');
                              setStep('currency_picker');
                          }
                        : undefined
                }
                onSelect={method => {
                    setSelectedMethod(method);
                    setStep('enter_amount');
                }}
                onSelectP2P={() => {
                    if (!selectedAsset || !destinationAddress || !fiat) return;
                    createP2P.mutate(
                        {
                            wallet: destinationAddress,
                            network: selectedAsset.chain,
                            cryptoCurrency: selectedAsset.symbol,
                            fiatCurrency: fiat
                        },
                        {
                            onSuccess: result => {
                                sdk.openPage(result.deeplinkUrl);
                                setStep('closed');
                            }
                        }
                    );
                }}
            />
            <CurrencyPickerScreen
                isOpen={step === 'currency_picker'}
                onClose={() => setStep('closed')}
                onBack={() => setStep(pickerOrigin)}
                allowed={availableFiats}
                selected={fiat}
                onSelect={code => {
                    setPreferredFiat(code);
                    setStep(pickerOrigin);
                }}
            />
            {selectedAsset && selectedMethod && fiat && (
                <EnterAmountScreen
                    key={`${selectedAsset.assetId}-${selectedMethod}-${fiat}`}
                    isOpen={step === 'enter_amount'}
                    onClose={() => setStep('closed')}
                    onBack={() => setStep('payment_method')}
                    asset={selectedAsset}
                    fiat={fiat}
                    paymentMethod={selectedMethod}
                    onChangeFiat={
                        availableFiats.length > 1
                            ? () => {
                                  setPickerOrigin('enter_amount');
                                  setStep('currency_picker');
                              }
                            : undefined
                    }
                    onContinue={quote => {
                        setSelectedQuote(quote);
                        setStep('disclaimer');
                    }}
                />
            )}
            {selectedQuote && (
                <ProviderDisclaimerModal
                    isOpen={step === 'disclaimer'}
                    onClose={() => setStep('enter_amount')}
                    providerName={selectedQuote.merchant}
                    isLoading={createOrder.isLoading}
                    onConfirm={() => {
                        if (!selectedAsset || !destinationAddress || !fiat) return;
                        createOrder.mutate(
                            {
                                targetAssetId: selectedAsset.assetId,
                                fiat,
                                amount: selectedQuote.amountIn,
                                destinationAddress,
                                paymentMethod: selectedQuote.paymentMethod,
                                merchant: selectedQuote.merchant,
                                merchantTransactionId: selectedQuote.merchantTransactionId
                            },
                            {
                                onSuccess: order => {
                                    if (order.widgetUrl) {
                                        sdk.openPage(order.widgetUrl);
                                    }
                                    setStep('closed');
                                }
                            }
                        );
                    }}
                />
            )}
        </>
    );
};
