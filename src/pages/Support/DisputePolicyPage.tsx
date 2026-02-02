import React from "react";

const DisputePolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <section className="py-20 px-4 bg-[#182F38]">
        <div className="container mx-auto max-w-6xl">
          <h1 className="text-3xl md:text-4xl font-bold text-center text-white">
            Dispute Resolution Policy
          </h1>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="bg-card border border-gray-300 rounded-xl p-6 md:p-8 shadow-sm space-y-8 text-muted-foreground">
            <p>
              Our Dispute Resolution Policy at 9jacart.ng adheres to global standards such as the
              UNCITRAL Model Law on International Commercial Conciliation and Nigeria's Arbitration
              and Mediation Act 2023, emphasizing fair, efficient, and accessible mechanisms. We
              prioritize amicable resolutions to maintain customer trust.
            </p>

            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">Dispute Types and Initiation</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-foreground mb-2">Covered Disputes</h3>
                  <p>
                    Include issues related to product quality, delivery delays, billing errors, unauthorized
                    transactions, or service failures. Excludes third-party disputes (e.g., with ride-hailing
                    providers), which are escalated to them.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-foreground mb-2">Initiation Process</h3>
                  <p className="mb-2">
                    Raise disputes within 30 days of the issue via:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>User dashboard</li>
                    <li>Email (disputes@9jacart.ng) or hotline</li>
                  </ul>
                  <p className="mt-2">
                    Provide details, evidence (e.g., photos, receipts), and desired outcome.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">Resolution Steps</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-foreground mb-2">Step 1: Internal Review (Tier 1)</h3>
                  <p>
                    Our support team acknowledges within 24 hours and investigates within 3 business days.
                    Customer must respond with evidence within 1 business day. Resolutions include refunds,
                    replacements, or credits.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-foreground mb-2">Step 2: Escalation (Tier 2)</h3>
                  <p>
                    If unresolved, escalate to a senior mediator within 5 business days for a binding internal
                    decision, incorporating customer feedback.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-foreground mb-2">Step 3: Mediation/Arbitration (Tier 3)</h3>
                  <p>
                    For complex cases, we support mediation via independent neutrals (e.g., Lagos Multi-Door
                    Courthouse). If needed, binding arbitration under Nigerian law, with costs shared between
                    customer and vendor without prejudice to the independence of 9jaCart Limited.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-foreground mb-2">Legal Recourse</h3>
                  <p>
                    If arbitration fails, disputes are resolved in courts with appropriate jurisdiction under
                    Nigerian law. Class actions are absolutely waived.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-foreground mb-2">Timelines and Protections</h3>
                  <p>
                    Full resolution targeted within 14–30 days. Customers receive updates every 5 days.
                    Confidential data is protected per our Privacy Policy.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-foreground mb-2">Fraud and Abuse</h3>
                  <p>
                    Frivolous disputes may result in account termination and/or legal action, but we assume
                    good faith unless proven otherwise.
                  </p>
                </div>
              </div>
            </div>

            <p>
              This policy ensures equitable outcomes, with a 95%+ resolution rate in internal tiers.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DisputePolicyPage;
