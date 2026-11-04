'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowUpDown,
    SlidersHorizontal,
    RotateCcw,
    Package
} from 'lucide-react';
import ProductCard from '@/components/Common/ProductCard';
import { comboAPI } from '@/services/api';
import Footer from '@/components/Footer/Footer';

function CombosContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [combos, setCombos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');
    const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
    const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
    const [appliedFilters, setAppliedFilters] = useState({
        minPrice: searchParams.get('minPrice') || '',
        maxPrice: searchParams.get('maxPrice') || ''
    });

    const fetchCombos = useCallback(async () => {
        try {
            setLoading(true);
            const params = {
                limit: 48,
                sort: sortBy,
            };
            if (appliedFilters.minPrice) params.minPrice = appliedFilters.minPrice;
            if (appliedFilters.maxPrice) params.maxPrice = appliedFilters.maxPrice;

            const res = await comboAPI.getActiveCombosPublic(params);
            if (res.success && Array.isArray(res.data)) {
                setCombos(res.data);
            } else {
                setCombos([]);
            }
        } catch (err) {
            console.error('Error fetching combos:', err);
            setCombos([]);
        } finally {
            setLoading(false);
        }
    }, [sortBy, appliedFilters]);

    useEffect(() => {
        fetchCombos();
    }, [fetchCombos]);

    const handleSortChange = (e) => {
        const val = e.target.value;
        setSortBy(val);
    };

    const handleApplyPriceFilter = (e) => {
        e.preventDefault();
        setAppliedFilters({
            minPrice,
            maxPrice
        });
    };

    const handleResetFilters = () => {
        setMinPrice('');
        setMaxPrice('');
        setSortBy('newest');
        setAppliedFilters({
            minPrice: '',
            maxPrice: ''
        });
    };

    const hasActiveFilters = !!(appliedFilters.minPrice || appliedFilters.maxPrice || sortBy !== 'newest');

    return (
        <div className="min-h-screen bg-[#FDFCFB]">
            <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {/* Filter and Sort Toolbar */}
                <div className="bg-white rounded-xl border border-neutral-200 p-4 sm:p-5 mb-8 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        {/* Price Range Filter Form */}
                        <form onSubmit={handleApplyPriceFilter} className="flex flex-wrap items-center gap-2.5">
                            <span className="text-xs sm:text-sm font-semibold text-neutral-700 flex items-center gap-1.5 mr-1">
                                <SlidersHorizontal className="w-4 h-4 text-pink-600" /> Price (BDT):
                            </span>
                            <input
                                type="number"
                                placeholder="Min"
                                value={minPrice}
                                onChange={(e) => setMinPrice(e.target.value)}
                                className="w-24 sm:w-28 px-3 py-1.5 text-xs sm:text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500 bg-neutral-50"
                            />
                            <span className="text-neutral-400 text-xs">—</span>
                            <input
                                type="number"
                                placeholder="Max"
                                value={maxPrice}
                                onChange={(e) => setMaxPrice(e.target.value)}
                                className="w-24 sm:w-28 px-3 py-1.5 text-xs sm:text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500 bg-neutral-50"
                            />
                            <button
                                type="submit"
                                className="px-3.5 py-1.5 bg-neutral-900 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-neutral-800 transition cursor-pointer"
                            >
                                Apply
                            </button>
                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    onClick={handleResetFilters}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-neutral-500 hover:text-pink-600 transition cursor-pointer"
                                    title="Reset all filters"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" /> Reset
                                </button>
                            )}
                        </form>

                        {/* Sorting Dropdown */}
                        <div className="flex items-center gap-2 self-start md:self-auto">
                            <span className="text-xs sm:text-sm text-neutral-600 font-medium flex items-center gap-1">
                                <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" /> Sort:
                            </span>
                            <select
                                value={sortBy}
                                onChange={handleSortChange}
                                className="px-3 py-1.5 text-xs sm:text-sm border border-neutral-300 rounded-lg bg-white text-neutral-800 focus:outline-none focus:ring-1 focus:ring-pink-500 cursor-pointer"
                            >
                                <option value="newest">Newest First</option>
                                <option value="price-low">Price: Low to High</option>
                                <option value="price-high">Price: High to Low</option>
                                <option value="oldest">Oldest First</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Combos Grid / Loading Skeleton */}
                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                        {[...Array(8)].map((_, idx) => (
                            <div key={idx} className="rounded-xl border border-neutral-200 overflow-hidden bg-white shadow-sm animate-pulse">
                                <div className="aspect-[4160/5536] bg-neutral-200" />
                                <div className="p-3 sm:p-4 space-y-2.5">
                                    <div className="h-4 bg-neutral-200 rounded w-4/5" />
                                    <div className="h-3.5 bg-neutral-200 rounded w-2/5" />
                                    <div className="flex items-center gap-2 pt-1">
                                        <div className="h-5 bg-neutral-200 rounded w-20" />
                                        <div className="h-4 bg-neutral-100 rounded w-14" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : combos.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-neutral-200 max-w-lg mx-auto p-8 shadow-sm">
                        <div className="w-14 h-14 bg-pink-50 text-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Package className="w-7 h-7" />
                        </div>
                        <h3 className="text-lg font-bold text-neutral-900 mb-1">No Combo Products Found</h3>
                        <p className="text-xs sm:text-sm text-neutral-500 mb-5">
                            {hasActiveFilters
                                ? 'No combos match the selected price filter or sorting criteria.'
                                : 'There are currently no active combo packages available.'}
                        </p>
                        {hasActiveFilters ? (
                            <button
                                type="button"
                                onClick={handleResetFilters}
                                className="px-5 py-2 bg-neutral-900 text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-neutral-800 transition"
                            >
                                Reset All Filters
                            </button>
                        ) : (
                            <Link
                                href="/shop"
                                className="px-5 py-2 bg-pink-600 text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-pink-700 transition inline-block"
                            >
                                Continue Shopping
                            </Link>
                        )}
                    </div>
                ) : (
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs sm:text-sm text-neutral-500 font-medium">
                                Showing <strong className="text-neutral-800">{combos.length}</strong> combo {combos.length === 1 ? 'package' : 'packages'}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                            {combos.map((combo) => {
                                const heroImage = combo.featuredImage || combo.mainProduct?.featuredImage || combo.products?.[0]?.product?.featuredImage || '/images/placeholder.png';
                                const price = combo.comboPrice || combo.customPrice || combo.defaultTotalPrice || 0;
                                const originalPrice = combo.defaultTotalPrice || combo.defaultOldPrice || (price > 0 ? price * 1.2 : null);
                                const discountValue = combo.discountValue || (originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0);

                                const productCardData = {
                                    id: combo._id,
                                    _id: combo._id,
                                    name: combo.title,
                                    title: combo.title,
                                    slug: combo.slug,
                                    image: heroImage,
                                    price: price,
                                    originalPrice: originalPrice && originalPrice > price ? originalPrice : null,
                                    categoryDiscount: discountValue > 0 ? { percentage: discountValue } : null,
                                    isCombo: true,
                                    isForceOutOfStock: false,
                                    variants: []
                                };

                                return (
                                    <ProductCard
                                        key={combo._id}
                                        product={productCardData}
                                        href={`/combo/${combo.slug}`}
                                        showWishlistOnHover={false}
                                        onWishlistToggle={() => { }}
                                        onAddToCart={() => {
                                            router.push(`/combo/${combo.slug}`);
                                        }}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}

export default function CombosPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#FDFCFB] p-8 max-w-screen-2xl mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                    {[...Array(8)].map((_, idx) => (
                        <div key={idx} className="aspect-[4160/5536] bg-neutral-200 rounded-xl animate-pulse" />
                    ))}
                </div>
            </div>
        }>
            <CombosContent />
        </Suspense>
    );
}

