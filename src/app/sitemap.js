import { siteConfig } from '@/config/siteConfig';

export default async function sitemap() {
  const baseUrl = siteConfig.url || 'https://pinkspot.bd';
  
  // 1. Static Pages
  const staticRoutes = [
    '',
    '/shop',
    '/categories',
    '/offers',
    '/contact-us',
    '/privacy-policy',
    '/return-refund-policy',
    '/terms-and-conditions',
    '/faq',
    '/tracking',
    '/videos'
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : 0.8,
  }));

  // 2. Dynamic Product Pages
  let productRoutes = [];
  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
    
    // Fetch ONLY product slugs and update dates using the lean endpoint
    const res = await fetch(`${API_BASE_URL}/product/sitemap-slugs`, {
      next: { revalidate: 3600 } // Cache sitemap API response for 1 hour
    });
    
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        productRoutes = data.data.map((product) => ({
          url: `${baseUrl}/product/${product.slug}`,
          lastModified: product.updatedAt ? new Date(product.updatedAt).toISOString() : new Date().toISOString(),
          changeFrequency: 'weekly',
          priority: 0.9,
        }));
      }
    }
  } catch (error) {
    console.error('Error fetching products for sitemap:', error);
  }

  // Combine and return all routes for the sitemap
  return [...staticRoutes, ...productRoutes];
}
