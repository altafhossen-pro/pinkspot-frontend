'use client';

import React, { useState, useEffect } from 'react';
import { X, Search, Plus, Trash2, Package, Check } from 'lucide-react';
import { upsellAPI } from '@/services/api';
import toast from 'react-hot-toast';
import { getCookie } from 'cookies-next';

export default function AddLinkedProductsModal({ isOpen, onClose, upsell, onSuccess }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [adding, setAdding] = useState(false);
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
                upsell?.mainProduct?._id,
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

    // Add product to selection
    const addProductToSelection = (product) => {
        const isAlreadySelected = selectedProducts.some(p => p._id === product._id);
        if (!isAlreadySelected) {
            setSelectedProducts([...selectedProducts, product]);
            toast.success(`${product.title} added to selection`);
        } else {
            toast.error('Product already selected');
        }
    };

    // Remove product from selection
    const removeProductFromSelection = (productId) => {
        setSelectedProducts(selectedProducts.filter(p => p._id !== productId));
    };

    // Add selected products to upsell
    const addSelectedProducts = async () => {
        if (selectedProducts.length === 0) {
            toast.error('Please select at least one product');
            return;
        }

        try {
            setAdding(true);
            const token = getAdminToken();
            
            // Add each selected product
            for (let i = 0; i < selectedProducts.length; i++) {
                const product = selectedProducts[i];
                const response = await upsellAPI.addLinkedProduct(
                    upsell._id,
                    product._id,
                    i, // order
                    token
                );

                if (!response.success) {
                    toast.error(`Failed to add ${product.title}`);
                    return;
                }
            }

            toast.success(`${selectedProducts.length} product(s) added successfully`);
            onSuccess();
        } catch (error) {
            console.error('Error adding products:', error);
            toast.error('Failed to add products');
        } finally {
            setAdding(false);
        }
    };

    // Reset modal state
    const resetModal = () => {
        setSearchQuery('');
        setSearchResults([]);
        setSelectedProducts([]);
        setSearchPerformed(false);
    };

    // Handle modal close
    const handleClose = () => {
        resetModal();
        onClose();
    };

    // Handle success
    const handleSuccess = () => {
        resetModal();
        onSuccess();
    };

    useEffect(() => {
        if (isOpen) {
            resetModal();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                            Add Linked Products
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Search and add products to link with "{upsell?.mainProduct?.title}"
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                    {/* Search Section */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Search Products
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search products by name, description, or tags..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Search Results */}
                    {searchQuery && (
                        <div className="mb-6">
                            <h3 className="text-sm font-medium text-gray-700 mb-3">
                                Search Results
                                {loading && <span className="ml-2 text-pink-500">(Searching...)</span>}
                            </h3>
                            
                            {loading ? (
                                <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"></div>
                                    <p className="mt-2 text-gray-500">Searching products...</p>
                                </div>
                            ) : searchResults.length === 0 && searchPerformed ? (
                                <div className="text-center py-8">
                                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                    <p className="text-gray-500">No products found matching your search</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {searchResults.map((product) => (
                                        <div
                                            key={product._id}
                                            className="border border-gray-200 rounded-lg p-4 hover:border-pink-300 transition-colors"
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
                                                <button
                                                    onClick={() => addProductToSelection(product)}
                                                    className="text-pink-600 hover:text-pink-800 transition-colors"
                                                    title="Add to selection"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Selected Products */}
                    {selectedProducts.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-sm font-medium text-gray-700 mb-3">
                                Selected Products ({selectedProducts.length})
                            </h3>
                            <div className="space-y-2">
                                {selectedProducts.map((product, index) => (
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
                                            onClick={() => removeProductFromSelection(product._id)}
                                            className="text-red-500 hover:text-red-700 transition-colors"
                                            title="Remove from selection"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {!searchQuery && selectedProducts.length === 0 && (
                        <div className="text-center py-12">
                            <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Search for Products
                            </h3>
                            <p className="text-gray-500">
                                Use the search box above to find products to link with this upsell.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={addSelectedProducts}
                        disabled={selectedProducts.length === 0 || adding}
                        className="px-4 py-2 text-sm font-medium text-white bg-pink-600 border border-transparent rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                    >
                        {adding ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Adding...</span>
                            </>
                        ) : (
                            <>
                                <Check className="w-4 h-4" />
                                <span>Add {selectedProducts.length} Product(s)</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
