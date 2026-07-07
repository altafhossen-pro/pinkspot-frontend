'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit, Trash2, Package, Tag, Calendar, DollarSign, Star, Eye, EyeOff, Share2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { getCookie } from 'cookies-next'
import { productAPI } from '@/services/api'
import PermissionDenied from '@/components/Common/PermissionDenied'
import ShareModal from '@/components/Common/ShareModal'
import { useAppContext } from '@/context/AppContext'

export default function ProductDetailsPage() {
    const router = useRouter()
    const params = useParams()
    const productId = params.id
    const { hasPermission, loading: contextLoading } = useAppContext()
    
    const [product, setProduct] = useState(null)
    const [loading, setLoading] = useState(true)
    const [deleting, setDeleting] = useState(false)
    const [permissionError, setPermissionError] = useState(null)
    const [showShareModal, setShowShareModal] = useState(false)

    useEffect(() => {
        fetchProduct()
    }, [productId])

    const fetchProduct = async () => {
        try {
            setLoading(true)
            const token = getCookie('token')
            const data = await productAPI.getAdminProductById(productId, token)
            
            if (data.success) {
                setProduct(data.data)
                setPermissionError(null)
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
                    router.push('/admin/dashboard/products')
                }
            }
        } catch (error) {
            console.error('Error fetching product:', error)
            // Check if it's a 403 error (permission denied)
            if (error.status === 403 || error.response?.status === 403) {
                const errorMessage = error.response?.data?.message || error.message || 'You don\'t have permission to access this resource.'
                setPermissionError({
                    message: errorMessage,
                    action: 'Read Products'
                })
            } else {
                toast.error('Error fetching product')
                router.push('/admin/dashboard/products')
            }
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteProduct = async () => {
        if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) return

        try {
            setDeleting(true)
            const token = getCookie('token')
            if (!token) {
                toast.error('Authentication required. Please login again.')
                return
            }
            const data = await productAPI.deleteProduct(productId, token)
            
            if (data.success) {
                toast.success('Product deleted successfully!')
                router.push('/admin/dashboard/products')
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

    const getStatusBadge = (status) => {
        const statusConfig = {
            draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
            published: { color: 'bg-green-100 text-green-800', label: 'Published' },
            archived: { color: 'bg-red-100 text-red-800', label: 'Archived' }
        }
        const config = statusConfig[status] || statusConfig.draft
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                {config.label}
            </span>
        )
    }

    const getFlagBadge = (isActive, label) => {
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
                {isActive ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
                {label}
            </span>
        )
    }

    // Check permission before showing content
    useEffect(() => {
        if (!contextLoading) {
            if (!hasPermission('product', 'read')) {
                setPermissionError({
                    message: "You don't have permission to view products.",
                    action: 'Read Products'
                })
                setLoading(false)
            }
        }
    }, [contextLoading, hasPermission])

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

    if (loading || contextLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="text-gray-600">Loading product...</span>
                </div>
            </div>
        )
    }

    if (!product) {
        return (
            <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Product not found</h3>
                <p className="mt-1 text-sm text-gray-500">The product you're looking for doesn't exist.</p>
                <div className="mt-6">
                    <Link
                        href="/admin/dashboard/products"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Products
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center space-x-4">
                        <Link
                            href="/admin/dashboard/products"
                            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-gray-50 rounded-lg hover:bg-gray-100 hover:text-gray-700 transition-colors duration-200"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Products
                        </Link>
                        <div className="border-l border-gray-300 pl-4">
                            <h1 className="text-2xl font-bold text-gray-900">{product.title}</h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Product ID: {product._id}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => setShowShareModal(true)}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                        >
                            <Share2 className="h-4 w-4 mr-2" />
                            Share
                        </button>
                        {hasPermission('product', 'update') && (
                            <Link
                                href={`/admin/dashboard/products/${productId}/edit`}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                            >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Product
                            </Link>
                        )}
                        {hasPermission('product', 'delete') && (
                            <button
                                onClick={handleDeleteProduct}
                                disabled={deleting}
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors duration-200"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {deleting ? 'Deleting...' : 'Delete Product'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic Information */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Product Title</label>
                                <p className="mt-1 text-sm text-gray-900">{product.title}</p>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Slug</label>
                                <p className="mt-1 text-sm text-gray-900">{product.slug}</p>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Brand</label>
                                <p className="mt-1 text-sm text-gray-900">{product.brand || 'Not specified'}</p>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Status</label>
                                <div className="mt-1">{getStatusBadge(product.status)}</div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Category</label>
                                <p className="mt-1 text-sm text-gray-900">{product.category?.name || 'Not assigned'}</p>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Tags</label>
                                <div className="mt-1 flex flex-wrap gap-1">
                                    {product.tags && product.tags.length > 0 ? (
                                        product.tags.map((tag, index) => (
                                            <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                <Tag className="h-3 w-3 mr-1" />
                                                {tag}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-sm text-gray-500">No tags</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6">
                            <label className="block text-sm font-medium text-gray-500">Short Description</label>
                            <p className="mt-1 text-sm text-gray-900">{product.shortDescription || 'No short description'}</p>
                        </div>

                        <div className="mt-6">
                            <label className="block text-sm font-medium text-gray-500">Full Description</label>
                            <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{product.description}</p>
                        </div>
                    </div>

                    {/* Jewelry Properties */}
                    {(product.isBracelet || product.isRing) && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-medium text-gray-900 mb-4">Jewelry Properties</h2>
                            
                            <div className="space-y-4">
                                {product.isBracelet && (
                                    <div>
                                        <h3 className="text-md font-medium text-gray-700 mb-2">Bracelet Sizes</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {product.braceletSizes && product.braceletSizes.length > 0 ? (
                                                product.braceletSizes.map((size, index) => (
                                                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                                        {size}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-sm text-gray-500">No sizes specified</span>
                                            )}
                                        </div>
                                    </div>
                                )}
                                
                                {product.isRing && (
                                    <div>
                                        <h3 className="text-md font-medium text-gray-700 mb-2">Ring Sizes</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {product.ringSizes && product.ringSizes.length > 0 ? (
                                                product.ringSizes.map((size, index) => (
                                                    <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                                        {size}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-sm text-gray-500">No sizes specified</span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Product Flags */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Product Flags</h2>
                        <div className="flex flex-wrap gap-2">
                            {getFlagBadge(product.isActive, 'Active')}
                            {getFlagBadge(product.isFeatured, 'Featured')}
                            {getFlagBadge(product.isBestselling, 'Bestselling')}
                            {getFlagBadge(product.isNewArrival, 'New Arrival')}
                        </div>
                    </div>

                    {/* Specifications */}
                    {product.specifications && product.specifications.length > 0 && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-medium text-gray-900 mb-4">Specifications</h2>
                            <div className="space-y-3">
                                {product.specifications.map((spec, index) => (
                                    <div key={index} className="flex justify-between py-2 border-b border-gray-100 last:border-b-0">
                                        <span className="text-sm font-medium text-gray-700">{spec.key}</span>
                                        <span className="text-sm text-gray-900">{spec.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Variants */}
                    {product.variants && product.variants.length > 0 && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-medium text-gray-900 mb-4">Product Variants ({product.variants.length})</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {product.variants.map((variant, index) => (
                                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-gray-900">
                                                {variant.attributes[0]?.value} - {variant.attributes[1]?.value}
                                            </span>
                                            <span className="text-xs text-gray-500">SKU: {variant.sku}</span>
                                        </div>
                                        
                                        <div className="space-y-1 text-sm text-gray-600">
                                            <div className="flex items-center justify-between">
                                                <span>Current Price:</span>
                                                <span className="font-medium text-green-600">${variant.currentPrice}</span>
                                            </div>
                                            {variant.originalPrice && (
                                                <div className="flex items-center justify-between">
                                                    <span>Original Price:</span>
                                                    <span className="line-through text-gray-400">${variant.originalPrice}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center justify-between">
                                                <span>Stock:</span>
                                                <span className={`font-medium ${
                                                    variant.stockQuantity > 0 ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                    {variant.stockQuantity}
                                                </span>
                                            </div>
                                            <div className="flex items-center">
                                                <span className="mr-2">Color:</span>
                                                <div 
                                                    className="w-4 h-4 rounded-full border border-gray-300"
                                                    style={{ backgroundColor: variant.attributes[1]?.hexCode || '#000000' }}
                                                    title={variant.attributes[1]?.hexCode}
                                                ></div>
                                                <span className="ml-1 text-xs">{variant.attributes[1]?.hexCode}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Featured Image */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Featured Image</h3>
                        {product.featuredImage ? (
                            <img
                                src={product.featuredImage}
                                alt={product.title}
                                className="w-full h-48 object-cover rounded-lg"
                            />
                        ) : (
                            <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                                <Package className="h-12 w-12 text-gray-400" />
                            </div>
                        )}
                    </div>

                    {/* Product Stats */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Product Stats</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Created</span>
                                <span className="text-sm text-gray-900">
                                    {new Date(product.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Last Updated</span>
                                <span className="text-sm text-gray-900">
                                    {new Date(product.updatedAt).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Total Variants</span>
                                <span className="text-sm text-gray-900">
                                    {product.variants?.length || 0}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Total Stock</span>
                                <span className="text-sm text-gray-900">
                                    {product.variants?.reduce((total, variant) => total + (variant.stockQuantity || 0), 0) || 0}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                        <div className="space-y-3">
                            <button
                                onClick={() => setShowShareModal(true)}
                                className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                                <Share2 className="h-4 w-4 mr-2" />
                                Share Product
                            </button>
                            {(hasPermission('product', 'update') || hasPermission('product', 'delete')) && (
                                <>
                                    {hasPermission('product', 'update') && (
                                        <Link
                                            href={`/admin/dashboard/products/${productId}/edit`}
                                            className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                        >
                                            <Edit className="h-4 w-4 mr-2" />
                                            Edit Product
                                        </Link>
                                    )}
                                    {hasPermission('product', 'delete') && (
                                        <button
                                            onClick={handleDeleteProduct}
                                            disabled={deleting}
                                            className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            {deleting ? 'Deleting...' : 'Delete Product'}
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Share Modal */}
            {product && (
                <ShareModal
                    isOpen={showShareModal}
                    onClose={() => setShowShareModal(false)}
                    url={`/product/${product.slug}`}
                    title="Share Product"
                />
            )}
        </div>
    )
}
