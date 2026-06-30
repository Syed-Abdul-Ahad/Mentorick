import { Helmet } from 'react-helmet-async';
import { absoluteUrl } from '../../utils/siteUrl';

const DEFAULT_TITLE = 'Mentorick — 1:1 Video Mentorship with World-Class Leaders';
const DEFAULT_DESCRIPTION =
  'Book live 1:1 video sessions with expert mentors. Get personalized career coaching, startup advice, interview prep, and leadership guidance on Mentorick.';
const DEFAULT_OG_IMAGE = '/seo/og-home.svg';

/**
 * Per-route SEO metadata. Pass `title` without the Mentorick suffix unless
 * using `titleTemplate` style full titles (e.g. mentor profiles).
 */
const Seo = ({
  title,
  description = DEFAULT_DESCRIPTION,
  canonical,
  image = DEFAULT_OG_IMAGE,
  type = 'website',
  noindex = false,
  children,
}) => {
  const pageTitle = title || DEFAULT_TITLE;
  const canonicalUrl = canonical ? absoluteUrl(canonical) : absoluteUrl('/');
  const ogImage = image.startsWith('http') ? image : absoluteUrl(image);
  const robots = noindex ? 'noindex, nofollow' : 'index, follow';

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      <meta name="robots" content={robots} />

      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="Mentorick" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {children}
    </Helmet>
  );
};

export default Seo;
