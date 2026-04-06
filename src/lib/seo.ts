const DEFAULT_SITE_URL = 'https://mydearpdf.online';

function normalizeSiteUrl(rawValue: string): string {
  return rawValue.endsWith('/') ? rawValue.slice(0, -1) : rawValue;
}

export function getSiteUrl(): string {
  const rawUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || DEFAULT_SITE_URL;
  return normalizeSiteUrl(rawUrl);
}

export function absoluteUrl(pathname: string): string {
  if (!pathname.startsWith('/')) {
    return `${getSiteUrl()}/${pathname}`;
  }

  return `${getSiteUrl()}${pathname}`;
}

export const CORE_SEO_KEYWORDS = [
  'mydearPDF',
  'my dear pdf',
  'merge pdf',
  'pdf merge',
  'compress pdf',
  'pdf compress',
  'merge pdf online free',
  'compress pdf online free',
  'split pdf',
  'sign pdf',
  'unlock pdf',
  'free pdf tools',
  'pdf editor online',
  'pdf converter',
  'pdf tools free',
  'online pdf editor',
];
