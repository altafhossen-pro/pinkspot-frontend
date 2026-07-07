import { generateStaticMetadata, generateViewport } from '@/utils/metadata';

// Generate metadata for the shop page
export const metadata = generateStaticMetadata('shop');
export const viewport = generateViewport();

export default function ShopLayout({ children }) {
  return children;
}
