'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { categoryAPI } from '@/services/api';
import { ChevronRight } from 'lucide-react';
import Pagination from '@/components/Common/Pagination';
import Footer from '@/components/Footer/Footer';

export default function CategoriesPage() {
    const router = useRouter();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [itemsPerPage] = useState(12); // 12 categories per page

    // Fetch main categories with pagination
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setLoading(true);
                const response = await categoryAPI.getPaginatedMainCategories({
                    page: currentPage,
                    limit: itemsPerPage
                });
                if (response.success) {
                    setCategories(response.data || []);
                    setTotalPages(response.pagination?.totalPages || 1);
                    setTotalItems(response.pagination?.total || 0);
                }
            } catch (error) {
                console.error('Error fetching categories:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, [currentPage, itemsPerPage]);

    // Handle category click - navigate to shop with category filter
    const handleCategoryClick = (category) => {
        router.push(`/shop?category=${category.slug}`);
    };

    // Handle page change
    const handlePageChange = (page) => {
        setCurrentPage(page);
        // Scroll to top when page changes
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-screen-2xl mx-auto px-4 py-8">
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-screen-2xl mx-auto px-4 py-8">
                {/* Page Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Shop by Category</h1>
                    <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
                        Discover our curated collection of jewelry organized by category
                    </p>
                </div>

                {/* Categories Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                    {loading ? (
                        // Loading skeleton
                        Array.from({ length: 12 }).map((_, index) => (
                            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                                <div className="h-32 sm:h-36 bg-gray-200 animate-pulse"></div>
                                <div className="p-3 sm:p-4">
                                    <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                                    <div className="h-3 bg-gray-200 rounded animate-pulse w-16 mx-auto"></div>
                                </div>
                            </div>
                        ))
                    ) : (
                        categories.map((category) => (
                        <div
                            key={category._id}
                            onClick={() => handleCategoryClick(category)}
                            className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden transform hover:-translate-y-1 border border-gray-100"
                        >
                            {/* Category Image */}
                            <div className="relative h-32 sm:h-36 bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 overflow-hidden">
                                {category.image ? (
                                    <img
                                        src={category.image}
                                        alt={category.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
                                            <span className="text-white text-lg font-bold">
                                                {category.name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                
                                {/* Product Count Badge */}
                                {category.productCount > 0 && (
                                    <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-gray-700 shadow-sm">
                                        {category.productCount}
                                    </div>
                                )}
                            </div>

                            {/* Category Info */}
                            <div className="p-3 sm:p-4">
                                <div className="text-center">
                                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-pink-600 transition-colors duration-300 line-clamp-2 mb-1">
                                        {category.name}
                                    </h3>
                                    
                                    {/* Explore Button */}
                                    <div className="mt-2">
                                        <span className="inline-flex items-center text-xs text-pink-600 font-medium group-hover:text-pink-700 transition-colors duration-300">
                                            Explore
                                            <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform duration-300" />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        ))
                    )}
                </div>

                {/* Pagination */}
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                />

                {/* Empty State */}
                {categories.length === 0 && !loading && (
                    <div className="text-center py-12">
                        <div className="text-gray-400 mb-4">
                            <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
                        <p className="text-gray-600">
                            We're working on adding categories. Please check back later.
                        </p>
                    </div>
                )}
            </div>
            <Footer/>
        </div>
    );
}
