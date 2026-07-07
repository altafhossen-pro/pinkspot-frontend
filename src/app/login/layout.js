import { generateStaticMetadata, generateViewport } from '@/utils/metadata';

// Generate metadata for the login page
export const metadata = generateStaticMetadata('login');
export const viewport = generateViewport();

export default function LoginLayout({ children }) {
  return children;
}
