'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, ShoppingBag, Home, Grid3X3 } from 'lucide-react';
import { productAPI, categoryAPI } from '@/services/api';

export default function ProductNotFound() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [categories, setCategories] = useState([]);
    const [categoriesLoading, setCategoriesLoading] = useState(false);

    // Fetch categories for suggestions
    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setCategoriesLoading(true);
            const response = await categoryAPI.getHomepageCategories(8);
            if (response.success) {
                setCategories(response.data);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setCategoriesLoading(false);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        try {
            setSearching(true);
            const response = await productAPI.searchProducts(searchQuery, { limit: 6 });
            if (response.success) {
                setSearchResults(response.data);
            }
        } catch (error) {
            console.error('Error searching products:', error);
            setSearchResults([]);
        } finally {
            setSearching(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center px-4 py-12">
            <div className="max-w-4xl w-full">
                {/* Main Error Section */}
                <div className="text-center mb-12">
                    <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center">
                        <Search className="w-16 h-16 text-pink-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">Product Not Found</h1>
                    <p className="text-gray-600 mb-8 leading-relaxed max-w-2xl mx-auto">
                        Sorry, the product you're looking for doesn't exist or may have been removed. 
                        Try searching for something else or browse our categories.
                    </p>
                </div>

                {/* Search Section */}
                <div className="mb-12">
                    <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search for products..."
                                className="w-full px-6 py-4 pr-12 text-lg border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent shadow-sm"
                            />
                            <button
                                type="submit"
                                disabled={searching || !searchQuery.trim()}
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-pink-500 text-white p-2 rounded-full hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {searching ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                ) : (
                                    <Search className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                        <div className="mt-8 max-w-4xl mx-auto">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Results</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {searchResults.map((product) => (
                                    <Link
                                        key={product._id}
                                        href={`/product/${product.slug}`}
                                        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
                                    >
                                        <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
                                            <img
                                                src={product.featuredImage || product.images?.[0] || '/images/placeholder.png'}
                                                alt={product.title}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <h4 className="font-medium text-gray-900 mb-1 line-clamp-2">{product.title}</h4>
                                        <p className="text-pink-600 font-semibold">৳{product.variants?.[0]?.currentPrice || product.basePrice || 0}</p>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Categories Section */}
                <div className="mb-12">
                    <h3 className="text-xl font-semibold text-gray-900 text-center mb-6">Browse Categories</h3>
                    {categoriesLoading ? (
                        <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                            {categories.map((category) => (
                                <Link
                                    key={category._id}
                                    href={`/categories/${category.slug}`}
                                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all hover:border-pink-300 group text-center"
                                >
                                    <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-pink-50 transition-colors">
                                        <Grid3X3 className="w-6 h-6 text-gray-600 group-hover:text-pink-500" />
                                    </div>
                                    <h4 className="text-sm font-medium text-gray-900 group-hover:text-pink-600 transition-colors">
                                        {category.name}
                                    </h4>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                    <button
                        onClick={() => router.push('/shop')}
                        className="flex-1 bg-pink-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-pink-600 transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                        <ShoppingBag className="w-5 h-5" />
                        Browse All Products
                    </button>
                    
                    <button
                        onClick={() => router.push('/')}
                        className="flex-1 bg-white text-gray-700 py-3 px-6 rounded-lg font-semibold border border-gray-300 hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                        <Home className="w-5 h-5" />
                        Go Home
                    </button>
                </div>
                
                {/* Help Section */}
                <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                    <p className="text-sm text-gray-500">
                        Need help? <Link href="/contact-us" className="text-pink-500 hover:text-pink-600 font-medium">Contact us</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
