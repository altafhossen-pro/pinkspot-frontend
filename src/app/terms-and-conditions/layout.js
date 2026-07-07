import { generateStaticMetadata, generateViewport } from '@/utils/metadata';

// Generate metadata for the terms and conditions page
export const metadata = generateStaticMetadata('terms');
export const viewport = generateViewport();

export default function TermsLayout({ children }) {
  return children;
}
