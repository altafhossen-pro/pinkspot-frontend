'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import ProductCard from '@/components/Common/ProductCard';
import toast from 'react-hot-toast';
import { productAPI, transformProductData } from '@/services/api';
import { useAppContext } from '@/context/AppContext';
import { addProductToCart } from '@/utils/cartUtils';
import { addProductToWishlist } from '@/utils/wishlistUtils';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';



export default function BestSellingProducts() {
    const { addToCart, addToWishlist, wishlist } = useAppContext();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch bestselling products
    useEffect(() => {
        fetchBestsellingProducts();
    }, []);

    // Update products wishlist state when global wishlist changes
    useEffect(() => {
        if (products.length > 0) {
            setProducts(prev => prev.map(product => ({
                ...product,
                isWishlisted: wishlist.some(item => item.productId === product._id)
            })));
        }
    }, [wishlist]);

    const fetchBestsellingProducts = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await productAPI.getBestsellingProducts(10);

            if (data.success) {
                // Keep original data for variants like FeaturedProducts does
                const productsData = data.data || [];
                const transformedProducts = productsData.map(product => ({
                    ...transformProductData(product),
                    variants: product.variants || [], // Keep original variants
                    _id: product._id, // Keep original ID
                    title: product.title, // Keep original title
                    slug: product.slug, // Keep original slug
                    featuredImage: product.featuredImage, // Keep original image
                    totalStock: product.totalStock || 0, // Keep total stock
                    isWishlisted: wishlist.some(item => item.productId === product._id) // Sync with global wishlist
                }));
                setProducts(transformedProducts);
            } else {
                setError('Failed to load best selling products');
            }
        } catch (error) {
            console.error('Error fetching bestselling products:', error);
            setError('Unable to load best selling products');
        } finally {
            setLoading(false);
        }
    };

    const handleWishlistToggle = (productId) => {
        const product = products.find(p => p.id === productId || p._id === productId);
        if (product) {
            addProductToWishlist(product, addToWishlist);
            // Local state will be updated by useEffect when global wishlist changes
        }
    };

    const handleAddToCart = useCallback((productId) => {
        const selectedProduct = products.find(p => p.id === productId || p._id === productId);
        if (selectedProduct) {
            addProductToCart(selectedProduct, addToCart, 1);
        }
    }, [products, addToCart]);

    return (
        <section className="py-4 px-4 bg-white">
            <div className="max-w-screen-2xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-2xl font-bold text-gray-800">Best Selling Product</h2>

                    {/* Navigation Buttons */}
                    <div className="flex gap-2">
                        <button
                            className="best-selling-prev-btn w-10 h-10 rounded-lg border border-pink-300 text-gray-800 hover:bg-pink-50 transition-colors flex items-center justify-center"
                            aria-label="Previous best selling products"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button
                            className="best-selling-next-btn w-10 h-10 rounded-lg border border-pink-300 text-gray-800 hover:bg-pink-50 transition-colors flex items-center justify-center"
                            aria-label="Next best selling products"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Products Carousel */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                        {[...Array(5)].map((_, index) => (
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
                            <p className="text-sm sm:text-base text-gray-600 mb-4">
                                {error}
                            </p>
                            <button
                                onClick={fetchBestsellingProducts}
                                className="bg-pink-500 text-white px-4 sm:px-6 py-2 rounded-lg font-semibold text-sm hover:bg-pink-600 transition-colors"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                ) : products.length > 0 ? (
                    <Swiper
                        modules={[Navigation]}
                        spaceBetween={24}
                        slidesPerView={'auto'}
                        loop={true}
                        navigation={{
                            nextEl: '.best-selling-next-btn',
                            prevEl: '.best-selling-prev-btn',
                        }}
                        breakpoints={{
                            0: {
                                slidesPerView: 2,
                                spaceBetween: 8,
                            },
                            480: {
                                slidesPerView: 2,
                                spaceBetween: 10,
                            },
                            640: {
                                slidesPerView: 2,
                                spaceBetween: 12,
                            },
                            768: {
                                slidesPerView: 3,
                                spaceBetween: 16,
                            },
                            1024: {
                                slidesPerView: 4,
                                spaceBetween: 20,
                            },
                            1280: {
                                slidesPerView: 5,
                                spaceBetween: 24,
                            },
                        }}
                        className="best-selling-swiper !py-5 !px-1"
                    >
                        {products.map((product) => (
                            <SwiperSlide key={product.id}>
                                <ProductCard
                                    product={product}
                                    onWishlistToggle={handleWishlistToggle}
                                    onAddToCart={handleAddToCart}
                                    showWishlistOnHover={false}
                                />
                            </SwiperSlide>
                        ))}
                    </Swiper>
                ) : (
                    <div className="text-center py-8 sm:py-12">
                        <div className="max-w-md mx-auto px-4">
                            <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">No Best Selling Products Found</h3>
                            <p className="text-sm sm:text-base text-gray-600 mb-4">
                                Check back later for best selling products
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
