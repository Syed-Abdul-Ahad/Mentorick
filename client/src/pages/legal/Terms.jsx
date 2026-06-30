import LegalPageLayout from '../../components/layout/LegalPageLayout';

const Terms = () => (
  <LegalPageLayout
    title="Terms of Service"
    description="Terms and conditions for using the Mentorick mentorship platform."
    canonical="/terms"
  >
    <p>
      This page is a placeholder for Mentorick&apos;s Terms of Service. Final legal content will be
      provided by the client and published here without changing the site structure or URLs.
    </p>
    <p>
      By using Mentorick, you agree to book sessions in good faith, respect mentor time, and follow
      community guidelines. Mentors and mentees are responsible for attending scheduled sessions and
      complying with applicable laws in their jurisdiction.
    </p>
    <p>
      For questions about terms before the full document is published, contact us at{' '}
      <a href="mailto:hello@mentorick.com" className="text-primary-600 hover:underline">
        hello@mentorick.com
      </a>
      .
    </p>
  </LegalPageLayout>
);

export default Terms;
