/** @jsxImportSource @builder.io/qwik */
import { $, component$, useSignal, useStore, useTask$ } from '@builder.io/qwik';

interface PaymentMethod {
  method: string;
  name: string;
  cardTypes?: Array<{
    cardCode: string;
    cardName: string;
  }>;
}

interface PaymentMethodsData {
  propertyID: string;
  methods: PaymentMethod[];
  gateway?: Array<{
    name: string;
    currency: string;
  }>;
}

interface PaymentMethodSelectorProps {
  _hotelDomain: string;
  selectedMethod: string;
  selectedCardType?: string;
  onMethodChange: (method: string, cardType?: string) => void;
  className?: string;
}

export const PaymentMethodSelector = component$<PaymentMethodSelectorProps>(
  ({ selectedMethod, selectedCardType, onMethodChange, className = '' }) => {
    const paymentMethods = useStore<PaymentMethodsData>({
      propertyID: '',
      methods: [],
      gateway: [],
    });
    const isLoading = useSignal(true);
    const error = useSignal('');

    // Load payment methods on component mount
    useTask$(async () => {
      try {
        const response = await fetch('/api/booking/payment-methods', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to load payment methods');
        }

        // Update store with payment methods data
        paymentMethods.propertyID = result.data.data.propertyID;
        paymentMethods.methods = result.data.data.methods || [];
        paymentMethods.gateway = result.data.data.gateway || [];
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : 'Failed to load payment methods';
      } finally {
        isLoading.value = false;
      }
    });

    // Handle payment method selection
    const handleMethodChange = $((methodType: string) => {
      // If credit card is selected, default to first available card type
      if (methodType === 'credit') {
        const creditMethod = paymentMethods.methods.find(
          (m) => m.method === 'credit'
        );
        const defaultCardType =
          creditMethod?.cardTypes?.[0]?.cardCode || 'visa';
        onMethodChange(methodType, defaultCardType);
      } else {
        onMethodChange(methodType);
      }
    });

    // Handle card type selection (for credit cards)
    const handleCardTypeChange = $((cardType: string) => {
      onMethodChange('credit', cardType);
    });

    return (
      <div class={`payment-method-selector ${className}`}>
        <div class="form-control">
          <label class="label">
            <span class="font-medium text-base-content label-text">
              Payment Method *
            </span>
          </label>

          {isLoading.value && (
            <div class="flex justify-center items-center py-4">
              <span class="loading loading-spinner loading-sm"></span>
              <span class="ml-2 text-base-content/70">
                Loading payment methods...
              </span>
            </div>
          )}

          {error.value && (
            <div class="bg-error/10 border border-error/20 p-3 rounded-lg">
              <p class="text-error text-sm">⚠️ {error.value}</p>
            </div>
          )}

          {!isLoading.value && !error.value && (
            <div class="space-y-3">
              {paymentMethods.methods.map((method) => (
                <div key={method.method} class="form-control">
                  <label class="flex items-center gap-3 hover:bg-base-50 p-3 border border-base-300 rounded-lg transition-colors cursor-pointer">
                    <input
                      type="radio"
                      name="payment-method"
                      value={method.method}
                      class="radio radio-primary"
                      checked={selectedMethod === method.method}
                      onClick$={() => handleMethodChange(method.method)}
                    />
                    <div class="flex-1">
                      <div class="font-medium text-base-content">
                        {method.name}
                      </div>

                      {/* Show card types for credit card method */}
                      {method.method === 'credit' &&
                        selectedMethod === 'credit' &&
                        method.cardTypes && (
                          <div class="mt-2 space-y-2">
                            <div class="text-sm text-base-content/70">
                              Select card type:
                            </div>
                            <div class="flex flex-wrap gap-2">
                              {method.cardTypes.map((cardType) => (
                                <label
                                  key={cardType.cardCode}
                                  class="flex items-center gap-2 cursor-pointer"
                                >
                                  <input
                                    type="radio"
                                    name="card-type"
                                    value={cardType.cardCode}
                                    class="radio radio-sm radio-primary"
                                    checked={
                                      selectedCardType === cardType.cardCode
                                    }
                                    onClick$={() =>
                                      handleCardTypeChange(cardType.cardCode)
                                    }
                                  />
                                  <span class="text-sm text-base-content">
                                    {cardType.cardName}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  </label>
                </div>
              ))}
            </div>
          )}

          {/* Gateway information */}
          {!isLoading.value &&
            paymentMethods.gateway &&
            paymentMethods.gateway.length > 0 && (
              <div class="mt-4 p-3 bg-base-100 border border-base-300 rounded-lg">
                <div class="text-sm text-base-content/70">
                  Payment processed by: {paymentMethods.gateway[0].name}
                </div>
                <div class="text-xs text-base-content/50">
                  Currency: {paymentMethods.gateway[0].currency}
                </div>
              </div>
            )}
        </div>
      </div>
    );
  }
);
