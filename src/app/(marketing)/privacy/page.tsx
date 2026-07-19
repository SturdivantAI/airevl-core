/**
 * Privacy Notice
 * Route: /privacy
 * Copy rendered exactly as specified in Ticket 004.
 * Company facts from brand.json legal block — no hardcoded RC/address strings.
 */

import { companyName, corporateEmail, legal } from "@/lib/brand";

export default function PrivacyNoticePage() {
  return (
    <div className="p-6 md:p-container-padding max-w-3xl mx-auto py-16">
      {/* DRAFT — Nigerian counsel review required before any formal compliance claim */}
      <div dangerouslySetInnerHTML={{ __html: "<!-- DRAFT — Nigerian counsel review required before any formal compliance claim -->" }} />

      <h1 className="font-display-lg text-display-lg text-on-surface mb-10">
        Privacy Notice
      </h1>

      <div className="space-y-8 font-body-md text-body-md text-on-surface-variant leading-relaxed">
        <section>
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-2">
            Who we are
          </h2>
          <p>
            {companyName} is a trading name of {legal.legal_name} (RC {legal.rc_number}), {legal.registered_address}.
          </p>
        </section>

        <section>
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-2">
            What we collect
          </h2>
          <p>
            When you use our contact form: your name, email address, organization (if provided), and message. We do not use this site to collect any other personal data.
          </p>
        </section>

        <section>
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-2">
            Why we collect it
          </h2>
          <p>
            To respond to your enquiry and follow up on it. That is the only purpose.
          </p>
        </section>

        <section>
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-2">
            Where it goes
          </h2>
          <p>
            Form submissions are processed by Formspree, Inc., a form-processing provider operating on infrastructure in the United States. Submitting the form transfers your data to that infrastructure.
          </p>
        </section>

        <section>
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-2">
            How long we keep it
          </h2>
          <p>
            For as long as needed to handle your enquiry, after which it is deleted from our systems.
          </p>
        </section>

        <section>
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-2">
            Your rights
          </h2>
          <p>
            Under the Nigeria Data Protection Act 2023 you may request access to, correction of, or deletion of your personal data. Contact{" "}
            <a href={`mailto:${corporateEmail}`} className="text-primary-container hover:underline">
              {corporateEmail}
            </a>{" "}
            for any request.
          </p>
        </section>

        <section>
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-2">
            Changes
          </h2>
          <p>
            We will update this notice as our data practices or the law change.
          </p>
        </section>
      </div>
    </div>
  );
}
