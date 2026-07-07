'use client';

import React, { useState, useEffect, useCallback, useLayoutEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { productAPI, transformProductData } from '@/services/api';
import ProductCard from '@/components/Common/ProductCard';

export default function ProductForYou() {
    const [products, setProducts] = useState(() => {
        if (typeof window !== 'undefined') {
            const cached = sessionStorage.getItem('forYouProducts');
            if (cached) return JSON.parse(cached);
        }
        return [];
    });
    const [page, setPage] = useState(() => {
        if (typeof window !== 'undefined') {
            const cached = sessionStorage.getItem('forYouPage');
            if (cached) return parseInt(cached, 10);
        }
        return 1;
    });
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(() => {
        if (typeof window !== 'undefined') {
            const cached = sessionStorage.getItem('forYouHasMore');
            if (cached === 'false') return false;
        }
        return true;
    });
    const [error, setError] = useState(null);
    const [initialLoad, setInitialLoad] = useState(() => {
        if (typeof window !== 'undefined') {
            if (sessionStorage.getItem('forYouProducts')) return false;
        }
        return true;
    });

    // Set up intersection observer for infinite scrolling
    const { ref, inView } = useInView({
        threshold: 0.1,
        rootMargin: '100px',
    });

    // Clear session storage on hard refresh
    useEffect(() => {
        const handleBeforeUnload = () => {
            sessionStorage.removeItem('forYouProducts');
            sessionStorage.removeItem('forYouPage');
            sessionStorage.removeItem('forYouHasMore');
            sessionStorage.removeItem('forYouScroll');
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, []);

    const fetchProducts = useCallback(async (pageNumber) => {
        try {
            setLoading(true);
            setError(null);

            const limit = 12;
            const response = await productAPI.getProducts({
                page: pageNumber,
                limit,
                isActive: true
            });

            if (response.success && response.data) {
                const fetchedProducts = response.data.map(transformProductData);

                if (pageNumber === 1) {
                    setProducts(fetchedProducts);
                } else {
                    setProducts(prev => {
                        const existingIds = new Set(prev.map(p => p.id));
                        const newUnique = fetchedProducts.filter(p => !existingIds.has(p.id));
                        return [...prev, ...newUnique];
                    });
                }

                const morePages = pageNumber < response.pagination.totalPages;
                setHasMore(morePages);

            } else {
                setHasMore(false);
            }
        } catch (err) {
            console.error('Error fetching products:', err);
            setError('Failed to load products. Please try again.');
        } finally {
            setLoading(false);
            setInitialLoad(false);
        }
    }, []);

    // Sync state to session storage automatically whenever it changes
    useEffect(() => {
        if (products.length > 0 && typeof window !== 'undefined') {
            sessionStorage.setItem('forYouProducts', JSON.stringify(products));
            sessionStorage.setItem('forYouPage', page.toString());
            sessionStorage.setItem('forYouHasMore', hasMore.toString());
        }
    }, [products, page, hasMore]);

    // Track scroll position
    useEffect(() => {
        let scrollTimeout;
        const handleScroll = () => {
            if (scrollTimeout) return;
            scrollTimeout = setTimeout(() => {
                sessionStorage.setItem('forYouScroll', window.scrollY.toString());
                scrollTimeout = null;
            }, 100);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (scrollTimeout) clearTimeout(scrollTimeout);
        };
    }, []);

    // Restore scroll position synchronously before paint to prevent flicker
    useLayoutEffect(() => {
        if (!initialLoad) {
            const cachedScroll = sessionStorage.getItem('forYouScroll');
            if (cachedScroll) {
                window.scrollTo(0, parseInt(cachedScroll, 10));
            }
        }
    }, [initialLoad]);

    // Initial load
    useEffect(() => {
        if (products.length === 0 && initialLoad) {
            fetchProducts(1);
        }
    }, [fetchProducts, products.length, initialLoad]);

    // Load more when user scrolls to bottom (inView becomes true)
    useEffect(() => {
        let timeoutId;
        if (inView && !loading && hasMore && !initialLoad) {
            // Add a small delay to allow DOM to paint and intersection observer to update
            timeoutId = setTimeout(() => {
                setPage(prev => {
                    const nextPage = prev + 1;
                    fetchProducts(nextPage);
                    return nextPage;
                });
            }, 100);
        }
        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [inView]); // Only trigger when inView changes

    if (error && products.length === 0) {
        return (
            <section className="py-12 bg-white">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-red-500">{error}</p>
                    <button
                        onClick={() => fetchProducts(1)}
                        className="mt-4 px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600 transition"
                    >
                        Try Again
                    </button>
                </div>
            </section>
        );
    }

    if (initialLoad && products.length === 0) {
        return (
            <section className="py-12 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Product For You</h2>
                        <div className="w-24 h-1 bg-pink-500 mx-auto rounded-full"></div>
                    </div>
                    {/* Skeleton loading grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-6">
                        {[...Array(12)].map((_, index) => (
                            <div key={index} className="bg-gray-100 rounded-xl aspect-[3/4] animate-pulse"></div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (products.length === 0) {
        return null; // Don't show section if no products
    }

    return (
        <section className="py-12 bg-white">
            <div className="container mx-auto px-4">
                {/* <div className="text-center mb-10">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Product For You</h2>
                    <div className="w-24 h-1 bg-pink-500 mx-auto rounded-full"></div>
                </div> */}

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5 gap-4 sm:gap-6">
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}

                    {/* Skeleton loader for infinite scroll */}
                    {loading && !initialLoad && [...Array(12)].map((_, index) => (
                        <div key={`skeleton-${index}`} className="bg-gray-100 rounded-xl aspect-[3/4] animate-pulse"></div>
                    ))}
                </div>

                {/* Invisible element for Intersection Observer */}
                <div ref={ref} className="h-4 w-full"></div>
            </div>
        </section>
    );
}
