import { generateStaticMetadata, generateViewport } from '@/utils/metadata';

// Generate metadata for the search page
export const metadata = generateStaticMetadata('search');
export const viewport = generateViewport();

export default function SearchLayout({ children }) {
  return children;
}
