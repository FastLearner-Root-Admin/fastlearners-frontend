export const metadata = {
  title: "Pricing and Refund Policy - Fastlearners",
  description:
    "Review Fastlearners subscription pricing, billing terms, refund rules, and planned pricing phases.",
};

const currentBenefits = [
  "English Language and General Mathematics curriculum coverage.",
  "Interactive lesson notes.",
  "Concept and lesson-based exercises through the test engine.",
  "Performance and progress reporting.",
];

const pricingPhases = [
  {
    phase: "Phase One: Partial Release",
    timing: "Current",
    price: "₦1,000 per month",
    details:
      "This is the current subscription package while FastLearners is in partial release.",
  },
  {
    phase: "Phase Two: Full Subjects Release",
    timing: "Planned for September",
    price: "₦3,000 per month",
    details:
      "This phase is planned to include access to all available subjects with complete curriculum coverage, interactive notes, exercises, and reporting.",
  },
  {
    phase: "Phase Three: Full Learning Experience",
    timing: "Planned for April 2027",
    price: "₦5,000 per month",
    details:
      "This phase is planned to include lesson videos, educational games, practice questions, quiz competition, and the full learning experience.",
  },
];

const plannedPackages = [
  {
    name: "Full Subjects Release - 3 Months",
    standardPrice: "₦9,000",
    discount: "10%",
    amountPayable: "₦8,100",
  },
  {
    name: "Full Release - Monthly",
    standardPrice: "₦5,000",
    discount: "None",
    amountPayable: "₦5,000",
  },
  {
    name: "Full Release - Semi-Annual",
    standardPrice: "₦30,000",
    discount: "10%",
    amountPayable: "₦27,000",
  },
  {
    name: "Full Release - Annual",
    standardPrice: "₦60,000",
    discount: "15%",
    amountPayable: "₦51,000",
  },
];

const nonRefundableCases = [
  "Change of mind after payment.",
  "No longer needing or using the service.",
  "Using the service less than expected.",
  "Failure to cancel before renewal.",
  "Dissatisfaction after access has already been granted.",
  "Selecting a wrong package, although the package may be changed where possible and any eligible balance may be held for the next subscription season.",
];

const refundExceptions = [
  "A verified duplicate charge caused by a payment processing error. First-mile bank charges cannot be refunded.",
  "The subscription cannot be activated due to a confirmed FastLearners technical fault that remains unresolved after one week.",
  "Payment is successful but no subscription benefit is provided and the issue cannot be corrected.",
  "A wrong package may be changed, with any eligible balance held for the next subscription season.",
];

export default function PricingRefundPolicyPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-10 sm:py-16 md:py-20 lg:py-24">
      <div className="space-y-8">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Pricing and Refund Policy
          </h1>
          <div className="space-y-1 text-muted-foreground">
            <p>FastLearners Limited</p>
            <p>Effective Date: 3 July 2026</p>
          </div>
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            1. Introduction
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            This policy explains the pricing structure, subscription packages,
            billing terms, refund rules, and cancellation terms for the
            FastLearners App. Our pricing is arranged in phases as the platform
            grows from partial release to the full learning experience.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            2. Current Subscription Pricing
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            The current Phase One partial-release subscription is{" "}
            <span className="font-semibold text-foreground">
              ₦1,000 per month
            </span>
            . This package currently includes:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
            {currentBenefits.map((benefit) => (
              <li key={benefit}>{benefit}</li>
            ))}
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            3. Pricing Phases
          </h2>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-muted/60 text-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Phase</th>
                  <th className="px-4 py-3 font-semibold">Timeline</th>
                  <th className="px-4 py-3 font-semibold">Price</th>
                  <th className="px-4 py-3 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pricingPhases.map((phase) => (
                  <tr key={phase.phase}>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {phase.phase}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {phase.timing}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {phase.price}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {phase.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="leading-relaxed text-muted-foreground">
            Existing subscribers will be notified at least one month before a
            new pricing phase takes effect, where applicable.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            4. Planned Subscription Packages
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            The following packages are planned for later release phases and may
            become available as more subjects and features are added.
          </p>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="bg-muted/60 text-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Package</th>
                  <th className="px-4 py-3 font-semibold">Standard Price</th>
                  <th className="px-4 py-3 font-semibold">Discount</th>
                  <th className="px-4 py-3 font-semibold">Amount Payable</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {plannedPackages.map((plan) => (
                  <tr key={plan.name}>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {plan.name}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {plan.standardPrice}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {plan.discount}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {plan.amountPayable}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            5. Billing Terms
          </h2>
          <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
            <li>Subscriptions are charged in advance.</li>
            <li>
              Payments are processed through approved payment providers.
            </li>
            <li>
              Subscriptions expire unless renewed, and auto-renewal may be
              available where supported by the payment provider.
            </li>
            <li>
              VAT, first-mile bank charges, or other provider charges may be
              added where applicable.
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            6. Refund Policy
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            All subscription payments are generally final and non-refundable.
            This means refunds will not normally be issued for:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
            {nonRefundableCases.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            7. Refund Exceptions
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            Refunds may be considered only in limited cases, including:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
            {refundExceptions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="leading-relaxed text-muted-foreground">
            Refund requests must be submitted within seven (7) days of payment
            and must include evidence of payment, transaction references, and
            any other information required to verify the request.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            8. Approved Refunds
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            Approved refunds will be processed through the original payment
            method where possible. Processing time depends on the payment
            provider or bank. FastLearners is not responsible for payment
            provider or bank delays after a refund has been approved and
            initiated.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            9. Cancellation
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            Users may cancel future renewals at any time through the supported
            payment platform or account controls where available. Cancellation
            prevents future charges but does not refund the current active
            subscription period. Access may continue until the current
            subscription expires.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            10. Pricing Changes
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            FastLearners may revise subscription pricing as the platform grows
            and more features become available. Promotional pricing, discounts,
            or temporary offers do not guarantee the same price in future
            billing periods.
          </p>
        </section>

        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <p className="mb-2 font-bold text-foreground">Contact</p>
          <p className="leading-relaxed text-muted-foreground">
            For subscription, billing, or refund enquiries, please contact the
            FastLearners support team through the support feature on the mobile
            app or web app, or email{" "}
            <a
              href="mailto:info@fastlearnersapp.com"
              className="text-primary hover:underline"
            >
              info@fastlearnersapp.com
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
