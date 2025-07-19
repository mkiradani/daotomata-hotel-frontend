/** @jsxImportSource @builder.io/qwik */
import { $, component$, useStore } from '@builder.io/qwik';

interface CreditCardData {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  cardholderName: string;
  detectedCardType?: string;
}

interface CreditCardFormProps {
  cardType: string;
  onCardDataChange: (cardData: CreditCardData) => void;
  onCardTypeDetected?: (cardType: string) => void;
  className?: string;
}

export const CreditCardForm = component$<CreditCardFormProps>(
  ({ cardType, onCardDataChange, onCardTypeDetected, className = '' }) => {
    const cardData = useStore<CreditCardData>({
      cardNumber: '',
      expiryMonth: '',
      expiryYear: '',
      cvv: '',
      cardholderName: '',
    });

    const errors = useStore({
      cardNumber: '',
      expiryMonth: '',
      expiryYear: '',
      cvv: '',
      cardholderName: '',
    });

    // Format card number with spaces
    const formatCardNumber = $((value: string) => {
      const digits = value.replace(/\D/g, '');
      const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
      return formatted.substring(0, 19);
    });

    // Detect card type based on card number
    const detectCardType = $((cardNumber: string) => {
      const digits = cardNumber.replace(/\D/g, '');

      if (digits.startsWith('4')) return 'visa';
      if (
        digits.startsWith('5') ||
        (digits.length >= 4 &&
          parseInt(digits.substring(0, 4)) >= 2221 &&
          parseInt(digits.substring(0, 4)) <= 2720)
      ) {
        return 'master';
      }
      if (digits.startsWith('34') || digits.startsWith('37')) return 'amex';
      if (
        digits.startsWith('30') ||
        digits.startsWith('36') ||
        digits.startsWith('38')
      )
        return 'diners';

      return '';
    });

    // Validate card number using Luhn algorithm
    const validateCardNumber = $((cardNumber: string) => {
      const digits = cardNumber.replace(/\D/g, '');

      if (digits.length < 13 || digits.length > 19) {
        return 'Card number must be between 13-19 digits';
      }

      let sum = 0;
      let isEven = false;

      for (let i = digits.length - 1; i >= 0; i--) {
        let digit = parseInt(digits[i]);

        if (isEven) {
          digit *= 2;
          if (digit > 9) {
            digit -= 9;
          }
        }

        sum += digit;
        isEven = !isEven;
      }

      return sum % 10 === 0 ? '' : 'Invalid card number';
    });

    // Handle card number input
    const handleCardNumberChange = $(async (value: string) => {
      const formatted = await formatCardNumber(value);
      cardData.cardNumber = formatted;
      errors.cardNumber = await validateCardNumber(formatted);

      const detectedType = await detectCardType(formatted);
      if (detectedType) {
        cardData.detectedCardType = detectedType;
        if (onCardTypeDetected) {
          onCardTypeDetected(detectedType);
        }
      } else {
        cardData.detectedCardType = '';
      }

      onCardDataChange(cardData);
    });

    // Handle expiry month change
    const handleExpiryMonthChange = $((value: string) => {
      cardData.expiryMonth = value;
      errors.expiryMonth = value ? '' : 'Month is required';
      onCardDataChange(cardData);
    });

    // Handle expiry year change
    const handleExpiryYearChange = $((value: string) => {
      cardData.expiryYear = value;
      const currentYear = new Date().getFullYear();
      const selectedYear = parseInt(value);

      if (!value) {
        errors.expiryYear = 'Year is required';
      } else if (selectedYear < currentYear) {
        errors.expiryYear = 'Card has expired';
      } else {
        errors.expiryYear = '';
      }

      onCardDataChange(cardData);
    });

    // Handle CVV change
    const handleCvvChange = $((value: string) => {
      const digits = value.replace(/\D/g, '').substring(0, 4);
      cardData.cvv = digits;

      if (!digits) {
        errors.cvv = 'CVV is required';
      } else if (digits.length < 3) {
        errors.cvv = 'CVV must be at least 3 digits';
      } else {
        errors.cvv = '';
      }

      onCardDataChange(cardData);
    });

    // Handle cardholder name change
    const handleCardholderNameChange = $((value: string) => {
      cardData.cardholderName = value.toUpperCase();
      errors.cardholderName = value.trim() ? '' : 'Cardholder name is required';
      onCardDataChange(cardData);
    });

    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear + i);

    return (
      <div class={`credit-card-form ${className}`}>
        <div class="space-y-4">
          <div class="flex items-center gap-2 bg-primary/5 p-3 border border-primary/20 rounded-lg">
            <div class="font-medium text-primary">
              💳 {cardType.charAt(0).toUpperCase() + cardType.slice(1)} Card
            </div>
            {cardData.detectedCardType &&
              cardData.detectedCardType !== cardType && (
                <div class="bg-orange-100 px-2 py-1 rounded text-orange-600 text-sm">
                  Auto-detected:{' '}
                  {cardData.detectedCardType.charAt(0).toUpperCase() +
                    cardData.detectedCardType.slice(1)}
                </div>
              )}
          </div>

          <div class="form-control">
            <label class="label" for="card-number">
              <span class="font-medium text-base-content label-text">
                Card Number *
              </span>
            </label>
            <input
              id="card-number"
              type="text"
              class={`input-bordered focus:border-primary focus:outline-none w-full transition-colors input ${
                errors.cardNumber ? 'input-error' : ''
              }`}
              placeholder="1234 5678 9012 3456"
              value={cardData.cardNumber}
              onInput$={(e) =>
                handleCardNumberChange((e.target as HTMLInputElement).value)
              }
              maxLength={19}
            />
            {errors.cardNumber && (
              <div class="mt-1 text-error text-sm">{errors.cardNumber}</div>
            )}
          </div>

          <div class="gap-4 grid grid-cols-2">
            <div class="form-control">
              <label class="label" for="expiry-month">
                <span class="font-medium text-base-content label-text">
                  Month *
                </span>
              </label>
              <select
                id="expiry-month"
                class={`select-bordered select ${errors.expiryMonth ? 'select-error' : ''}`}
                value={cardData.expiryMonth}
                onChange$={(e) =>
                  handleExpiryMonthChange((e.target as HTMLSelectElement).value)
                }
              >
                <option value="">Month</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                  const monthStr = month.toString().padStart(2, '0');
                  const monthName = new Date(0, month - 1).toLocaleString(
                    'default',
                    { month: 'long' }
                  );
                  return (
                    <option key={month.toString()} value={monthStr}>
                      {`${monthStr} - ${monthName}`}
                    </option>
                  );
                })}
              </select>
              {errors.expiryMonth && (
                <div class="mt-1 text-error text-sm">{errors.expiryMonth}</div>
              )}
            </div>

            <div class="form-control">
              <label class="label" for="expiry-year">
                <span class="font-medium text-base-content label-text">
                  Year *
                </span>
              </label>
              <select
                id="expiry-year"
                class={`select-bordered select ${errors.expiryYear ? 'select-error' : ''}`}
                value={cardData.expiryYear}
                onChange$={(e) =>
                  handleExpiryYearChange((e.target as HTMLSelectElement).value)
                }
              >
                <option value="">Year</option>
                {yearOptions.map((year) => (
                  <option key={year.toString()} value={year.toString()}>
                    {year.toString()}
                  </option>
                ))}
              </select>
              {errors.expiryYear && (
                <div class="mt-1 text-error text-sm">{errors.expiryYear}</div>
              )}
            </div>
          </div>

          <div class="gap-4 grid grid-cols-1 sm:grid-cols-2">
            <div class="form-control">
              <label class="label" for="cvv">
                <span class="font-medium text-base-content label-text">
                  CVV *
                </span>
              </label>
              <input
                id="cvv"
                type="text"
                class={`input-bordered focus:border-primary focus:outline-none w-full transition-colors input ${
                  errors.cvv ? 'input-error' : ''
                }`}
                placeholder="123"
                value={cardData.cvv}
                onInput$={(e) =>
                  handleCvvChange((e.target as HTMLInputElement).value)
                }
                maxLength={4}
              />
              {errors.cvv && (
                <div class="mt-1 text-error text-sm">{errors.cvv}</div>
              )}
            </div>

            <div class="form-control">
              <label class="label" for="cardholder-name">
                <span class="font-medium text-base-content label-text">
                  Cardholder Name *
                </span>
              </label>
              <input
                id="cardholder-name"
                type="text"
                class={`input-bordered focus:border-primary focus:outline-none w-full transition-colors input ${
                  errors.cardholderName ? 'input-error' : ''
                }`}
                placeholder="JOHN DOE"
                value={cardData.cardholderName}
                onInput$={(e) =>
                  handleCardholderNameChange(
                    (e.target as HTMLInputElement).value
                  )
                }
              />
              {errors.cardholderName && (
                <div class="mt-1 text-error text-sm">
                  {errors.cardholderName}
                </div>
              )}
            </div>
          </div>

          <div class="bg-base-100 p-3 border border-base-300 rounded-lg">
            <div class="flex items-center gap-2 text-sm text-base-content/70">
              <span>🔒</span>
              <span>Your payment information is encrypted and secure</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
