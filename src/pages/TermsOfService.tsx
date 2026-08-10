import React from 'react';

export default function TermsOfService() {
  return (
    <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-12">
      <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Effective Date: 10 August 2026
      </p>

      <div className="space-y-8 text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            1. About Bhavya Printers
          </h2>
          <p>
            Bhavya Printers, based in Bharuch, Gujarat, provides printing and
            stationery products through its online ordering platform.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            2. User Accounts
          </h2>
          <p>
            Customers are responsible for providing accurate information and
            maintaining the security of their account credentials.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            3. Orders and Pricing
          </h2>
          <p>
            Product prices and applicable taxes are displayed during the
            ordering process. We reserve the right to correct pricing or
            availability errors.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            4. Payments
          </h2>
          <p>
            Payments may be processed through third-party payment service
            providers. Payment status may be updated after confirmation from
            the payment provider.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            5. Delivery
          </h2>
          <p>
            Products are delivered to the address provided during checkout.
            Delivery times may vary depending on product availability and
            delivery location.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            6. Contact
          </h2>
          <p>
            Email: bhavyaprinters21@gmail.com
          </p>
          <p>
            Phone: +91 9825024751
          </p>
        </section>
      </div>
    </div>
  );
}