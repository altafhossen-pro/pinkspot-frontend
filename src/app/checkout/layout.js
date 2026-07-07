import { generateStaticMetadata, generateViewport } from '@/utils/metadata';

// Generate metadata for the checkout page
export const metadata = generateStaticMetadata('checkout');
export const viewport = generateViewport();

export default function CheckoutLayout({ children }) {
  return children;
}
