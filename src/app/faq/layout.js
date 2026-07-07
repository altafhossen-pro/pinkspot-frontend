import { generateStaticMetadata, generateViewport } from '@/utils/metadata';

// Generate metadata for the FAQ page
export const metadata = generateStaticMetadata('faq');
export const viewport = generateViewport();

export default function FAQLayout({ children }) {
  return children;
}
