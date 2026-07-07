'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, Eye, Search, Filter, MoreVertical, Link2, Package, Users, ExternalLink } from 'lucide-react';
import { upsellAPI, productAPI } from '@/services/api';
import toast from 'react-hot-toast';
import { getCookie } from 'cookies-next';
import DeleteConfirmationModal from '@/components/Common/DeleteConfirmationModal';
import UpsellDetailsModal from '@/components/Admin/UpsellDetailsModal';

export default function UpsellsPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0
    });

    // Get admin token
    const getAdminToken = () => {
        return getCookie('token');
    };

    // Fetch products with upsell count
    const fetchProducts = async (page = 1) => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '10'
            });

            // Add search query if provided
            if (searchQuery.trim()) {
                params.append('search', searchQuery.trim());
            }


            const token = getAdminToken();
            const response = await productAPI.getProducts(params.toString(), token);
            
            if (response.success) {
                // Get upsell count for each product using Promise.allSettled for better error handling
                // This handles 404 (no upsells found) gracefully without treating them as errors
                const productsWithUpsellCount = await Promise.allSettled(
                    response.data.map(async (product) => {
                        try {
                            const upsellResponse = await upsellAPI.getUpsellsByMainProduct(product._id, token);
                            
                            // Handle both success and 404 responses
                            if (upsellResponse.success && upsellResponse.data) {
                                return {
                                    ...product,
                                    upsellCount: upsellResponse.data.linkedProducts?.length || 0
                                };
                            } else {
                                // 404 or no upsells found - this is normal, not an error
                                return {
                                    ...product,
                                    upsellCount: 0
                                };
                            }
                        } catch (error) {
                            // Network errors or other issues - default to 0
                            // 404 errors from API are caught here too
                            const is404 = error?.status === 404 || 
                                         error?.response?.status === 404 ||
                                         error?.message?.toLowerCase().includes('no upsells found');
                            
                            if (!is404) {
                                // Only log non-404 errors
                                console.warn(`Error fetching upsell for product ${product._id}:`, error.message);
                            }
                            
                            return {
                                ...product,
                                upsellCount: 0
                            };
                        }
                    })
                );
                
                // Extract values from Promise.allSettled results
                const finalProducts = productsWithUpsellCount.map((result) => {
                    if (result.status === 'fulfilled') {
                        return result.value;
                    } else {
                        // This shouldn't happen due to our try-catch, but handle it anyway
                        const product = response.data.find(p => p._id === result.reason?.productId) || response.data[productsWithUpsellCount.indexOf(result)];
                        return {
                            ...product,
                            upsellCount: 0
                        };
                    }
                });
                
                setProducts(finalProducts);
                setPagination(response.pagination);
            } else {
                toast.error(response.message || 'Failed to fetch products');
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            toast.error('Failed to fetch products');
        } finally {
            setLoading(false);
        }
    };

    // Handle view upsell details
    const handleViewUpsellDetails = (product) => {
        setSelectedProduct(product);
        setShowDetailsModal(true);
    };

    // Handle modal close
    const handleModalClose = () => {
        setShowDetailsModal(false);
        setSelectedProduct(null);
        // Refresh the table data when modal is closed
        fetchProducts(pagination.page);
    };

    // Handle successful upsell update (not used anymore)
    const handleUpsellUpdated = () => {
        // This function is kept for compatibility but not called
    };

    // Handle search
    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
    };

    // Debounced search effect
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchProducts(1);
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);


    // Handle page change
    const handlePageChange = (newPage) => {
        fetchProducts(newPage);
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Product Upsells</h1>
                        <p className="text-gray-600">Manage upsell relationships for your products</p>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={handleSearch}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"></div>
                        <p className="mt-2 text-gray-500">Loading products...</p>
                    </div>
                ) : products.length === 0 ? (
                    <div className="p-8 text-center">
                        <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                        <p className="text-gray-500">No products available to manage upsells.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Product
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Upsell Count
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Price
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {products.map((product) => (
                                    <tr key={product._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <img
                                                        className="h-10 w-10 rounded-lg object-cover"
                                                        src={product.featuredImage || '/images/placeholder.png'}
                                                        alt={product.title}
                                                    />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {product.title}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {product.slug}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <Link2 className="w-4 h-4 text-gray-400 mr-2" />
                                                <span className="text-sm text-gray-900">
                                                    {product.upsellCount || 0} linked products
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                product.isActive
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {product.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            ৳{product.priceRange?.min || 0}
                                            {product.priceRange?.max && product.priceRange.max !== product.priceRange.min && 
                                                ` - ৳${product.priceRange.max}`
                                            }
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    onClick={() => handleViewUpsellDetails(product)}
                                                    className="text-pink-600 hover:text-pink-900 p-1"
                                                    title="View Upsell Details"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                        Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => handlePageChange(pagination.page - 1)}
                            disabled={pagination.page === 1}
                            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <span className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md">
                            {pagination.page} of {pagination.totalPages}
                        </span>
                        <button
                            onClick={() => handlePageChange(pagination.page + 1)}
                            disabled={pagination.page === pagination.totalPages}
                            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Upsell Details Modal */}
            {showDetailsModal && selectedProduct && (
                <UpsellDetailsModal
                    isOpen={showDetailsModal}
                    onClose={handleModalClose}
                    product={selectedProduct}
                    onSuccess={handleUpsellUpdated}
                />
            )}
        </div>
    );
}
