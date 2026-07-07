'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Edit, Trash2, Eye, Search, Filter, ChevronLeft, ChevronRight, TrendingUp, Share2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { getCookie } from 'cookies-next'
import { productAPI } from '@/services/api'
import DeleteConfirmationModal from '@/components/Common/DeleteConfirmationModal'
import ShareModal from '@/components/Common/ShareModal'
import PermissionDenied from '@/components/Common/PermissionDenied'
import { useAppContext } from '@/context/AppContext'

export default function AdminProductsPage() {
    const { hasPermission } = useAppContext()
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStatus, setFilterStatus] = useState('all')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)
    const [selectedProducts, setSelectedProducts] = useState([])
    const [deleting, setDeleting] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
    const [productToDelete, setProductToDelete] = useState(null)
    const [permissionError, setPermissionError] = useState(null)
    const [showShareModal, setShowShareModal] = useState(false)
    const [productToShare, setProductToShare] = useState(null)
    const limit = 10

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
    }, [currentPage, searchTerm, filterStatus, limit])

    // Reset to page 1 and clear selection when search/filter changes
    useEffect(() => {
        setCurrentPage(1)
        setSelectedProducts([])
    }, [searchTerm, filterStatus])

    // Debounce search - fetch after user stops typing (500ms delay)
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchProducts()
        }, 500)

        return () => clearTimeout(timer)
    }, [searchTerm, filterStatus, currentPage, fetchProducts])

    const handlePageChange = (page) => {
        setCurrentPage(page)
        setSelectedProducts([]) // Clear selection when page changes
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleDeleteProduct = (productId) => {
        const product = products.find(p => p._id === productId)
        setProductToDelete(product)
        setShowDeleteModal(true)
    }

    const confirmDeleteProduct = async () => {
        if (!productToDelete) return

        try {
            setDeleting(true)
            const token = getCookie('token')
            if (!token) {
                toast.error('Authentication required. Please login again.')
                return
            }
            const data = await productAPI.deleteProduct(productToDelete._id, token)
            
            if (data.success) {
                toast.success('Product deleted successfully!')
                setShowDeleteModal(false)
                setProductToDelete(null)
                fetchProducts() // Refresh the list
            } else {
                toast.error('Failed to delete product: ' + data.message)
            }
        } catch (error) {
            console.error('Error deleting product:', error)
            toast.error('Error deleting product')
        } finally {
            setDeleting(false)
        }
    }

    const handleStatusChange = (status) => {
        setFilterStatus(status)
        setCurrentPage(1) // Reset to first page on filter change
    }

    // Handle individual product selection
    const handleSelectProduct = (productId) => {
        setSelectedProducts(prev => {
            if (prev.includes(productId)) {
                return prev.filter(id => id !== productId)
            } else {
                return [...prev, productId]
            }
        })
    }

    // Handle select all products on current page
    const handleSelectAll = (checked) => {
        if (checked) {
            const allIds = products.map(p => p._id)
            setSelectedProducts(allIds)
        } else {
            setSelectedProducts([])
        }
    }

    // Check if all products on current page are selected
    const isAllSelected = products.length > 0 && products.every(p => selectedProducts.includes(p._id))

    // Handle bulk delete
    const handleBulkDelete = () => {
        if (selectedProducts.length === 0) return
        setShowBulkDeleteModal(true)
    }

    const confirmBulkDelete = async () => {
        if (selectedProducts.length === 0) return

        try {
            setDeleting(true)
            const token = getCookie('token')
            if (!token) {
                toast.error('Authentication required. Please login again.')
                return
            }
            const deletePromises = selectedProducts.map(productId => 
                productAPI.deleteProduct(productId, token)
            )

            const results = await Promise.allSettled(deletePromises)
            const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length
            const failed = results.length - successful

            if (successful > 0) {
                toast.success(`${successful} product(s) deleted successfully!`)
            }
            if (failed > 0) {
                toast.error(`${failed} product(s) failed to delete`)
            }

            setSelectedProducts([])
            setShowBulkDeleteModal(false)
            fetchProducts() // Refresh the list
        } catch (error) {
            console.error('Error deleting products:', error)
            toast.error('Error deleting products')
        } finally {
            setDeleting(false)
        }
    }

    const getStatusBadge = (status) => {
        const statusConfig = {
            draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
            published: { color: 'bg-green-100 text-green-800', label: 'Published' },
            archived: { color: 'bg-yellow-100 text-yellow-800', label: 'Archived' },
            out_of_stock: { color: 'bg-red-100 text-red-800', label: 'Out of Stock' }
        }
        const config = statusConfig[status] || statusConfig.draft
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                {config.label}
            </span>
        )
    }

    const getPriceDisplay = (product) => {
        if (product.variants && product.variants.length > 0) {
            const prices = product.variants.map(v => v.currentPrice).filter(p => p > 0)
            if (prices.length > 0) {
                const min = Math.min(...prices)
                const max = Math.max(...prices)
                return min === max ? `৳${min}` : `৳${min} - ৳${max}`
            }
        }
        return product.basePrice ? `৳${product.basePrice}` : 'N/A'
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Manage your product catalog
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        {hasPermission('product', 'create') && (
                            <Link
                                href="/admin/dashboard/products/create"
                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Create Product
                            </Link>
                        )}
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
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                    <div className="sm:w-48">
                        <select
                            value={filterStatus}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">All Status</option>
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                            <option value="archived">Archived</option>
                            <option value="out_of_stock">Out of Stock</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Bulk Delete Button */}
            {selectedProducts.length > 1 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-red-800">
                                {selectedProducts.length} product(s) selected
                            </span>
                        </div>
                        <button
                            onClick={handleBulkDelete}
                            disabled={deleting}
                            className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {deleting ? 'Deleting...' : 'Delete Selected Products'}
                        </button>
                    </div>
                </div>
            )}

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
                                    <th className="px-6 py-3 text-left">
                                        <input
                                            type="checkbox"
                                            checked={isAllSelected}
                                            onChange={(e) => handleSelectAll(e.target.checked)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Product
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Price
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Stock
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Created
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {products.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                                            {searchTerm || filterStatus !== 'all' ? 'No products found matching your criteria.' : 'No products found.'}
                                        </td>
                                    </tr>
                                ) : (
                                    products.map((product) => (
                                    <tr key={product._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="checkbox"
                                                checked={selectedProducts.includes(product._id)}
                                                onChange={() => handleSelectProduct(product._id)}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                        </td>
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
                                                    {/* Jewelry Type Indicators */}
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
                                            {product.calculatedTotalStock || product.totalStock || 0}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(product.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(product.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-2">
                                            <button
                                                    onClick={() => {
                                                        setProductToShare(product)
                                                        setShowShareModal(true)
                                                    }}
                                                    className="text-pink-600 hover:text-pink-900 p-1 cursor-pointer"
                                                    title="Share"
                                                >
                                                    <Share2 className="h-4 w-4" />
                                                </button>
                                                {hasPermission('product', 'read') && (
                                                    <Link
                                                        href={`/admin/dashboard/products/${product._id}`}
                                                        className="text-blue-600 hover:text-blue-900 p-1"
                                                        title="View"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                )}
                                                {hasPermission('inventory', 'read') && (
                                                    <Link
                                                        href={`/admin/dashboard/products/${product._id}/stock-history`}
                                                        className="text-green-600 hover:text-green-900 p-1"
                                                        title="Stock History"
                                                    >
                                                        <TrendingUp className="h-4 w-4" />
                                                    </Link>
                                                )}
                                                {hasPermission('product', 'update') && (
                                                    <Link
                                                        href={`/admin/dashboard/products/${product._id}/edit`}
                                                        className="text-indigo-600 hover:text-indigo-900 p-1"
                                                        title="Edit"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Link>
                                                )}
                                                
                                                {hasPermission('product', 'delete') && (
                                                    <button
                                                        onClick={() => handleDeleteProduct(product._id)}
                                                        className="text-red-600 hover:text-red-900 p-1"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
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
                    <div className="text-sm text-gray-500">
                        Showing {products.length} of {total} products (Page {currentPage} of {totalPages})
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
                                                className={`px-3 py-2 text-sm font-medium rounded-lg ${
                                                    currentPage === page
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

            {/* Single Delete Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false)
                    setProductToDelete(null)
                }}
                onConfirm={confirmDeleteProduct}
                title="Delete Product"
                message="Are you sure you want to delete this product? This action cannot be undone."
                itemName={productToDelete?.title}
                itemType="product"
                isLoading={deleting}
                confirmText="Delete Product"
                cancelText="Cancel"
                dangerLevel="high"
            />

            {/* Bulk Delete Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={showBulkDeleteModal}
                onClose={() => setShowBulkDeleteModal(false)}
                onConfirm={confirmBulkDelete}
                title="Delete Selected Products"
                message={`Are you sure you want to delete ${selectedProducts.length} product(s)? This action cannot be undone.`}
                itemName=""
                itemType="products"
                isLoading={deleting}
                confirmText={`Delete ${selectedProducts.length} Product(s)`}
                cancelText="Cancel"
                dangerLevel="high"
            />

            {/* Share Modal */}
            {productToShare && (
                <ShareModal
                    isOpen={showShareModal}
                    onClose={() => {
                        setShowShareModal(false)
                        setProductToShare(null)
                    }}
                    url={`/product/${productToShare.slug}`}
                    title="Share Product"
                />
            )}
        </div>
    )
}
