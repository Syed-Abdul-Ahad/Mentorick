import { absoluteUrl } from '../utils/siteUrl';
import { ORGANIZATION } from '../config/organization';
import { HOMEPAGE_FAQS } from '../config/homepageFaqs';

export function buildOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: ORGANIZATION.name,
    legalName: ORGANIZATION.legalName,
    url: absoluteUrl('/'),
    logo: absoluteUrl(ORGANIZATION.logoPath),
    description: ORGANIZATION.description,
    email: ORGANIZATION.email,
    ...(ORGANIZATION.sameAs.length > 0 && { sameAs: ORGANIZATION.sameAs }),
  };
}

export function buildWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: ORGANIZATION.name,
    url: absoluteUrl('/'),
    description: ORGANIZATION.description,
    publisher: {
      '@type': 'Organization',
      name: ORGANIZATION.name,
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl(ORGANIZATION.logoPath),
      },
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${absoluteUrl('/mentors')}?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function buildFaqPageSchema(faqs = HOMEPAGE_FAQS) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function buildPersonSchema({ fullName, title, about, headshotUrl, topics = [], socialLinks = {}, mentorId }) {
  const sameAs = [socialLinks.linkedin, socialLinks.twitter, socialLinks.instagram].filter(Boolean);

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: fullName,
    jobTitle: title,
    description: about,
    url: absoluteUrl(`/mentor/${mentorId}`),
    ...(headshotUrl && { image: headshotUrl }),
    worksFor: {
      '@type': 'Organization',
      name: ORGANIZATION.name,
      url: absoluteUrl('/'),
    },
    ...(topics.length > 0 && {
      knowsAbout: topics,
    }),
    ...(sameAs.length > 0 && { sameAs }),
  };
}

export function buildBreadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
