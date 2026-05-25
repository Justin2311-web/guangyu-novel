import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/author/', '/account', '/bookshelf', '/bookmarks', '/notifications', '/login', '/register', '/logout'],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
