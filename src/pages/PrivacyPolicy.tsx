import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-12">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>

      <p className="text-sm text-muted-foreground mb-8">
        Effective Date: 10 August 2026
      </p>

      <div className="space-y-8 text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            1. Information We Collect
          </h2>
          <p>
            Depending on how you use our website, we may collect information
            such as your name, email address, mobile number, bank information,
            GST number, PAN number, address and order information.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            2. How We Use Your Information
          </h2>
          <p>
            We use information to manage accounts, process orders, process
            payments, provide customer support, deliver products, prevent
            fraud and comply with applicable legal requirements.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            3. Payment Information
          </h2>
          <p>
            Online payments may be processed through third-party payment
            service providers. We do not intend to store complete payment
            credentials such as card numbers, CVVs or banking passwords on
            our servers.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            4. Data Security
          </h2>
          <p>
            We use reasonable technical and organizational measures to protect
            personal information against unauthorized access, alteration,
            disclosure or destruction.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            5. Contact
          </h2>
          <p>Email: bhavyaprinters21@gmail.com</p>
          <p>Phone: +91 9825024751</p>
        </section>
      </div>
    </div>
  );
}