import Footer from '@/components/Footer/Footer';
import ProductDetails from '@/components/ProductDetails/ProductDetails';
import { generateDynamicMetadata, generateViewport } from '@/utils/metadata';
import React from 'react';

// Generate dynamic metadata for product pages
export async function generateMetadata({ params }) {
    try {
        const { productSlug } = await params;
        
        // Create a server-side API call
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
        const response = await fetch(`${API_BASE_URL}/product/slug/${productSlug}`, {
            next: { revalidate: 60 } // Cache for 60 seconds
        });
        
        if (response.ok) {
            const data = await response.json();
            
            if (data.success && data.data) {
                const product = data.data;
                
                return generateDynamicMetadata('product', {
                    productName: product.title,
                    productDescription: product.description || product.shortDescription || `Premium ${product.title} from Forpink`,
                    image: product.featuredImage || product.images?.[0] || '/images/logo.png',
                    path: `/product/${productSlug}`
                });
            }
        }
    } catch (error) {
        console.error('Error generating product metadata:', error);
    }
    
    // Fallback metadata if product not found
    return generateDynamicMetadata('product', {
        productName: 'Product Not Found',
        productDescription: 'This product may have been removed or does not exist.',
        path: `/product/${params.productSlug}`
    });
}

// Generate viewport configuration
export const viewport = generateViewport();

const page = async ({ params }) => {
    const { productSlug } = await params;
    
    return (
        <div>
            <ProductDetails productSlug={productSlug} />
            <Footer />
        </div>
    );
};

export default page;