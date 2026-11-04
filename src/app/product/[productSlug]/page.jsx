import Footer from '@/components/Footer/Footer';
import ProductDetails from '@/components/ProductDetails/ProductDetails';
import { generateViewport } from '@/utils/metadata';
import { buildProductMetadata, buildProductJsonLd } from '@/utils/productSeo';
import React from 'react';

// Generate dynamic metadata for product pages
export async function generateMetadata({ params }) {
    try {
        const { productSlug } = await params;
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
        
        const response = await fetch(`${API_BASE_URL}/product/slug/${productSlug}`, {
            next: { revalidate: 60 } // Cache for 60 seconds
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
                return buildProductMetadata(data.data, productSlug);
            }
        }
    } catch (error) {
        console.error('Error generating product metadata:', error);
    }

    // Fallback metadata if product not found
    return {
        title: 'Product Not Found | ForPink',
        description: 'This product may have been removed or does not exist.',
        robots: { index: false, follow: false }
    };
}

// Generate viewport configuration
export const viewport = generateViewport();

const page = async ({ params }) => {
    const { productSlug } = await params;

    // Fetch product data server-side for JSON-LD Structured Data
    let productData = null;
    try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
        const response = await fetch(`${API_BASE_URL}/product/slug/${productSlug}`, {
            next: { revalidate: 60 }
        });
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
                productData = data.data;
            }
        }
    } catch (error) {
        console.error('Error fetching product for structured data:', error);
    }

    // Generate Google Merchant Listing & Breadcrumb JSON-LD Schemas
    const schemas = productData ? buildProductJsonLd(productData, productSlug) : null;

    return (
        <div>
            {schemas?.productSchema && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas.productSchema) }}
                />
            )}
            {schemas?.breadcrumbSchema && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas.breadcrumbSchema) }}
                />
            )}
            <ProductDetails productSlug={productSlug} />
            <Footer />
        </div>
    );
};

export default page;
