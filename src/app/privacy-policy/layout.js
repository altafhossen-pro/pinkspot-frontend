import { generateStaticMetadata, generateViewport } from '@/utils/metadata';

// Generate metadata for the privacy policy page
export const metadata = generateStaticMetadata('privacy');
export const viewport = generateViewport();

export default function PrivacyLayout({ children }) {
  return children;
}
