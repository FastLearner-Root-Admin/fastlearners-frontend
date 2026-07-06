import React from "react";

export const metadata = {
  title: "Terms of Service - Fastlearners",
  description:
    "Read our Terms of Service to understand the rules and regulations for using the Fastlearners App.",
};

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-10 sm:py-16 md:py-20 lg:py-24">
      <div className="space-y-8">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Terms of Service (TOS)
          </h1>
          <div className="flex flex-col space-y-1 text-muted-foreground">
            <p>Effective Date: 10 April 2026</p>
          </div>
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            1. Acceptance of Terms
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            Welcome to FastLearners. By accessing or using the FastLearners
            website and mobile application (collectively, the
            &quot;Platform&quot;), you agree to be bound by these Terms of
            Service (&quot;Terms&quot;). If you do not agree to these Terms, you
            must not use the Platform.
          </p>
          <p className="leading-relaxed text-muted-foreground">
            These Terms form a legally binding agreement between you and
            FastLearners Limited (&quot;FastLearners&quot;, &quot;we&quot;,
            &quot;our&quot;, or &quot;us&quot;).
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            2. Eligibility and Children&apos;s Use
          </h2>
          <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
            <li>
              You must be at least 18 years old to use the Platform
              independently.
            </li>
            <li>
              Parents or legal guardians are fully responsible for supervising
              their Child&apos;s use of the Platform, including all activities,
              communications, and content accessed or created by the Minor.
            </li>
            <li>
              We strongly encourage parents/guardians to review our
              Children&apos;s Data Protection Policy and Privacy Policy before
              granting consent.
            </li>
          </ul>
          <p className="font-medium italic text-muted-foreground">
            Note: We do not assume that payment alone automatically constitutes
            parental consent.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            3. User Responsibilities
          </h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="font-medium text-muted-foreground">You agree to:</p>
              <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
                <li>
                  Provide accurate, current, and complete information during
                  registration.
                </li>
                <li>
                  Maintain the confidentiality of your login credentials and
                  account security.
                </li>
                <li>
                  Use the Platform only for lawful, legitimate educational
                  purposes.
                </li>
                <li>
                  Comply with all applicable laws, including the{" "}
                  <span className="font-medium text-foreground">
                    Nigeria Data Protection Act 2023
                  </span>
                  .
                </li>
              </ul>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-muted-foreground">You must not:</p>
              <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
                <li>
                  Copy, reproduce, modify, distribute, or publicly display any
                  of our educational content, materials, or software without
                  prior written permission.
                </li>
                <li>
                  Reverse engineer any part of the Platform or its content.
                </li>
                <li>
                  Upload or transmit any harmful code, viruses, or content that
                  violates these Terms or infringes third-party rights.
                </li>
                <li>
                  Use automated tools (bots, scrapers, etc.) to access or
                  collect data from the Platform without our consent.
                </li>
                <li>
                  Interfere with or disrupt the security and performance of the
                  Platform.
                </li>
                <li>
                  Use FastLearners for purposes of cheating, academic
                  malpractice, or any other unethical behaviour.
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            4. Intellectual Property
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            All content on the Platform, including but not limited to text,
            graphics, logos, educational materials, videos, software, and
            designs, is the exclusive property of FastLearners Limited or its
            licensors and is protected by copyright, trademark, and other
            intellectual property laws.
          </p>
          <p className="leading-relaxed text-muted-foreground">
            We grant you a limited, non-exclusive, non-transferable, revocable
            licence to use the Platform for personal, non-commercial educational
            purposes only. Any unauthorised use of our intellectual property
            will constitute a breach of these Terms and may result in
            termination of your account and legal action.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            5. Notification Retention
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            FastLearners may retain in-app and account notifications for a
            period of three (3) to six (6) months for user access, service
            continuity, audit, support, and platform management purposes.
            Notifications are not deleted from our system for at least three
            (3) months unless deletion is required by law, security, or
            operational necessity.
          </p>
          <p className="leading-relaxed text-muted-foreground">
            Users may delete notifications from their own account or
            notification centre where this feature is available. We may also
            carry out routine database cleanup of notifications after the
            applicable three (3) to six (6) month retention period, subject to
            any legal, compliance, security, or dispute-resolution obligations.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            6. Third-Party Services
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            The Platform may integrate or link to third-party services (e.g.,
            payment processors, hosting providers, or external educational
            resources). We are not responsible for the practices or content of
            any third parties, and your use of such services is governed by
            their respective terms and privacy policies.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            7. Termination and Suspension
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            We reserve the right to suspend or terminate your account and access
            to the Platform at our sole discretion, without notice, if:
          </p>
          <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
            <li>You breach any provision of these Terms.</li>
            <li>We suspect fraudulent, abusive, or unlawful activity.</li>
            <li>
              Your continued use poses a risk to the Platform, other users, or
              our compliance obligations.
            </li>
          </ul>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Upon termination, your right to use the Platform will cease
            immediately. Any provisions of these Terms that by their nature
            should survive termination shall survive, including intellectual
            property rights, warranty disclaimers, and limitations of liability.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            8. Disclaimer of Warranties
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            The Platform is provided on an &quot;as is&quot; and &quot;as
            available&quot; basis, without any warranties of any kind, either
            express or implied. We do not guarantee that the Platform will be
            uninterrupted, error-free, or free of viruses or other harmful
            components. We do not warrant the accuracy, completeness, or
            usefulness of any educational content provided.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            9. Limitation of Liability
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            To the maximum extent permitted by law, FastLearners Limited and its
            directors, employees, or partners shall not be liable for any
            indirect, incidental, special, consequential, or punitive damages,
            including loss of profits, data, use, or goodwill, resulting from
            your access to or use of (or inability to use) the Platform.
          </p>
          <p className="leading-relaxed text-muted-foreground">
            Our total liability for any claims arising out of or related to
            these Terms or the Platform shall not exceed the total amount you
            paid to us in the twelve (12) months preceding the claim.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            10. Governing Law and Dispute Resolution
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            These Terms shall be governed by and construed in accordance with
            the laws of the Federal Republic of Nigeria.
          </p>
          <p className="leading-relaxed text-muted-foreground">
            Any disputes arising under or in connection with these Terms shall
            be subject to the exclusive jurisdiction of the courts of Nigeria.
          </p>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            We are committed to processing data in compliance with the Nigeria
            Data Protection Act 2023. For more details on how we handle data,
            please refer to our{" "}
            <a href="/privacy-policy" className="text-primary hover:underline">
              Privacy Policy
            </a>
            ,{" "}
            <a
              href="/childrens-data-protection-policy"
              className="text-primary hover:underline"
            >
              Children&apos;s Data Protection Policy
            </a>
            , and{" "}
            <a
              href="/data-breach-policy"
              className="text-primary hover:underline"
            >
              Data Breach Response Policy
            </a>
            .
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            11. Changes to These Terms
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            We may update these Terms from time to time. We will notify you of
            any material changes by posting the revised Terms on this page and
            updating the effective date. Your continued use of the Platform
            after such changes constitutes your acceptance of the new Terms.
          </p>
        </section>

        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <p className="mb-2 font-bold text-foreground">FastLearners Limited</p>
          <div className="space-y-1 text-muted-foreground">
            <p>Data Protection Officer: Oladele Joshua O.</p>
            <p>
              Email:{" "}
              <a
                href="mailto:joshua.oladele@fastlearnersapp.com"
                className="text-primary hover:underline"
              >
                joshua.oladele@fastlearnersapp.com
              </a>
            </p>
            <p>
              Support:{" "}
              <a
                href="mailto:support@fastlearnersapp.com"
                className="text-primary hover:underline"
              >
                support@fastlearnersapp.com
              </a>
            </p>
            <p>Telephone: +234 706 544 7436</p>
            <p>
              Address: 3 Chief Aaron Nteubong Street, Okorombokho, Eastern
              Obolo, Akwa Ibom State, Nigeria
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
