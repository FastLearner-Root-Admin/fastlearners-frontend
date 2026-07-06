"use client";

import { useContext } from "react";
import Link from "next/link";
import { UserSubscriptionPlan } from "@/types";

import { SubscriptionPlan } from "@/types/index";
import { siteConfig } from "@/config/site";
import { pricingData } from "@/config/subscriptions";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { BillingFormButton } from "@/components/forms/billing-form-button";
import { ModalContext } from "@/components/modals/providers";
import { HeaderSection } from "@/components/shared/header-section";
import { Icons } from "@/components/shared/icons";
import MaxWidthWrapper from "@/components/shared/max-width-wrapper";

interface PricingCardsProps {
  userId?: string;
  subscriptionPlan?: UserSubscriptionPlan;
}

export function PricingCards({ userId, subscriptionPlan }: PricingCardsProps) {
  const isYearly = false;
  const { setShowSignInModal } = useContext(ModalContext);
  const releasePhases = [
    {
      title: "Phase One: Partial Release",
      price: "₦1,000/month",
      description:
        "Current package with English Language and General Mathematics curriculum coverage, interactive lesson notes, concept and lesson-based exercises, and progress reporting.",
    },
    {
      title: "Phase Two: Full Subjects Release",
      price: "₦3,000/month",
      description:
        "Planned September release with full subject access, complete curriculum coverage, interactive notes, exercises, and learner progress tracking.",
    },
    {
      title: "Phase Three: Full Learning Experience",
      price: "₦5,000/month",
      description:
        "Planned April 2027 release with full curriculum access, lesson videos, educational games, practice questions, quiz competition, and enhanced reporting.",
    },
  ];

  const refundExceptions = [
    "A verified duplicate charge caused by a payment processing error. First-mile bank charges cannot be refunded.",
    "A subscription cannot be activated due to a confirmed FastLearners technical fault that remains unresolved after one week.",
    "Payment is successful but no subscription benefit is provided and the issue cannot be corrected.",
    "A wrong package may be changed, with any eligible balance held for the next subscription season.",
  ];

  const PricingCard = ({ offer }: { offer: SubscriptionPlan }) => {
    const monthlyPrice =
      offer.prices.monthly > 0 ? `₦${offer.prices.monthly}` : "₦0";

    return (
      <div
        className={cn(
          "relative flex flex-col overflow-hidden rounded-xl border shadow-sm",
          offer.title.toLocaleLowerCase() === "basic"
            ? "border-2 border-primary shadow-md"
            : "",
        )}
        key={offer.title}
      >
        <div className="min-h-[150px] items-start space-y-4 bg-muted/50 p-component-md sm:p-component-lg lg:p-component-xl">
          <p className="flex font-urban text-sm font-bold uppercase tracking-wider text-muted-foreground sm:text-base">
            {offer.title}
          </p>

          <div className="flex flex-row">
            <div className="flex items-end">
              <div className="flex text-left text-2xl font-semibold leading-6 sm:text-3xl lg:text-4xl">
                {monthlyPrice}
              </div>
              {offer.prices.monthly > 0 ? (
                <div className="-mb-1 ml-2 text-left text-sm font-medium text-muted-foreground">
                  <div>/month</div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex h-full flex-col justify-between gap-16 p-component-md sm:p-component-lg lg:p-component-xl">
          <ul className="space-y-2 text-left text-sm font-medium leading-normal sm:space-y-3 sm:text-base">
            {offer.benefits.map((feature) => (
              <li className="flex items-start gap-x-3" key={feature}>
                <Icons.check className="size-5 shrink-0 text-primary" />
                <p>{feature}</p>
              </li>
            ))}

            {offer.limitations.length > 0 &&
              offer.limitations.map((feature) => (
                <li
                  className="flex items-start text-muted-foreground"
                  key={feature}
                >
                  <Icons.close className="mr-3 size-5 shrink-0" />
                  <p>{feature}</p>
                </li>
              ))}
          </ul>

          {userId && subscriptionPlan ? (
            offer.title === "Basic" && subscriptionPlan.title === "Basic" ? (
              <Link
                href="/dashboard"
                className={cn(
                  buttonVariants({
                    variant: "outline",
                  }),
                  "w-full rounded-full",
                )}
              >
                Go to dashboard
              </Link>
            ) : (
              <BillingFormButton
                year={isYearly}
                offer={offer}
                subscriptionPlan={subscriptionPlan}
              />
            )
          ) : (
            <Button
              variant={
                offer.title.toLocaleLowerCase() === "basic"
                  ? "default"
                  : "outline"
              }
              className="rounded-full"
              onClick={() => setShowSignInModal(true)}
            >
              Sign in
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <MaxWidthWrapper>
      <section className="flex flex-col items-center text-center">
        <HeaderSection label="Pricing" title="Start at full speed !" />

        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-component-lg bg-inherit py-5">
          {pricingData.map((offer) => (
            <PricingCard offer={offer} key={offer.title} />
          ))}
        </div>

        <p className="mt-3 text-balance text-center text-base text-muted-foreground">
          Email{" "}
          <a
            className="font-medium text-primary hover:underline"
            href={`mailto:${siteConfig.mailSupport}`}
          >
            {siteConfig.mailSupport}
          </a>{" "}
          to contact our support team.
        </p>
      </section>

      <section className="mx-auto mt-12 max-w-5xl space-y-8 text-left sm:mt-16">
        <div className="space-y-3 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Pricing and Refund Policy
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Current pricing and subscription terms
          </h2>
          <p className="mx-auto max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
            FastLearners subscriptions are charged in advance through approved
            payment providers. Existing subscribers will receive reasonable
            notice before any new pricing phase takes effect.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {releasePhases.map((phase) => (
            <div
              key={phase.title}
              className="rounded-xl border bg-card p-5 shadow-sm"
            >
              <p className="text-sm font-semibold text-primary">
                {phase.title}
              </p>
              <p className="mt-3 text-2xl font-bold text-foreground">
                {phase.price}
              </p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {phase.description}
              </p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 rounded-xl border bg-card p-5 shadow-sm sm:p-6 md:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-3">
            <h3 className="text-xl font-semibold text-foreground">
              Refund policy
            </h3>
            <p className="text-sm leading-6 text-muted-foreground">
              All subscription payments are generally final and non-refundable,
              including payments made due to change of mind, unused access,
              failure to cancel, or dissatisfaction after access has been
              granted.
            </p>
            <p className="text-sm leading-6 text-muted-foreground">
              Refund requests must be submitted within seven (7) days of
              payment and must include payment evidence, transaction references,
              and any information needed to verify the request.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">
              Refund exceptions may apply where:
            </p>
            <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
              {refundExceptions.map((exception) => (
                <li className="flex gap-3" key={exception}>
                  <Icons.check className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>{exception}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm leading-6 text-muted-foreground">
              Approved refunds are processed through the original payment method
              where possible. Processing time depends on the payment provider or
              bank.
            </p>
          </div>
        </div>
      </section>
    </MaxWidthWrapper>
  );
}
