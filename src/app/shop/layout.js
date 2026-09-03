import { generateStaticMetadata, generateViewport } from '@/utils/metadata';

// Disable Next.js Router Cache for shop page
// This ensures category changes always fetch fresh data instead of showing cached page
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Generate metadata for the shop page
export const metadata = generateStaticMetadata('shop');
export const viewport = generateViewport();

export default function ShopLayout({ children }) {
  return children;
}
