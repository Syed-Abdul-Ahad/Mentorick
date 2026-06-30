const MentorProfile = require('../models/MentorProfile');

function getClientOrigin() {
  return (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
}

const STATIC_PATHS = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/mentors', changefreq: 'daily', priority: '0.9' },
  { path: '/our-why', changefreq: 'monthly', priority: '0.8' },
  { path: '/mentor-signup', changefreq: 'monthly', priority: '0.8' },
  { path: '/privacy', changefreq: 'yearly', priority: '0.3' },
  { path: '/terms', changefreq: 'yearly', priority: '0.3' },
  { path: '/contact', changefreq: 'yearly', priority: '0.5' },
];

const DISALLOWED_PATHS = [
  '/dashboard',
  '/login',
  '/signup',
  '/reset-password',
  '/sessions',
  '/my-bookings',
  '/profile',
  '/mega-sessions',
  '/admin',
  '/api',
];

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatLastMod(date) {
  if (!date) return null;
  return new Date(date).toISOString().split('T')[0];
}

exports.getRobotsTxt = (req, res) => {
  const origin = getClientOrigin();
  const isProduction = process.env.NODE_ENV === 'production';

  const lines = ['User-agent: *'];

  if (!isProduction) {
    lines.push('Disallow: /');
    lines.push('');
    lines.push('# Development environment — discourage all crawling');
    lines.push(`# Sitemap reference (for tooling): ${origin}/sitemap.xml`);
  } else {
    lines.push('Allow: /');
    for (const path of DISALLOWED_PATHS) {
      lines.push(`Disallow: ${path}`);
    }
    lines.push('');
    lines.push(`Sitemap: ${origin}/sitemap.xml`);
  }

  res.type('text/plain; charset=utf-8');
  res.send(`${lines.join('\n')}\n`);
};

exports.getSitemapXml = async (req, res, next) => {
  try {
    const origin = getClientOrigin();
    const mentors = await MentorProfile.find({})
      .select('user updatedAt')
      .lean();

    const urls = [];

    for (const entry of STATIC_PATHS) {
      urls.push({
        loc: `${origin}${entry.path}`,
        changefreq: entry.changefreq,
        priority: entry.priority,
      });
    }

    for (const mentor of mentors) {
      const mentorId = String(mentor.user);
      const lastmod = formatLastMod(mentor.updatedAt);

      urls.push({
        loc: `${origin}/mentor/${mentorId}`,
        changefreq: 'weekly',
        priority: '0.7',
        lastmod,
      });

      urls.push({
        loc: `${origin}/mentor/${mentorId}/reviews`,
        changefreq: 'weekly',
        priority: '0.5',
        lastmod,
      });
    }

    const body = urls
      .map((url) => {
        const parts = [
          '  <url>',
          `    <loc>${escapeXml(url.loc)}</loc>`,
          url.lastmod ? `    <lastmod>${url.lastmod}</lastmod>` : null,
          `    <changefreq>${url.changefreq}</changefreq>`,
          `    <priority>${url.priority}</priority>`,
          '  </url>',
        ].filter(Boolean);

        return parts.join('\n');
      })
      .join('\n');

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      body,
      '</urlset>',
    ].join('\n');

    res.type('application/xml; charset=utf-8');
    res.send(xml);
  } catch (error) {
    next(error);
  }
};
