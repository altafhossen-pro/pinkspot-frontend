import { generateStaticMetadata, generateViewport } from '@/utils/metadata';

// Generate metadata for the contact page
export const metadata = generateStaticMetadata('contact');
export const viewport = generateViewport();

export default function ContactLayout({ children }) {
  return children;
}
