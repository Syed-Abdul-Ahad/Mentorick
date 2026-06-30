export function getSiteUrl() {
  const configured = import.meta.env.VITE_SITE_URL;
  if (configured) {
    return configured.replace(/\/$/, '');
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  return 'http://localhost:5173';
}

export function absoluteUrl(path = '/') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getSiteUrl()}${normalizedPath}`;
}

export function resolveMediaUrl(src) {
  if (!src) return null;
  if (src.startsWith('http')) return src;

  const apiBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/api$/, '');
  return `${apiBase}${src.startsWith('/') ? src : `/${src}`}`;
}
