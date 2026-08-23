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
                    productDescription: product.description || product.shortDescription || `Premium ${product.title} from Pinkspot`,
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

    // Generate JSON-LD Schema
    let jsonLd = null;
    if (productData) {
        // Find correct price and stock based on DB schema
        const currentPrice = productData.variants?.[0]?.currentPrice || productData.basePrice || 0;
        const inStock = (productData.totalStock > 0) || (productData.variants && productData.variants.some(v => v.stockQuantity > 0));
        const imageUrl = productData.featuredImage || (productData.gallery && productData.gallery[0]?.url) || "https://pinkspot.bd/images/logo.png";

        jsonLd = {
            "@context": "https://schema.org",
            "@type": "Product",
            "name": productData.title,
            "image": imageUrl,
            "description": productData.shortDescription || productData.description || `Premium ${productData.title} from Pinkspot`,
            "sku": productData.slug,
            "offers": {
                "@type": "Offer",
                "url": `https://pinkspot.bd/product/${productSlug}`,
                "priceCurrency": "BDT",
                "price": currentPrice,
                "availability": inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                "itemCondition": "https://schema.org/NewCondition"
            }
        };
    }

    return (
        <div>
            {jsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            )}
            <ProductDetails productSlug={productSlug} />
            <Footer />
        </div>
    );
};

export default page;