'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Edit, Search, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import { getCookie } from 'cookies-next'
import { productAPI } from '@/services/api'
import PermissionDenied from '@/components/Common/PermissionDenied'
import { useAppContext } from '@/context/AppContext'

export default function LowStockProductsPage() {
    const { hasPermission } = useAppContext()
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStatus, setFilterStatus] = useState('low_stock')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)
    const [permissionError, setPermissionError] = useState(null)
    const [limit, setLimit] = useState(10)
    const [isCustomLimit, setIsCustomLimit] = useState(false)
    const [customLimitVal, setCustomLimitVal] = useState('')
    const [exporting, setExporting] = useState(false)
    const [sortBy, setSortBy] = useState('totalStock')
    const [sortOrder, setSortOrder] = useState('asc')

    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true)
            const token = getCookie('token')

            const params = {
                page: currentPage,
                limit: limit,
            }

            if (searchTerm.trim()) {
                params.search = searchTerm.trim()
            }

            if (filterStatus && filterStatus !== 'all') {
                params.status = filterStatus
            }

            params.sort = sortOrder === 'asc' ? sortBy : `-${sortBy}`

            const data = await productAPI.getAdminProducts(params, token)

            if (data.success) {
                setProducts(data.data || [])
                setTotalPages(data.pagination?.totalPages || 1)
                setTotal(data.pagination?.total || 0)
                setPermissionError(null) // Clear permission error on success
            } else {
                // Check if it's a permission error
                if (data.message && (
                    data.message.toLowerCase().includes('permission') ||
                    data.message.toLowerCase().includes('access denied') ||
                    data.message.toLowerCase().includes("don't have permission")
                )) {
                    setPermissionError({
                        message: data.message,
                        action: 'Read Products'
                    })
                } else {
                    // console.error('Failed to fetch products:', data.message)
                    toast.error(data.message || 'Failed to fetch products')
                }
            }
        } catch (error) {
            // console.error('Error fetching products:', error)
            // Check if it's a 403 error (permission denied)
            if (error.status === 403 || error.response?.status === 403) {
                const errorMessage = error.response?.data?.message || error.message || 'You don\'t have permission to access this resource.'
                setPermissionError({
                    message: errorMessage,
                    action: 'Read Products'
                })
            } else if (error.message && (
                error.message.toLowerCase().includes('permission') ||
                error.message.toLowerCase().includes('access denied') ||
                error.message.toLowerCase().includes("don't have permission")
            )) {
                // Also check message text for permission errors
                setPermissionError({
                    message: error.message,
                    action: 'Read Products'
                })
            } else {
                console.log('Error fetching products')
            }
        } finally {
            setLoading(false)
        }
    }, [currentPage, searchTerm, filterStatus, limit, sortBy, sortOrder])

    // Reset to page 1 when search changes
    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm])

    // Debounce search - fetch after user stops typing (500ms delay)
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchProducts()
        }, 500)

        return () => clearTimeout(timer)
    }, [searchTerm, filterStatus, currentPage, limit, sortBy, sortOrder, fetchProducts])

    const handlePageChange = (page) => {
        setCurrentPage(page)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleStatusChange = (status) => {
        setFilterStatus(status)
        setCurrentPage(1) // Reset to first page on filter change
    }

    const getPriceDisplay = (product) => {
        if (product.variants && product.variants.length > 0) {
            const prices = product.variants.map(v => v.currentPrice).filter(p => p > 0)
            if (prices.length > 0) {
                const min = Math.min(...prices)
                const max = Math.max(...prices)
                return min === max ? `৳${min.toFixed(2)}` : `৳${min.toFixed(2)} - ৳${max.toFixed(2)}`
            }
        }
        return product.basePrice ? `৳${Number(product.basePrice).toFixed(2)}` : 'N/A'
    }

    // Show permission denied if permission error exists
    if (permissionError && !loading) {
        return (
            <PermissionDenied
                title="Access Denied"
                message={permissionError.message}
                action={permissionError.action}
            />
        )
    }

    const handleExportCSV = async () => {
        try {
            setExporting(true);
            const token = getCookie('token');
            const toastId = toast.loading('Fetching products for export...');

            // Fetch all products matching low stock
            const data = await productAPI.getAdminProducts({ page: 1, limit: 100000, status: 'low_stock' }, token);

            if (!data.success) {
                toast.error('Failed to fetch products for export', { id: toastId });
                return;
            }

            toast.loading('Generating CSV...', { id: toastId });

            const allProducts = data.data || [];

            // CSV Headers
            const headers = ['Product Name', 'Variant/SKU', 'Stock'];

            // Convert product data to CSV rows
            const csvRows = [];
            csvRows.push(headers.join(','));

            allProducts.forEach(product => {
                const baseName = `"${product.title?.replace(/"/g, '""') || ''}"`;

                // If product has variants, create a row for each variant
                if (product.variants && product.variants.length > 0) {
                    product.variants.forEach(variant => {
                        const stock = variant.stockQuantity || 0;
                        const variantAttrs = variant.attributes?.map(a => `${a.name}:${a.value}`).join(' | ') || '';
                        const sku = variant.sku || variantAttrs;
                        csvRows.push(`${baseName},"${sku}",${stock}`);
                    });
                } else {
                    // No variants, just base product
                    const stock = product.calculatedTotalStock || product.totalStock || 0;
                    csvRows.push(`${baseName},"",${stock}`);
                }
            });

            // Create Blob and download
            const csvContent = csvRows.join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `products_export_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success('Export completed successfully!', { id: toastId });
        } catch (error) {
            console.error('Export error:', error);
            toast.error('An error occurred during export');
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Low Stock Products</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Manage your low stock product catalog
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={handleExportCSV}
                            disabled={exporting}
                            className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 disabled:opacity-50 cursor-pointer"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            {exporting ? 'Exporting...' : 'Export CSV'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search low stock products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        >
                            <option value="totalStock">By Product Stock</option>
                            <option value="variants.stockQuantity">By Variant Stock</option>
                        </select>
                        <select
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        >
                            <option value="asc">Low to High</option>
                            <option value="desc">High to Low</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-32">
                            <div className="flex flex-col items-center gap-3">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                                <p className="text-sm text-gray-500">Loading products...</p>
                            </div>
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Product
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Price
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Stock
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {products.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                                            {searchTerm ? 'No products found matching your criteria.' : 'No low stock products found.'}
                                        </td>
                                    </tr>
                                ) : (
                                    products.map((product) => (
                                        <tr key={product._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-12 w-12">
                                                        <img
                                                            className="h-12 w-12 rounded-lg object-cover"
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
                                                        <div className="flex items-center space-x-2 mt-1">
                                                            {product.isBracelet && (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                    Bracelet
                                                                </span>
                                                            )}
                                                            {product.isRing && (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                    Ring
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {getPriceDisplay(product)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <div className="font-medium text-gray-900 mb-1">Total Stock: {product.calculatedTotalStock || product.totalStock || 0}</div>
                                                {product.variants && product.variants.length > 0 && (
                                                    <div className="mt-2 flex flex-col gap-1 max-h-32 overflow-y-auto pr-1">
                                                        {product.variants.map((v, i) => {
                                                            const attrs = v.attributes?.map(a => a.value).join(', ') || '';
                                                            const name = v.sku || attrs || `Variant ${i+1}`;
                                                            return (
                                                                <div key={i} className="text-xs flex items-center justify-between bg-gray-50 px-2 py-1.5 rounded border border-gray-100 mb-1">
                                                                    <span className="font-medium text-gray-700 whitespace-normal break-words" title={name}>{name}</span>
                                                                    <span className={`font-bold ml-3 flex-shrink-0 ${v.stockQuantity <= 10 ? 'text-red-600' : 'text-gray-900'}`}>{v.stockQuantity} left</span>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end space-x-2">
                                                    {hasPermission('product', 'update') && (
                                                        <Link
                                                            href={`/admin/dashboard/products/${product._id}/edit`}
                                                            className="text-indigo-600 hover:text-indigo-900 p-1"
                                                            title="Edit"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Link>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Pagination and Summary */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-500">
                            Showing {products.length} of {total} products (Page {currentPage} of {totalPages})
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-500">Per page:</label>
                            {isCustomLimit ? (
                                <div className="flex items-center gap-1">
                                    <input
                                        type="number"
                                        min="1"
                                        value={customLimitVal}
                                        onChange={(e) => setCustomLimitVal(e.target.value)}
                                        className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                                        placeholder="Num"
                                    />
                                    <button
                                        onClick={() => {
                                            const val = parseInt(customLimitVal);
                                            if (val > 0) {
                                                setLimit(val);
                                                setCurrentPage(1);
                                            }
                                        }}
                                        className="px-2 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                    >
                                        Go
                                    </button>
                                    <button
                                        onClick={() => setIsCustomLimit(false)}
                                        className="px-2 py-1 text-gray-500 hover:bg-gray-100 rounded text-sm"
                                    >
                                        X
                                    </button>
                                </div>
                            ) : (
                                <select
                                    value={limit}
                                    onChange={(e) => {
                                        if (e.target.value === 'custom') {
                                            setIsCustomLimit(true);
                                            setCustomLimitVal(limit.toString());
                                        } else {
                                            setLimit(parseInt(e.target.value));
                                            setCurrentPage(1);
                                        }
                                    }}
                                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                                >
                                    <option value="10">10</option>
                                    <option value="20">20</option>
                                    <option value="50">50</option>
                                    <option value="100">100</option>
                                    <option value="custom">Custom</option>
                                </select>
                            )}
                        </div>
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Previous
                            </button>

                            <div className="flex items-center space-x-1">
                                {[...Array(totalPages)].map((_, idx) => {
                                    const page = idx + 1
                                    // Show first page, last page, current page, and pages around current
                                    if (
                                        page === 1 ||
                                        page === totalPages ||
                                        (page >= currentPage - 1 && page <= currentPage + 1)
                                    ) {
                                        return (
                                            <button
                                                key={page}
                                                onClick={() => handlePageChange(page)}
                                                className={`px-3 py-2 text-sm font-medium rounded-lg ${currentPage === page
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {page}
                                            </button>
                                        )
                                    } else if (
                                        page === currentPage - 2 ||
                                        page === currentPage + 2
                                    ) {
                                        return (
                                            <span key={page} className="px-2 text-gray-500">
                                                ...
                                            </span>
                                        )
                                    }
                                    return null
                                })}
                            </div>

                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                                Next
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

        </div>
    )
}
