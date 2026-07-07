'use client';

import React, { useState, useEffect, useCallback } from 'react';
import ProductCard from '@/components/Common/ProductCard';
import { productAPI, transformProductData } from '@/services/api';
import { useAppContext } from '@/context/AppContext';
import { addProductToCart } from '@/utils/cartUtils';
import { addProductToWishlist } from '@/utils/wishlistUtils';

export default function JustForYou() {
    const { addToCart, addToWishlist, wishlist } = useAppContext();
    const [products, setProducts] = useState([]);
    const [displayedProducts, setDisplayedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);
    const [hasMoreAvailable, setHasMoreAvailable] = useState(true); // Track if more products are available
    const [initialLoadCount] = useState(15); // Initial products to show (15 for desktop, will show 2 on mobile via CSS)
    const [loadMoreCount] = useState(10); // Products to load per "Show More" click

    // Fetch random products on component mount
    useEffect(() => {
        fetchRandomProducts();
    }, []);

    // Update displayed products only on initial load
    useEffect(() => {
        if (products.length > 0 && displayedProducts.length === 0) {
            setDisplayedProducts(products.slice(0, initialLoadCount));
        }
    }, [products, displayedProducts.length, initialLoadCount]);

    // Update products wishlist state when global wishlist changes
    useEffect(() => {
        if (products.length > 0) {
            setProducts(prev => prev.map(product => ({
                ...product,
                isWishlisted: wishlist.some(item => item.productId === product._id)
            })));
        }
    }, [wishlist]);

    const fetchRandomProducts = async (excludeIds = []) => {
        try {
            setLoading(true);
            setError(null);
            // Fetch initial products (15) and some extra to support "Show More" functionality
            const data = await productAPI.getRandomProducts(25, excludeIds);

            if (data.success) {
                const productsData = data.data || [];
                const transformedProducts = productsData.map(product => ({
                    ...transformProductData(product),
                    variants: product.variants || [],
                    _id: product._id,
                    title: product.title,
                    slug: product.slug,
                    featuredImage: product.featuredImage,
                    totalStock: product.totalStock || 0,
                    isWishlisted: wishlist.some(item => item.productId === product._id)
                }));
                setProducts(transformedProducts);
            } else {
                setError('Failed to load products');
            }
        } catch (error) {
            console.error('Error fetching random products:', error);
            setError('Unable to load products');
        } finally {
            setLoading(false);
        }
    };

    const handleShowMore = async () => {
        const currentCount = displayedProducts.length;
        const nextCount = currentCount + loadMoreCount;

        // If we have more products in the fetched list, show them
        if (nextCount <= products.length) {
            setDisplayedProducts(products.slice(0, nextCount));
        } else {
            // Otherwise, fetch more random products excluding already loaded ones
            try {
                setLoadingMore(true);

                // Get all currently loaded product IDs to exclude
                const excludeIds = products.map(p => p._id);

                // Fetch new products excluding already loaded ones
                const data = await productAPI.getRandomProducts(loadMoreCount, excludeIds);

                if (data.success) {
                    const productsData = data.data || [];
                    const transformedProducts = productsData.map(product => ({
                        ...transformProductData(product),
                        variants: product.variants || [],
                        _id: product._id,
                        title: product.title,
                        slug: product.slug,
                        featuredImage: product.featuredImage,
                        totalStock: product.totalStock || 0,
                        isWishlisted: wishlist.some(item => item.productId === product._id)
                    }));

                    // Add new products to existing list
                    if (transformedProducts.length > 0) {
                        const updatedProducts = [...products, ...transformedProducts];
                        setProducts(updatedProducts);
                        setDisplayedProducts(updatedProducts.slice(0, nextCount));
                    } else {
                        // No more products available, show all we have and hide button
                        setDisplayedProducts(products.slice(0, products.length));
                        setHasMoreAvailable(false);
                    }
                }
            } catch (error) {
                console.error('Error loading more products:', error);
            } finally {
                setLoadingMore(false);
            }
        }
    };

    const handleWishlistToggle = (productId) => {
        const product = products.find(p => p.id === productId || p._id === productId);
        if (product) {
            addProductToWishlist(product, addToWishlist);
        }
    };

    const handleAddToCart = useCallback((productId) => {
        const selectedProduct = products.find(p => p.id === productId || p._id === productId);
        if (selectedProduct) {
            addProductToCart(selectedProduct, addToCart, 1);
        }
    }, [products, addToCart]);

    // Show "Show More" button if:
    // 1. We have more products in local state that aren't displayed yet, OR
    // 2. We haven't exhausted all available products yet
    const hasMoreProducts = (displayedProducts.length < products.length || hasMoreAvailable) && products.length > 0;

    return (
        <section className="py-4 sm:py-12 px-4 bg-white">
            <div className="max-w-screen-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-6 sm:mb-8">
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-4">
                        Just for you
                    </h2>
                </div>

                {/* Products Grid - 2 columns on mobile, 5 columns on desktop */}
                {loading ? (
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
                        {[...Array(15)].map((_, index) => (
                            <div key={index} className="animate-pulse">
                                <div className="bg-gray-200 rounded-lg h-64 mb-4"></div>
                                <div className="bg-gray-200 h-4 rounded mb-2"></div>
                                <div className="bg-gray-200 h-4 rounded w-2/3"></div>
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="text-center py-8 sm:py-12">
                        <div className="max-w-md mx-auto px-4">
                            <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">Unable to Load Products</h3>
                            <p className="text-sm sm:text-base text-gray-600 mb-4">{error}</p>
                            <button
                                onClick={fetchRandomProducts}
                                className="bg-pink-500 text-white px-4 sm:px-6 py-2 rounded-lg font-semibold text-sm hover:bg-pink-600 transition-colors cursor-pointer"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                ) : displayedProducts.length > 0 ? (
                    <>
                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
                            {displayedProducts.map((product) => (
                                <ProductCard
                                    key={product.id || product._id}
                                    product={product}
                                    onWishlistToggle={handleWishlistToggle}
                                    onAddToCart={handleAddToCart}
                                    showWishlistOnHover={true}
                                />
                            ))}
                        </div>

                        {/* Show More Button */}
                        {hasMoreProducts && (
                            <div className="text-center mt-8 sm:mt-12">
                                <button
                                    onClick={handleShowMore}
                                    disabled={loadingMore}
                                    className="bg-white text-pink-500 px-6 sm:px-8 py-3 rounded-lg font-semibold text-sm sm:text-base border-2 border-pink-500 hover:bg-pink-500 hover:text-white transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loadingMore ? 'Loading...' : 'Show More'}
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-8 sm:py-12">
                        <div className="max-w-md mx-auto px-4">
                            <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">No Products Found</h3>
                            <p className="text-sm sm:text-base text-gray-600 mb-4">
                                We couldn't find any products at the moment.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}

