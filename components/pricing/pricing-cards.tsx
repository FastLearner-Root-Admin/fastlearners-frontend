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
          <br />
          <strong>
            Subscription billing will be finalized when the payment setup is
            connected.
          </strong>
        </p>
      </section>
    </MaxWidthWrapper>
  );
}
