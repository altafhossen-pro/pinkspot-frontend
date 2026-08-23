import { siteConfig } from '@/config/siteConfig';

export default function robots() {
  const baseUrl = siteConfig.url || 'https://pinkspot.bd';
  
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',          // Block admin dashboard
        '/api/',            // Block direct API access
        '/user/',           // Block user account pages
        '/checkout',        // Block checkout process
        '/order-confirmation' // Block sensitive order success pages
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
