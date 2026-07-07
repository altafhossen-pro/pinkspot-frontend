'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Plus, Package, X } from 'lucide-react';
import { upsellAPI, productAPI } from '@/services/api';
import toast from 'react-hot-toast';
import { getCookie } from 'cookies-next';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateUpsellPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedMainProduct, setSelectedMainProduct] = useState(null);
    const [selectedLinkedProducts, setSelectedLinkedProducts] = useState([]);
    const [creating, setCreating] = useState(false);
    const [searchPerformed, setSearchPerformed] = useState(false);

    // Get admin token
    const getAdminToken = () => {
        return getCookie('token');
    };

    // Search products
    const searchProducts = async (query) => {
        if (!query.trim()) {
            setSearchResults([]);
            setSearchPerformed(false);
            return;
        }

        try {
            setLoading(true);
            const token = getAdminToken();
            const response = await upsellAPI.searchProductsForLinking(
                query.trim(),
                selectedMainProduct?._id,
                token
            );

            if (response.success) {
                setSearchResults(response.data || []);
                setSearchPerformed(true);
            } else {
                toast.error(response.message || 'Failed to search products');
                setSearchResults([]);
            }
        } catch (error) {
            console.error('Error searching products:', error);
            toast.error('Failed to search products');
            setSearchResults([]);
        } finally {
            setLoading(false);
        }
    };

    // Handle search input change
    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchQuery(value);
        
        // Debounce search
        const timeoutId = setTimeout(() => {
            searchProducts(value);
        }, 300);

        return () => clearTimeout(timeoutId);
    };

    // Select main product
    const selectMainProduct = (product) => {
        setSelectedMainProduct(product);
        setSearchQuery('');
        setSearchResults([]);
        setSearchPerformed(false);
        toast.success(`Selected "${product.title}" as main product`);
    };

    // Add linked product
    const addLinkedProduct = (product) => {
        const isAlreadySelected = selectedLinkedProducts.some(p => p._id === product._id);
        if (!isAlreadySelected) {
            setSelectedLinkedProducts([...selectedLinkedProducts, product]);
            toast.success(`${product.title} added as linked product`);
        } else {
            toast.error('Product already selected');
        }
    };

    // Remove linked product
    const removeLinkedProduct = (productId) => {
        setSelectedLinkedProducts(selectedLinkedProducts.filter(p => p._id !== productId));
    };

    // Create upsell
    const createUpsell = async () => {
        if (!selectedMainProduct) {
            toast.error('Please select a main product');
            return;
        }

        if (selectedLinkedProducts.length === 0) {
            toast.error('Please select at least one linked product');
            return;
        }

        try {
            setCreating(true);
            const token = getAdminToken();
            
            const upsellData = {
                mainProduct: selectedMainProduct._id,
                linkedProducts: selectedLinkedProducts.map((product, index) => ({
                    product: product._id,
                    order: index
                }))
            };

            const response = await upsellAPI.createUpsell(upsellData, token);
            
            if (response.success) {
                toast.success('Upsell created successfully');
                router.push('/admin/dashboard/upsells');
            } else {
                toast.error(response.message || 'Failed to create upsell');
            }
        } catch (error) {
            console.error('Error creating upsell:', error);
            toast.error('Failed to create upsell');
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center space-x-4 mb-4">
                    <Link
                        href="/admin/dashboard/upsells"
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Create New Upsell</h1>
                        <p className="text-gray-600">Link products together for cross-selling opportunities</p>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl">
                {/* Step 1: Select Main Product */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        Step 1: Select Main Product
                    </h2>
                    
                    {!selectedMainProduct ? (
                        <div>
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search for main product..."
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                />
                            </div>

                            {loading && (
                                <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"></div>
                                    <p className="mt-2 text-gray-500">Searching products...</p>
                                </div>
                            )}

                            {searchResults.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {searchResults.map((product) => (
                                        <div
                                            key={product._id}
                                            className="border border-gray-200 rounded-lg p-4 hover:border-pink-300 transition-colors cursor-pointer"
                                            onClick={() => selectMainProduct(product)}
                                        >
                                            <div className="flex items-start space-x-3">
                                                <img
                                                    src={product.featuredImage || '/images/placeholder.png'}
                                                    alt={product.title}
                                                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-medium text-gray-900 truncate">
                                                        {product.title}
                                                    </h4>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {product.slug}
                                                    </p>
                                                    <p className="text-sm font-semibold text-pink-600 mt-1">
                                                        ৳{product.priceRange?.min || 0}
                                                        {product.priceRange?.max && product.priceRange.max !== product.priceRange.min && 
                                                            ` - ৳${product.priceRange.max}`
                                                        }
                                                    </p>
                                                </div>
                                                <Plus className="w-4 h-4 text-pink-600" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {searchQuery && !loading && searchResults.length === 0 && searchPerformed && (
                                <div className="text-center py-8">
                                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                    <p className="text-gray-500">No products found matching your search</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center space-x-3">
                                <img
                                    src={selectedMainProduct.featuredImage || '/images/placeholder.png'}
                                    alt={selectedMainProduct.title}
                                    className="w-12 h-12 rounded-lg object-cover"
                                />
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900">
                                        {selectedMainProduct.title}
                                    </h4>
                                    <p className="text-xs text-gray-500">
                                        ৳{selectedMainProduct.priceRange?.min || 0}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedMainProduct(null)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Step 2: Select Linked Products */}
                {selectedMainProduct && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            Step 2: Select Linked Products
                        </h2>
                        
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search for linked products..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                            />
                        </div>

                        {loading && (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"></div>
                                <p className="mt-2 text-gray-500">Searching products...</p>
                            </div>
                        )}

                        {searchResults.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                {searchResults.map((product) => (
                                    <div
                                        key={product._id}
                                        className="border border-gray-200 rounded-lg p-4 hover:border-pink-300 transition-colors cursor-pointer"
                                        onClick={() => addLinkedProduct(product)}
                                    >
                                        <div className="flex items-start space-x-3">
                                            <img
                                                src={product.featuredImage || '/images/placeholder.png'}
                                                alt={product.title}
                                                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-medium text-gray-900 truncate">
                                                    {product.title}
                                                </h4>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {product.slug}
                                                </p>
                                                <p className="text-sm font-semibold text-pink-600 mt-1">
                                                    ৳{product.priceRange?.min || 0}
                                                    {product.priceRange?.max && product.priceRange.max !== product.priceRange.min && 
                                                        ` - ৳${product.priceRange.max}`
                                                    }
                                                </p>
                                            </div>
                                            <Plus className="w-4 h-4 text-pink-600" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Selected Linked Products */}
                        {selectedLinkedProducts.length > 0 && (
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 mb-3">
                                    Selected Linked Products ({selectedLinkedProducts.length})
                                </h3>
                                <div className="space-y-2">
                                    {selectedLinkedProducts.map((product, index) => (
                                        <div
                                            key={product._id}
                                            className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded">
                                                    {index + 1}
                                                </span>
                                                <img
                                                    src={product.featuredImage || '/images/placeholder.png'}
                                                    alt={product.title}
                                                    className="w-8 h-8 rounded object-cover"
                                                />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {product.title}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        ৳{product.priceRange?.min || 0}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => removeLinkedProduct(product._id)}
                                                className="text-red-500 hover:text-red-700 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Create Button */}
                {selectedMainProduct && selectedLinkedProducts.length > 0 && (
                    <div className="flex justify-end">
                        <button
                            onClick={createUpsell}
                            disabled={creating}
                            className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                        >
                            {creating ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    <span>Creating Upsell...</span>
                                </>
                            ) : (
                                <>
                                    <Plus className="w-4 h-4" />
                                    <span>Create Upsell</span>
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
