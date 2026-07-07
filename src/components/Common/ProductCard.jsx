'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Heart, Star } from 'lucide-react';
import Link from 'next/link';

function ProductCard({ product, onWishlistToggle, onAddToCart, showWishlistOnHover = true }) {
    // Stock checking state
    const [stockData, setStockData] = useState(null);

    // Hover state for image change
    const [isHovered, setIsHovered] = useState(false);

    // Get hover image: variant image if multiple variants, else next gallery image
    const getHoverImage = () => {
        const variantCount = product.variants?.length || 0;

        // If multiple variants (>1), show variant image
        if (variantCount > 1) {
            // Find first variant with an image
            const variantWithImage = product.variants.find(variant => {
                if (variant.images && variant.images.length > 0) {
                    // Check if images array has objects with url property or direct URLs
                    const firstImage = variant.images[0];
                    return firstImage?.url || (typeof firstImage === 'string' ? firstImage : null);
                }
                return false;
            });

            if (variantWithImage && variantWithImage.images && variantWithImage.images.length > 0) {
                const firstImage = variantWithImage.images[0];
                // Handle both object format {url: "...", ...} and direct string URL
                const variantImage = firstImage?.url || (typeof firstImage === 'string' ? firstImage : null);
                if (variantImage) {
                    return variantImage;
                }
            }
        }

        // If single variant (===1) or no variants (===0), show next gallery image
        // (featured image is already shown, so show first gallery image)
        if (product.gallery && product.gallery.length > 0) {
            const firstGalleryImage = product.gallery[0];
            // Handle both object format {url: "...", ...} and direct string URL
            const galleryImageUrl = firstGalleryImage?.url || (typeof firstGalleryImage === 'string' ? firstGalleryImage : null);
            // Only return if it's different from the current featured image
            if (galleryImageUrl && galleryImageUrl !== product.image) {
                return galleryImageUrl;
            }
            // If first gallery image is same as featured, try next one
            if (product.gallery.length > 1) {
                const secondGalleryImage = product.gallery[1];
                return secondGalleryImage?.url || (typeof secondGalleryImage === 'string' ? secondGalleryImage : null);
            }
        }

        // Also check if product has gallery property directly (from API)
        if (product.gallery && Array.isArray(product.gallery) && product.gallery.length > 0) {
            const firstGallery = product.gallery[0];
            const galleryUrl = firstGallery?.url || (typeof firstGallery === 'string' ? firstGallery : null);
            if (galleryUrl && galleryUrl !== product.image) {
                return galleryUrl;
            }
            // If first gallery image is same as featured, try next one
            if (product.gallery.length > 1) {
                const secondGallery = product.gallery[1];
                return secondGallery?.url || (typeof secondGallery === 'string' ? secondGallery : null);
            }
        }

        return null;
    };

    const hoverImage = getHoverImage();
    const displayImage = isHovered && hoverImage ? hoverImage : product.image;

    // Simple stock checking function
    const checkStock = useCallback(() => {
        // Check if product has variants
        if (product.variants && product.variants.length > 0) {
            // For products with variants, check if ANY variant has stock
            let hasAnyStock = false;
            let totalAvailableStock = 0;
            let availableVariants = [];

            for (const variant of product.variants) {
                const variantStock = variant.stockQuantity || 0;

                if (variantStock > 0) {
                    hasAnyStock = true;
                    totalAvailableStock += variantStock;
                    availableVariants.push(variant);
                }
            }

            setStockData({
                isAvailable: hasAnyStock,
                availableStock: totalAvailableStock,
                availableVariants: availableVariants,
                reason: hasAnyStock ? 'In stock' : 'Out of stock'
            });
        } else {
            // For products without variants, check totalStock
            const totalStock = product.totalStock || 0;

            setStockData({
                isAvailable: totalStock > 0,
                availableStock: totalStock,
                reason: totalStock > 0 ? 'In stock' : 'Out of stock'
            });
        }
    }, [product.variants, product.totalStock]);

    // Check stock when component mounts
    useEffect(() => {
        checkStock();
    }, [checkStock]);

    // Check if product is out of stock
    const isOutOfStock = () => {
        // Use stock data if available
        if (stockData !== null) {
            return !stockData.isAvailable;
        }

        // Fallback to local stock data
        if (product.variants && product.variants.length > 0) {
            // For products with variants, check if ANY variant has stock
            // If no variant has stock, show out of stock
            return product.variants.every(variant => (variant.stockQuantity || 0) <= 0);
        } else {
            // For products without variants, check totalStock
            return (product.totalStock || 0) <= 0;
        }
    };

    const outOfStock = isOutOfStock();

    return (
        <Link
            href={`/product/${product.slug}`}
            className="relative group overflow-hidden rounded-xl shadow-lg border border-[#E7E7E7] hover:shadow-lg transition-all bg-[#F6F6F6] duration-300 hover:ring-1 hover:ring-[#F7AABC]"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Product Image */}
            <div className="relative aspect-[4160/5536] overflow-hidden">
                {/* <Link href={`/product/${product.slug}`} className="block w-full h-full relative">

                    <img
                        src={product.image}
                        alt={product.name}
                        className={`absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-all duration-600 ease-in-out ${isHovered && hoverImage ? 'opacity-0' : 'opacity-100'
                            }`}
                    />

                    {hoverImage && (
                        <img
                            src={hoverImage}
                            alt={product.name}
                            className={`absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-all duration-600 ease-in-out ${isHovered ? 'opacity-100' : 'opacity-0'
                                }`}
                        />
                    )}
                </Link> */}

                <div className="block w-full h-full relative">

                    <img
                        src={product.image}
                        alt={product.name}
                        className={`absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-all duration-600 ease-in-out ${isHovered && hoverImage ? 'opacity-0' : 'opacity-100'
                            }`}
                    />

                    {hoverImage && (
                        <img
                            src={hoverImage}
                            alt={product.name}
                            className={`absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-all duration-600 ease-in-out ${isHovered ? 'opacity-100' : 'opacity-0'
                                }`}
                        />
                    )}
                </div>


                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onWishlistToggle(product.id);
                    }}
                    className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-300 cursor-pointer ${product.isWishlisted
                        ? 'bg-pink-500 text-white'
                        : 'bg-white/80 text-gray-600 hover:bg-gray-200 cursor-pointer hover:text-black'
                        }`}
                    aria-label={product.isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
                >
                    <Heart className={`w-4 h-4 ${product.isWishlisted ? 'fill-current' : ''}`} />
                </button>
            </div>

            {/* Product Info */}
            <div className="p-3 sm:p-4 ">
                <div className='flex items-center justify-between mb-2'>
                    {/* <Link href={`/product/${product.slug}`} className="flex-1 mr-2">
                        <h3 className="text-gray-800 text-sm sm:text-base lg:text-lg leading-tight overflow-hidden" style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical'
                        }}>
                            {product.name}
                        </h3>
                    </Link> */}
                    <div className="flex-1 mr-2">
                        <h3 className="text-gray-800 text-sm sm:text-base lg:text-lg leading-tight overflow-hidden" style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical'
                        }}>
                            {product.name}
                        </h3>
                    </div>

                </div>

                {/* Price */}
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm sm:text-lg text-pink-500">{product?.price ?? 0} BDT</span>
                    {product?.originalPrice && (
                        <span className="text-gray-500 line-through text-xs sm:text-sm">{product?.originalPrice ? product?.originalPrice : 0} BDT</span>
                    )}
                </div>

                {/* Add to Cart Button 
                {outOfStock ? (
                    <button
                        disabled
                        className="w-full py-2 sm:py-3 px-3 sm:px-4 cursor-not-allowed rounded-lg font-semibold text-xs sm:text-sm transition-all duration-300 border border-gray-300 text-gray-500 bg-gray-100"
                        aria-label={`${product.name} is out of stock`}
                    >
                        Out of Stock
                    </button>
                ) : (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onAddToCart(product.id);
                        }}
                        className="w-full py-2 sm:py-3 px-3 sm:px-4 cursor-pointer rounded-lg font-semibold text-xs sm:text-sm transition-all duration-300 border border-[#EF3D6A] text-[#EF3D6A] hover:bg-[#EF3D6A] hover:text-white"
                        aria-label={`Add ${product.name} to cart`}
                    >
                        Add to cart
                    </button>
                )}
                    */}
            </div>
        </Link>
    );
}

export default ProductCard;
