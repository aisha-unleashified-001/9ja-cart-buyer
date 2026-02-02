import React from "react";

const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <section className="py-20 px-4 bg-[#182F38]">
        <div className="container mx-auto max-w-6xl">
          <h1 className="text-3xl md:text-4xl font-bold text-center text-white">
            Terms & Conditions (T&apos;s & C&apos;s)
          </h1>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="bg-card border border-gray-300 rounded-xl p-6 md:p-8 shadow-sm space-y-8 text-muted-foreground">
            <p>
              These Terms and Conditions (&quot;Terms&quot;) govern your use of 9jacart.ng, operated by 9jacart.ng
              Limited in Lagos, Nigeria. By accessing or using our platform, you agree to these Terms, which
              incorporate global best practices from bodies like the OECD Guidelines for Consumer Protection
              in E-Commerce and Nigerian laws (e.g., Cybercrimes Act, FCCPC Act). These Terms form a
              binding contract and supersede prior agreements.
            </p>

            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">1. User Eligibility and Accounts</h2>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Users must be 18+ and provide accurate information. Accounts are non-transferable; we may suspend for violations (e.g., fraud).</li>
                <li>Diaspora users agree to comply with international laws; currency conversions use real-time rates.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">2. Purchases and BNPL</h2>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>All listings are offers to purchase; acceptance occurs upon order confirmation.</li>
                <li><strong>BNPL:</strong> Subject to credit checks; flexible plans (e.g., 0–5 months installmental payment) with transparent fees based on vendor's or creditor's policy (disclosed upfront). Late payments incur fees (up to 1% daily, capped); defaults may affect credit scores via partners.</li>
                <li>Prices include taxes; errors are corrected with notice.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">3. Intellectual Property and Content</h2>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Platform content is owned by us or licensors; limited personal use granted.</li>
                <li>User-generated content (e.g., reviews) grants us perpetual license.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">4. Security and Privacy</h2>
              <p>
                We use AES-256 encryption and fraud detection. Data is handled per our Privacy Policy
                (GDPR-inspired), with consent for diaspora transfers.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">5. Liabilities and Disclaimers</h2>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>We disclaim warranties beyond express ones; liability limited to order value.</li>
                <li>Force majeure excuses performance delays.</li>
                <li>Indemnify us against misuse.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">6. Governing Law and Amendments</h2>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Governed by Nigerian law; disputes per Section 3 (Dispute Resolution Policy).</li>
                <li>We may amend Terms with 30 days' notice; continued use constitutes acceptance.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">7. Miscellaneous</h2>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Entire agreement; severability applies.</li>
                <li><strong>Contact:</strong> support@9jacart.ng</li>
              </ul>
            </div>

            <p>
              By using 9jacart.ng, you acknowledge reading and agreeing to these Terms.
            </p>
            <p className="text-sm text-muted-foreground/80">
              Last updated: January 29, 2026.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TermsPage;
