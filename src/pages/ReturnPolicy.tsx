import React from 'react';

export default function ReturnPolicy() {
  return (
    <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-12">
      <h1 className="text-3xl font-bold mb-2">
        Returns & Refunds
      </h1>

      <p className="text-sm text-muted-foreground mb-8">
        Effective Date: 10 August 2026
      </p>

      <div className="space-y-8 text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            1. Eligible Returns
          </h2>
          <p>
            A return or replacement may be considered where products are
            damaged, defective, incorrectly supplied or materially different
            from the products ordered.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            2. Customized Products
          </h2>
          <p>
            Customized or specially manufactured products generally cannot be
            returned simply because the customer changes their mind, provided
            the products were manufactured according to the confirmed
            specifications.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            3. Requesting a Return
          </h2>
          <p>
            Contact us with your Order ID, product details and a description
            of the issue. Photographs may be requested where applicable.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            4. Refunds
          </h2>
          <p>
            If a refund is approved, it will generally be processed through
            the original payment method where technically possible.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            5. Payment Failure
          </h2>
          <p>
            If a payment fails but money has been debited, contact us with
            your Order ID and payment details. We will verify the payment
            status and take appropriate action.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            6. Contact
          </h2>
          <p>Email: bhavyaprinters21@gmail.com</p>
          <p>Phone: +91 9825024751</p>
        </section>
      </div>
    </div>
  );
}