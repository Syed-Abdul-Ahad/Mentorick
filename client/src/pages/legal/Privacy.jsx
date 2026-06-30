import LegalPageLayout from '../../components/layout/LegalPageLayout';

const Privacy = () => (
  <LegalPageLayout
    title="Privacy Policy"
    description="How Mentorick collects, uses, and protects your personal information."
    canonical="/privacy"
  >
    <p>
      This page is a placeholder for Mentorick&apos;s Privacy Policy. Final legal content will be
      provided by the client and published here without changing the site structure or URLs.
    </p>
    <p>
      Mentorick respects your privacy. When you create an account, book sessions, or communicate
      with mentors, we process only the information needed to operate the platform — including
      account details, booking records, and payment-related metadata handled by our payment
      partners.
    </p>
    <p>
      For questions about privacy before the full policy is published, contact us at{' '}
      <a href="mailto:hello@mentorick.com" className="text-primary-600 hover:underline">
        hello@mentorick.com
      </a>
      .
    </p>
  </LegalPageLayout>
);

export default Privacy;
