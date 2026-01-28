import React from "react";

const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header section styled like "What Sets Us Apart" */}
      <section className="py-20 px-4 bg-[#182F38]">
        <div className="container mx-auto max-w-6xl">
          <h1 className="text-3xl md:text-4xl font-bold text-center text-white">
            Terms and Condition
          </h1>
        </div>
      </section>

      {/* Centered content container with gray border */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="bg-card border border-gray-300 rounded-xl p-6 md:p-8 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">
              What are the terms and conditions regarding poorly delivered goods or services?
            </h2>
            <p className="text-muted-foreground mb-4">
              If a product is delivered damaged, defective, or not as described, you must report it
              within the stipulated return window (within 24–72 hours).
            </p>

            <p className="text-muted-foreground mb-2">
              You may be required to provide the following:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground mb-4">
              <li>Proof of purchase (order number or receipt)</li>
              <li>Photos/videos of the damaged or incorrect item</li>
            </ul>

            <p className="text-muted-foreground mb-2">
              Once verified, you may be eligible for:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground mb-4">
              <li>A replacement</li>
              <li>A refund</li>
              <li>Store credit</li>
            </ul>

            <p className="text-muted-foreground">
              Items damaged due to customer misuse or after the return period may not be eligible.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TermsPage;

