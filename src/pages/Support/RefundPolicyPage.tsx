import React from "react";

const RefundPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <section className="py-20 px-4 bg-[#182F38]">
        <div className="container mx-auto max-w-6xl">
          <h1 className="text-3xl md:text-4xl font-bold text-center text-white">
            Cancellation & Refund Policy
          </h1>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="bg-card border border-gray-300 rounded-xl p-6 md:p-8 shadow-sm space-y-8 text-muted-foreground">
            <p>
              9jacart.ng's Cancellation and Refund Policy is crafted to embody global best practices,
              drawing from frameworks like the EU Consumer Rights Directive and Nigeria's FCCPC
              guidelines, ensuring maximum flexibility, transparency, and protection for customers. This
              policy integrates BNPL features to allow cancellations without financial penalties where
              possible, promoting trust and accessibility for all users, including those in the diaspora.
            </p>

            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">Cancellation Guidelines</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-foreground mb-2">Pre-Shipping Cancellations</h3>
                  <p>
                    Orders can be canceled free of charge at any time before shipping (within 30 minutes of
                    placement). For BNPL orders, this results in immediate loan cancellation with no impact
                    on your credit profile.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-foreground mb-2">Post-Shipping Cancellations</h3>
                  <p className="mb-2">
                    Cancellation of orders of non-perishable goods are subject to the policy of the vendor. If
                    an order has shipped but not yet delivered, cancellations are subject to the policy of the
                    vendor provided the goods are non-perishable. Once delivered, cancellations transition
                    to our Return Policy (see Shipping and Return Policy).
                  </p>
                  <p className="font-medium text-foreground">NOTE: Perishable goods are non-refundable.</p>
                </div>

                <div>
                  <h3 className="font-medium text-foreground mb-2">Service Cancellations</h3>
                  <p className="mb-2">
                    For services (e.g., travel, laundry, ride-hailing), cancellations follow provider-specific windows:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li><strong>Travel & Tours:</strong> Cancellations are subject to the policy of the service provider.</li>
                    <li><strong>Ride-Hailing (Uber/Bolt):</strong> Refund upon cancellation is subject to the policy of the service provider.</li>
                    <li><strong>Laundry:</strong> Cancellations are free for up to 2 hours after booking. No refund during/post execution of services. Cancellations are subject to the policy of the service provider.</li>
                  </ul>
                  <p className="mt-2">
                    All cancellations are initiated via the dashboard, with instant confirmations.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-foreground mb-2">Automatic Cancellations</h3>
                  <p>
                    We reserve the right to cancel orders due to stock unavailability, pricing errors, or
                    suspected fraud, with full refunds and alternative offers provided where necessary.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">Refund Guidelines</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-foreground mb-2">Refund Eligibility</h3>
                  <p>
                    Refunds are available for cancellations, returns, overpayments, or defective/unfulfilled
                    services. Full refunds include the purchase price, shipping fees (if applicable), and any
                    transaction fees paid.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-foreground mb-2">Refund Process</h3>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Initiate via dashboard or support channels.</li>
                    <li>Processing time: 7 business days for bank transfers.</li>
                    <li>For BNPL: Refunds apply first to outstanding installments, reducing or eliminating future payments. Overpaid amounts are refunded to your linked account.</li>
                    <li>Partial refunds (e.g., for bundled orders) are calculated proportionally.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium text-foreground mb-2">Refund Methods</h3>
                  <p>
                    Refunds are issued to the original payment method (PayStack). Refunds are issued by the
                    vendors or service provider.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-foreground mb-2">Timelines and Exceptions</h3>
                  <p>
                    Refunds for defective items are prioritized within 48 hours. No refunds for used/non-returnable
                    items unless faulty. In cases of force majeure (e.g., natural disasters), refunds may be delayed
                    but communicated promptly.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-foreground mb-2">Dispute-Related Refunds</h3>
                  <p>
                    If a dispute (see Dispute Policy) results in a favorable outcome, refunds are expedited with
                    potential compensation for inconvenience (e.g., 10% bonus credit).
                  </p>
                </div>
              </div>
            </div>

            <p>
              We track refund satisfaction and aim for 100% resolution within stipulated timelines. Abuse
              of this policy may lead to restrictions.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default RefundPolicyPage;
