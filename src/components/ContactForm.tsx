/** @jsxImportSource @builder.io/qwik */
import { component$, useSignal, $ } from '@builder.io/qwik';

interface ContactMethod {
  id: number;
  contact_type: string;
  contact_identifier: string;
  name: string;
}

interface ContactFormProps {
  hotelId: number;
  hotelName: string;
  contactMethods?: ContactMethod[];
}

export const ContactForm = component$<ContactFormProps>(({ hotelId, hotelName, contactMethods = [] }) => {
  const isSubmitting = useSignal(false);
  const isSubmitted = useSignal(false);
  const errorMessage = useSignal('');
  const formData = useSignal({
    email: '',
    phone: '',
    message: '',
  });

  // Helper function to get contact method icon and format
  const getContactMethodDisplay = (method: ContactMethod) => {
    switch (method.contact_type.toLowerCase()) {
      case 'email':
        return {
          icon: (
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>
          ),
          href: `mailto:${method.contact_identifier}`,
          label: method.contact_identifier,
          title: `Send email to ${method.name}`
        };
      case 'phone':
        return {
          icon: (
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
            </svg>
          ),
          href: `tel:${method.contact_identifier}`,
          label: method.contact_identifier,
          title: `Call ${method.name}`
        };
      case 'whatsapp':
        return {
          icon: (
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.386"/>
            </svg>
          ),
          href: `https://wa.me/${method.contact_identifier.replace(/[^0-9]/g, '')}`,
          label: method.contact_identifier,
          title: `Message ${method.name} on WhatsApp`
        };
      default:
        return {
          icon: (
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          ),
          href: method.contact_identifier,
          label: method.contact_identifier,
          title: `Contact ${method.name}`
        };
    }
  };

  const handleSubmit = $(async (event: Event) => {
    event.preventDefault();
    
    if (isSubmitting.value) return;
    
    // Basic validation
    if (!formData.value.email || !formData.value.message) {
      errorMessage.value = 'Email and message are required.';
      return;
    }

    if (!formData.value.email.includes('@')) {
      errorMessage.value = 'Please enter a valid email address.';
      return;
    }

    isSubmitting.value = true;
    errorMessage.value = '';

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hotel_id: hotelId,
          email: formData.value.email,
          phone: formData.value.phone,
          message: formData.value.message,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send message');
      }

      isSubmitted.value = true;
      formData.value = { email: '', phone: '', message: '' };
    } catch (error) {
      console.error('Contact form error:', error);
      errorMessage.value = error instanceof Error ? error.message : 'Failed to send message. Please try again.';
    } finally {
      isSubmitting.value = false;
    }
  });

  const handleInputChange = $((field: string, value: string) => {
    formData.value = { ...formData.value, [field]: value };
    if (errorMessage.value) {
      errorMessage.value = '';
    }
  });

  if (isSubmitted.value) {
    return (
      <div class="bg-success/10 p-8 border border-success/20 rounded-lg text-center">
        <div class="mb-4">
          <svg class="mx-auto w-16 h-16 text-success" fill="currentColor" viewBox="0 0 20 20">
            <title>Success icon</title>
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
        </div>
        <h3 class="mb-2 font-primary font-bold text-success text-xl">Message Sent Successfully!</h3>
        <p class="mb-6 font-secondary text-base-content/70">
          Thank you for contacting {hotelName}. We'll get back to you as soon as possible.
        </p>
        <button
          onClick$={() => {
            isSubmitted.value = false;
          }}
          class="btn-outline font-secondary btn btn-sm"
        >
          Send Another Message
        </button>
      </div>
    );
  }

  return (
    <div class="bg-base-200 p-8 rounded-lg">
      <h3 class="mb-6 font-primary font-bold text-primary text-xl">
        Send us a Message
      </h3>
      
      <form onSubmit$={handleSubmit} class="space-y-6">
        {/* Email Field */}
        <div>
          <label for="email" class="block mb-2 font-secondary font-medium text-sm text-base-content">
            Email Address *
          </label>
          <input
            type="email"
            id="email"
            required
            value={formData.value.email}
            onInput$={(event) => handleInputChange('email', (event.target as HTMLInputElement).value)}
            class="px-4 py-3 border input-bordered focus:border-primary border-base-300 rounded-lg focus:ring-primary w-full transition-colors input"
            placeholder="your.email@example.com"
            disabled={isSubmitting.value}
          />
        </div>

        {/* Phone Field */}
        <div>
          <label for="phone" class="block mb-2 font-secondary font-medium text-sm text-base-content">
            Phone Number (Optional)
          </label>
          <input
            type="tel"
            id="phone"
            value={formData.value.phone}
            onInput$={(event) => handleInputChange('phone', (event.target as HTMLInputElement).value)}
            class="px-4 py-3 border input-bordered focus:border-primary border-base-300 rounded-lg focus:ring-primary w-full transition-colors input"
            placeholder="+1 (555) 123-4567"
            disabled={isSubmitting.value}
          />
        </div>

        {/* Message Field */}
        <div>
          <label for="message" class="block mb-2 font-secondary font-medium text-sm text-base-content">
            Message *
          </label>
          <textarea
            id="message"
            required
            rows={5}
            value={formData.value.message}
            onInput$={(event) => handleInputChange('message', (event.target as HTMLTextAreaElement).value)}
            class="px-4 py-3 border textarea-bordered focus:border-primary border-base-300 rounded-lg focus:ring-primary w-full transition-colors resize-none textarea"
            placeholder="Tell us about your inquiry, special requests, or any questions you may have..."
            disabled={isSubmitting.value}
          />
        </div>

        {/* Error Message */}
        {errorMessage.value && (
          <div class="bg-error/10 p-4 border border-error/20 rounded-lg">
            <div class="flex items-center">
              <svg class="flex-shrink-0 mr-2 w-5 h-5 text-error" fill="currentColor" viewBox="0 0 20 20">
                <title>Error icon</title>
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
              <span class="font-secondary text-error text-sm">{errorMessage.value}</span>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div class="pt-2">
          <button
            type="submit"
            disabled={isSubmitting.value}
            class={`font-secondary btn btn-primary btn-lg w-full ${isSubmitting.value ? 'loading' : ''}`}
          >
            {isSubmitting.value ? (
              <>
                <span class="loading loading-spinner loading-sm"></span>
                Sending Message...
              </>
            ) : (
              'Send Message'
            )}
          </button>
        </div>

        {/* Privacy Notice */}
        <div class="pt-4 text-center">
          <p class="font-secondary text-xs text-base-content/60">
            By submitting this form, you agree to be contacted by {hotelName} regarding your inquiry.
            We respect your privacy and will not share your information with third parties.
          </p>
        </div>
      </form>

      {/* Alternative Contact Methods */}
      {contactMethods && contactMethods.length > 0 && (
        <div class="mt-8 pt-8 border-t border-base-300">
          <h4 class="mb-4 font-primary font-semibold text-base-content text-lg">
            Other Ways to Reach Us
          </h4>
          <div class="gap-4 grid grid-cols-1 sm:grid-cols-2">
            {contactMethods.map((method) => {
              const display = getContactMethodDisplay(method);
              return (
                <a
                  key={method.id}
                  href={display.href}
                  target={method.contact_type === 'whatsapp' ? '_blank' : undefined}
                  rel={method.contact_type === 'whatsapp' ? 'noopener noreferrer' : undefined}
                  title={display.title}
                  class="group flex items-center space-x-3 bg-base-100 hover:bg-base-300 p-4 rounded-lg transition-colors"
                >
                  <div class="flex-shrink-0 text-primary group-hover:text-primary-focus">
                    {display.icon}
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="font-secondary font-medium text-sm text-base-content">
                      {method.name}
                    </div>
                    <div class="font-secondary text-xs text-base-content/70 truncate">
                      {display.label}
                    </div>
                  </div>
                  <div class="flex-shrink-0">
                    <svg class="w-4 h-4 text-base-content/40 group-hover:text-base-content/60" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                    </svg>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});
