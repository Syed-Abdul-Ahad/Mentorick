import LegalPageLayout from '../../components/layout/LegalPageLayout';

const Contact = () => (
  <LegalPageLayout
    title="Contact Us"
    description="Get in touch with the Mentorick team for support, partnerships, or general inquiries."
    canonical="/contact"
  >
    <p>
      We&apos;d love to hear from you. This contact page is ready for client-provided content;
      the URL and layout will remain stable when final copy is added.
    </p>
    <section aria-labelledby="contact-email-heading">
      <h2 id="contact-email-heading" className="text-xl font-semibold text-gray-900 mt-6 mb-2">
        Email
      </h2>
      <p>
        <a href="mailto:hello@mentorick.com" className="text-primary-600 hover:underline">
          hello@mentorick.com
        </a>
      </p>
    </section>
    <section aria-labelledby="contact-support-heading">
      <h2 id="contact-support-heading" className="text-xl font-semibold text-gray-900 mt-6 mb-2">
        Support
      </h2>
      <p>
        For booking, payment, or account help, sign in and visit your dashboard. For mentor or
        mentee onboarding questions, browse our{' '}
        <a href="/our-why" className="text-primary-600 hover:underline">
          About page
        </a>{' '}
        or{' '}
        <a href="/mentors" className="text-primary-600 hover:underline">
          find a mentor
        </a>
        .
      </p>
    </section>
  </LegalPageLayout>
);

export default Contact;
