'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/components/Common/ProductCard';
import { productAPI, categoryAPI, transformProductData } from '@/services/api';
import { ChevronDown, ChevronUp, Filter, X } from 'lucide-react';
import Pagination from '@/components/Common/Pagination';
import toast from 'react-hot-toast';
import Header from '@/components/Header/Header';

function SearchPageContent() {
    const searchParams = useSearchParams();
    const query = searchParams.get('query');

    // State for products and loading
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalResults, setTotalResults] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [itemsPerPage] = useState(12);

    // State for filters
    const [categories, setCategories] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedBraceletSizes, setSelectedBraceletSizes] = useState([]);
    const [selectedRingSizes, setSelectedRingSizes] = useState([]);
    const [priceRange, setPriceRange] = useState({ min: '', max: '' });
    const [showFilters, setShowFilters] = useState(false); // Mobile filters hidden by default
    const [showBraceletSizes, setShowBraceletSizes] = useState(true);
    const [showRingSizes, setShowRingSizes] = useState(true);

    // Dynamic size filters based on selected categories
    const [availableBraceletSizes, setAvailableBraceletSizes] = useState([]);
    const [availableRingSizes, setAvailableRingSizes] = useState([]);
    const [showBraceletSizeFilter, setShowBraceletSizeFilter] = useState(false);
    const [showRingSizeFilter, setShowRingSizeFilter] = useState(false);

    // Fetch main categories only (no child categories)
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await categoryAPI.getMainCategories();
                if (response.success) {
                    setCategories(response.data || []);
                }
            } catch (error) {
                console.error('Error fetching main categories:', error);
            }
        };
        fetchCategories();
    }, []);

    // Fetch all available sizes when page loads (no categories selected)
    useEffect(() => {
        fetchAvailableSizes([]);
    }, []);

    // Fetch available sizes based on selected categories
    const fetchAvailableSizes = async (categoryIds) => {
        try {
            const response = await productAPI.getAvailableFilters(categoryIds);
            
            if (response.success && response.data) {
                const { braceletSizes, ringSizes, showBraceletFilter, showRingFilter } = response.data;
                
                setAvailableBraceletSizes(braceletSizes || []);
                setAvailableRingSizes(ringSizes || []);
                setShowBraceletSizeFilter(showBraceletFilter || false);
                setShowRingSizeFilter(showRingFilter || false);
            }
        } catch (error) {
            console.error('Error fetching available filters:', error);
        }
    };

    // Search products with filters
    const searchProducts = async () => {
        // If no query, fetch all products (browse mode)
        if (!query) {
            setLoading(true);
            try {
                const filters = {
                    page: currentPage,
                    limit: itemsPerPage,
                    category: selectedCategories.join(','),
                    braceletSize: selectedBraceletSizes.join(','),
                    ringSize: selectedRingSizes.join(','),
                    ...(priceRange.min && { minPrice: priceRange.min }),
                    ...(priceRange.max && { maxPrice: priceRange.max }),
                };

                // Use the search API without a search query to get all products
                const response = await productAPI.searchProducts('', filters);

                if (response.success) {
                    // Transform the product data to match ProductCard component expectations
                    const transformedProducts = (response.data || []).map(product => ({
                        ...transformProductData(product),
                        variants: product.variants || [], // Keep original variants
                        _id: product._id, // Keep original ID
                        title: product.title, // Keep original title
                        slug: product.slug, // Keep original slug
                        featuredImage: product.featuredImage, // Keep original image
                    }));
                    setSearchResults(transformedProducts);
                    setTotalResults(response.pagination?.total || 0);
                    setTotalPages(response.pagination?.totalPages || 1);
                } else {
                    // Handle API error response
                    toast.error(response.message || 'Failed to fetch products');
                    setSearchResults([]);
                    setTotalResults(0);
                }
            } catch (error) {
                console.error('Error fetching products:', error);
                toast.error('Failed to fetch products. Please try again.');
                setSearchResults([]);
                setTotalResults(0);
            } finally {
                setLoading(false);
            }
            return;
        }

        setLoading(true);
        try {
            // Get price values (backend will handle validation)
            const minPrice = priceRange.min ? parseFloat(priceRange.min) : null;
            const maxPrice = priceRange.max ? parseFloat(priceRange.max) : null;

            const filters = {
                page: currentPage,
                limit: itemsPerPage,
                category: selectedCategories.join(','),
                braceletSize: selectedBraceletSizes.join(','),
                ringSize: selectedRingSizes.join(','),
                ...(minPrice !== null && { minPrice: minPrice.toString() }),
                ...(maxPrice !== null && { maxPrice: maxPrice.toString() }),
            };

            // Use the new search API
            const response = await productAPI.searchProducts(query, filters);

            if (response.success) {
                // Transform the product data to match ProductCard component expectations
                const transformedProducts = (response.data || []).map(product => ({
                    ...transformProductData(product),
                    variants: product.variants || [], // Keep original variants
                    _id: product._id, // Keep original ID
                    title: product.title, // Keep original title
                    slug: product.slug, // Keep original slug
                    featuredImage: product.featuredImage, // Keep original image
                }));
                setSearchResults(transformedProducts);
                setTotalResults(response.pagination?.total || 0);
                setTotalPages(response.pagination?.totalPages || 1);
            } else {
                // Handle API error response
                toast.error(response.message || 'Search failed');
                setSearchResults([]);
                setTotalResults(0);
            }
        } catch (error) {
            console.error('Error searching products:', error);
            toast.error('Search failed. Please try again.');
            setSearchResults([]);
            setTotalResults(0);
        } finally {
            setLoading(false);
        }
    };

    // Apply filters
    useEffect(() => {
        searchProducts();
    }, [query, selectedCategories, selectedBraceletSizes, selectedRingSizes, priceRange, currentPage]);

    // Initial search when page loads
    useEffect(() => {
        if (query) {
            searchProducts();
        }
    }, [query]);

    // Handle filter changes
    const handleCategoryChange = (categoryId) => {
        setSelectedCategories(prev => {
            const newCategories = prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId];
            
            // Fetch available sizes for the new category selection
            fetchAvailableSizes(newCategories);
            
            return newCategories;
        });
        
        // Clear size selections when categories change
        setSelectedBraceletSizes([]);
        setSelectedRingSizes([]);
    };

    const handleBraceletSizeChange = (size) => {
        setSelectedBraceletSizes(prev =>
            prev.includes(size)
                ? prev.filter(s => s !== size)
                : [...prev, size]
        );
    };

    const handleRingSizeChange = (size) => {
        setSelectedRingSizes(prev =>
            prev.includes(size)
                ? prev.filter(s => s !== size)
                : [...prev, size]
        );
    };

    const handlePriceRangeChange = (type, value) => {
        setPriceRange(prev => ({
            ...prev,
            [type]: value
        }));
    };

    const clearAllFilters = () => {
        setSelectedCategories([]);
        setSelectedBraceletSizes([]);
        setSelectedRingSizes([]);
        setPriceRange({ min: '', max: '' });
        setCurrentPage(1); // Reset to first page
        
        // Fetch all available sizes when filters are cleared
        fetchAvailableSizes([]);
    };

    // Handle page change
    const handlePageChange = (page) => {
        setCurrentPage(page);
        // Scroll to top when page changes
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // If no query, show all products (browse mode)
    if (!query) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="2xl:max-w-7xl xl:max-w-6xl mx-auto px-4 py-8">
                    {/* Mobile Filter Toggle Button */}
                    <div className="lg:hidden mb-6">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="w-full flex items-center justify-center space-x-2 bg-white px-4 py-3 rounded-lg shadow-sm border hover:bg-gray-50 transition-colors"
                        >
                            <Filter className="w-4 h-4" />
                            <span className="text-sm font-medium">
                                {showFilters ? 'Hide Filters' : 'Show Filters'}
                            </span>
                            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                    </div>

                    {/* Browse All Products Header */}
                    <div className="mb-6">
                        <h1 className="text-xl font-bold text-gray-900 ">Browse All Products</h1>
                        <div className="flex items-center justify-between">
                            <p className="text-gray-600">
                                {loading ? 'Loading...' : `${totalResults} products found`}
                            </p>
                            {(selectedCategories.length > 0 || selectedBraceletSizes.length > 0 ||
                                selectedRingSizes.length > 0 || priceRange.min || priceRange.max) && (
                                    <button
                                        onClick={clearAllFilters}
                                        className="text-pink-500 hover:text-pink-600 text-sm flex items-center space-x-1"
                                    >
                                        <X className="w-4 h-4" />
                                        <span>Clear all filters</span>
                                    </button>
                                )}
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Left Sidebar - Filters */}
                        <div className={`lg:w-72 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                            <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
                                {/* Main Category Filter */}
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3">Main Category</h3>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {categories.map((category) => (
                                            <label key={category._id} className="flex items-center space-x-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedCategories.includes(category._id)}
                                                    onChange={() => handleCategoryChange(category._id)}
                                                    className="rounded border-gray-300 text-pink-500 focus:ring-pink-500"
                                                />
                                                <span className="text-sm text-gray-700">{category.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Bracelet Size Filter - Only show if category has bracelet products */}
                                {showBraceletSizeFilter && (
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="font-semibold text-gray-900">Bracelet Size</h3>
                                            <button
                                                onClick={() => setShowBraceletSizes(!showBraceletSizes)}
                                                className="text-blue-500 hover:text-blue-600 text-sm"
                                            >
                                                {showBraceletSizes ? 'VIEW LESS' : 'VIEW MORE'}
                                            </button>
                                        </div>
                                        {showBraceletSizes && (
                                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                                {availableBraceletSizes.map((size) => (
                                                    <label key={size} className="flex items-center space-x-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedBraceletSizes.includes(size)}
                                                            onChange={() => handleBraceletSizeChange(size)}
                                                            className="rounded border-gray-300 text-pink-500 focus:ring-pink-500"
                                                        />
                                                        <span className="text-sm text-gray-700">{size}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Ring Size Filter - Only show if category has ring products */}
                                {showRingSizeFilter && (
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="font-semibold text-gray-900">Ring Size</h3>
                                            <button
                                                onClick={() => setShowRingSizes(!showRingSizes)}
                                                className="text-blue-500 hover:text-blue-600 text-sm"
                                            >
                                                {showRingSizes ? 'VIEW LESS' : 'VIEW MORE'}
                                            </button>
                                        </div>
                                        {showRingSizes && (
                                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                                {availableRingSizes.map((size) => (
                                                    <label key={size} className="flex items-center space-x-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedRingSizes.includes(size)}
                                                            onChange={() => handleRingSizeChange(size)}
                                                            className="rounded border-gray-300 text-pink-500 focus:ring-pink-500"
                                                        />
                                                        <span className="text-sm text-gray-700">{size}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Price Range Filter */}
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3">Price</h3>
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-3 gap-2 items-center">
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                placeholder="Min"
                                                value={priceRange.min}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    if (value === '' || (parseFloat(value) >= 0)) {
                                                        handlePriceRangeChange('min', value);
                                                    }
                                                }}
                                                className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                            />
                                            <span className="text-gray-500 text-center text-sm">to</span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                placeholder="Max"
                                                value={priceRange.max}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    if (value === '' || (parseFloat(value) >= 0)) {
                                                        handlePriceRangeChange('max', value);
                                                    }
                                                }}
                                                className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                            />
                                        </div>
                                        {(priceRange.min || priceRange.max) && (
                                            <button
                                                onClick={() => {
                                                    setPriceRange({ min: '', max: '' });
                                                }}
                                                className="w-full bg-gray-100 text-gray-600 py-2 px-3 rounded-md hover:bg-gray-200 transition-colors text-sm"
                                            >
                                                Clear Price Filter
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Side - Product Grid */}
                        <div className="flex-1">
                            {loading ? (
                                <div className="flex justify-center items-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
                                </div>
                            ) : searchResults.length > 0 ? (
                                <div className="grid grid-cols-1 min-[400px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                                    {searchResults.map((product) => (
                                        <ProductCard 
                                            key={product._id} 
                                            product={product}
                                            onWishlistToggle={() => {}} // Placeholder for now
                                            onAddToCart={() => {}} // Placeholder for now
                                            showWishlistOnHover={true}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="text-gray-400 mb-4">
                                        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                                    <p className="text-gray-600">
                                        Try adjusting your filters
                                    </p>
                                </div>
                            )}

                            {/* Pagination */}
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                                totalItems={totalResults}
                                itemsPerPage={itemsPerPage}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="2xl:max-w-7xl xl:max-w-6xl mx-auto px-4 py-4">
                {/* Mobile Filter Toggle Button */}
                <div className="lg:hidden mb-6">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="w-full flex items-center justify-center space-x-2 bg-white px-4 py-3 rounded-lg shadow-sm border hover:bg-gray-50 transition-colors"
                    >
                        <Filter className="w-4 h-4" />
                        <span className="text-sm font-medium">
                            {showFilters ? 'Hide Filters' : 'Show Filters'}
                        </span>
                        {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                </div>

                {/* Search Results Header */}
                <div className="mb-6">
                    <h1 className="text-xl font-bold text-gray-900 mb-2">
                        Search Results for: <span className="text-pink-500">"{query}"</span>
                    </h1>
                    <div className="flex items-center justify-between">
                        <p className="text-gray-600">
                            {loading ? 'Searching...' : `${totalResults} results found`}
                        </p>
                        {(selectedCategories.length > 0 || selectedBraceletSizes.length > 0 ||
                            selectedRingSizes.length > 0 || priceRange.min || priceRange.max) && (
                                <button
                                    onClick={clearAllFilters}
                                    className="text-pink-500 hover:text-pink-600 text-sm flex items-center space-x-1"
                                >
                                    <X className="w-4 h-4" />
                                    <span>Clear all filters</span>
                                </button>
                            )}
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left Sidebar - Filters */}
                    <div className={`lg:w-72 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
                            {/* Main Category Filter */}
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-3">Main Category</h3>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {categories.map((category) => (
                                        <label key={category._id} className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedCategories.includes(category._id)}
                                                onChange={() => handleCategoryChange(category._id)}
                                                className="rounded border-gray-300 text-pink-500 focus:ring-pink-500"
                                            />
                                            <span className="text-sm text-gray-700">{category.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Bracelet Size Filter - Only show if category has bracelet products */}
                            {showBraceletSizeFilter && (
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-semibold text-gray-900">Bracelet Size</h3>
                                        <button
                                            onClick={() => setShowBraceletSizes(!showBraceletSizes)}
                                            className="text-blue-500 hover:text-blue-600 text-sm"
                                        >
                                            {showBraceletSizes ? 'VIEW LESS' : 'VIEW MORE'}
                                        </button>
                                    </div>
                                    {showBraceletSizes && (
                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                            {availableBraceletSizes.map((size) => (
                                                <label key={size} className="flex items-center space-x-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedBraceletSizes.includes(size)}
                                                        onChange={() => handleBraceletSizeChange(size)}
                                                        className="rounded border-gray-300 text-pink-500 focus:ring-pink-500"
                                                    />
                                                    <span className="text-sm text-gray-700">{size}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Ring Size Filter - Only show if category has ring products */}
                            {showRingSizeFilter && (
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-semibold text-gray-900">Ring Size</h3>
                                        <button
                                            onClick={() => setShowRingSizes(!showRingSizes)}
                                            className="text-blue-500 hover:text-blue-600 text-sm"
                                        >
                                            {showRingSizes ? 'VIEW LESS' : 'VIEW MORE'}
                                            </button>
                                    </div>
                                    {showRingSizes && (
                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                            {availableRingSizes.map((size) => (
                                                <label key={size} className="flex items-center space-x-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedRingSizes.includes(size)}
                                                        onChange={() => handleRingSizeChange(size)}
                                                        className="rounded border-gray-300 text-pink-500 focus:ring-pink-500"
                                                    />
                                                    <span className="text-sm text-gray-700">{size}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                                                                                      {/* Price Range Filter */}
                             <div>
                                 <h3 className="font-semibold text-gray-900 mb-3">Price</h3>
                                 <div className="space-y-3">
                                     <div className="grid grid-cols-3 gap-2 items-center">
                                         <input
                                             type="number"
                                             min="0"
                                             step="0.01"
                                             placeholder="Min"
                                             value={priceRange.min}
                                             onChange={(e) => {
                                                 const value = e.target.value;
                                                 if (value === '' || (parseFloat(value) >= 0)) {
                                                     handlePriceRangeChange('min', value);
                                                 }
                                             }}
                                             className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                         />
                                         <span className="text-gray-500 text-center text-sm">to</span>
                                         <input
                                             type="number"
                                             min="0"
                                             step="0.01"
                                             placeholder="Max"
                                             value={priceRange.max}
                                             onChange={(e) => {
                                                 const value = e.target.value;
                                                 if (value === '' || (parseFloat(value) >= 0)) {
                                                     handlePriceRangeChange('max', value);
                                                 }
                                             }}
                                             className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                         />
                                     </div>
                                     {(priceRange.min || priceRange.max) && (
                                         <button
                                             onClick={() => {
                                                 setPriceRange({ min: '', max: '' });
                                             }}
                                             className="w-full bg-gray-100 text-gray-600 py-2 px-3 rounded-md hover:bg-gray-200 transition-colors text-sm"
                                         >
                                             Clear Price Filter
                                         </button>
                                     )}
                                 </div>
                             </div>
                        </div>
                    </div>

                    {/* Right Side - Product Grid */}
                    <div className="flex-1">
                        {loading ? (
                            <div className="flex justify-center items-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
                            </div>
                                                 ) : searchResults.length > 0 ? (
                             <div className="grid grid-cols-1 min-[400px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                                 {searchResults.map((product) => (
                                     <ProductCard 
                                         key={product._id} 
                                         product={product}
                                         onWishlistToggle={() => {}} // Placeholder for now
                                         onAddToCart={() => {}} // Placeholder for now
                                         showWishlistOnHover={true}
                                     />
                                 ))}
                             </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="text-gray-400 mb-4">
                                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                                <p className="text-gray-600">
                                    Try adjusting your search terms or filters
                                </p>
                            </div>
                        )}

                        {/* Pagination */}
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                            totalItems={totalResults}
                            itemsPerPage={itemsPerPage}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50">
                <div className="2xl:max-w-7xl xl:max-w-6xl mx-auto px-4 py-4">
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
                    </div>
                </div>
            </div>
        }>
            <SearchPageContent />
        </Suspense>
    );
}
