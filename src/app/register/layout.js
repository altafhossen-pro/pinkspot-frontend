import { generateStaticMetadata, generateViewport } from '@/utils/metadata';

// Generate metadata for the register page
export const metadata = generateStaticMetadata('register');
export const viewport = generateViewport();

export default function RegisterLayout({ children }) {
  return children;
}
