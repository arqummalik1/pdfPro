import type { MetadataRoute } from 'next';
import { VISIBLE_TOOLS } from '@/lib/tools-config';
import { absoluteUrl } from '@/lib/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl('/'),
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
  ];

  const toolRoutes: MetadataRoute.Sitemap = VISIBLE_TOOLS.map((tool) => ({
    url: absoluteUrl(`/${tool.id}`),
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticRoutes, ...toolRoutes];
}
