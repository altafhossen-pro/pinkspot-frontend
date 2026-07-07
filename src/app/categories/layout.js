import { generateStaticMetadata, generateViewport } from '@/utils/metadata';

// Generate metadata for the categories page
export const metadata = generateStaticMetadata('categories');
export const viewport = generateViewport();

export default function CategoriesLayout({ children }) {
  return children;
}
