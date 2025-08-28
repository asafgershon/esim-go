// CDN URLs for static assets
// Uses environment variable if available, otherwise defaults to production CDN

export const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || 'https://d2xwkodhgzm144.cloudfront.net';

export const CDN_LINKS = {
  privacy: `${CDN_URL}/files/privacy.pdf`,
  terms: `${CDN_URL}/files/terms.pdf`,
  about: `${CDN_URL}/files/about.pdf`,
} as const;