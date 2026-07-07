import { generateStaticMetadata, generateViewport } from '@/utils/metadata';

// Generate metadata for the offers page
export const metadata = generateStaticMetadata('offers');
export const viewport = generateViewport();

export default function OffersLayout({ children }) {
  return children;
}
