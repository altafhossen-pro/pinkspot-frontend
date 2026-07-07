'use client'

import { useState, useEffect } from 'react'
import {
    Heart,
    ShoppingCart,
    Trash2,
    Eye,
    RefreshCw,
    AlertTriangle,
    X
} from 'lucide-react'
import { useAppContext } from '@/context/AppContext'
import { productAPI } from '@/services/api'
import toast from 'react-hot-toast'
import Link from 'next/link'
import Image from 'next/image'

export default function WishlistPage() {
    const {
        wishlist,
        wishlistCount,
        removeFromWishlist,
        moveToCart,
        addToCart,
        clearWishlist: clearWishlistContext,
        isAuthenticated
    } = useAppContext()

    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [showClearModal, setShowClearModal] = useState(false)

    // Fetch product details for wishlist items
    const fetchProductDetails = async () => {
        if (wishlist.length === 0) {
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            const productPromises = wishlist.map(async (item) => {
                try {
                    const response = await productAPI.getProductById(item.productId)
                    if (response.success) {
                        return {
                            ...response.data,
                            wishlistItem: item
                        }
                    }
                    return null
                } catch (error) {
                    console.error(`Error fetching product ${item.productId}:`, error)
                    return null
                }
            })

            const productResults = await Promise.all(productPromises)
            const validProducts = productResults.filter(product => product !== null)

            setProducts(validProducts)

        } catch (error) {
            console.error('Error fetching product details:', error)
            toast.error('Failed to load wishlist products')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchProductDetails()
    }, [wishlist])

    // Update products when wishlist changes (for real-time UI updates)
    useEffect(() => {
        if (wishlist.length === 0) {
            setProducts([])
        } else {
            // Filter out products that are no longer in wishlist
            setProducts(prevProducts => 
                prevProducts.filter(product => 
                    wishlist.some(item => item.productId === product._id)
                )
            )
        }
    }, [wishlist])

    const handleRemoveFromWishlist = (productId) => {
        removeFromWishlist(productId)
        toast.success('Removed from wishlist')
    }

    const handleMoveToCart = (product) => {
        const success = moveToCart(product.wishlistItem)
        if (success) {
            // Remove from wishlist after successful move to cart
            removeFromWishlist(product._id)
            toast.success('Moved to cart successfully!')
        } else {
            toast.error('Failed to move to cart')
        }
    }

    const clearWishlist = () => {
        // Use context's clearWishlist function
        clearWishlistContext()
        toast.success('Wishlist cleared')
        setShowClearModal(false)
    }

    if (!isAuthenticated) {
        return (
            <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">My Wishlist</h1>
                    <p className="text-gray-600">Please login to view your wishlist</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
        <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">My Wishlist</h1>
                        <p className="text-gray-600">
                            {wishlistCount} {wishlistCount === 1 ? 'item' : 'items'} in your wishlist
                        </p>
                    </div>
                    {wishlistCount > 0 && (
                        <button
                            onClick={() => setShowClearModal(true)}
                            className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                        >
                            Clear All
                        </button>
                    )}
                </div>
            </div>

            {/* Wishlist Items */}
            <div className="bg-white rounded-lg shadow-sm">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <RefreshCw className="h-8 w-8 text-gray-400 animate-spin" />
                        <span className="ml-2 text-gray-600">Loading wishlist...</span>
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-12">
                        <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Your wishlist is empty</h3>
                        <p className="text-gray-500 mb-6">Add some products to your wishlist to see them here.</p>
                        <Link
                            href="/shop"
                            className="inline-flex items-center px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                        >
                            Start Shopping
                        </Link>
                    </div>
                ) : (
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {products.map((product) => (
                                <div key={product._id} className="group relative bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                                    {/* Product Image */}
                                    <div className="aspect-square relative overflow-hidden">
                                        <Link href={`/product/${product.slug}`}>
                                            <Image
                                                src={product.featuredImage || '/images/placeholder.png'}
                                                alt={product.title}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        </Link>

                                        {/* Quick Actions */}
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="flex flex-col space-y-2">
                                                <Link
                                                    href={`/product/${product.slug}`}
                                                    className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye className="h-4 w-4 text-gray-600" />
                                                </Link>
                                                <button
                                                    onClick={() => handleRemoveFromWishlist(product._id)}
                                                    className="p-2 bg-white rounded-full shadow-md hover:bg-red-50 hover:text-red-600 transition-colors"
                                                    title="Remove from Wishlist"
                                                >
                                                    <Trash2 className="h-4 w-4 text-gray-600" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Product Info */}
                                    <div className="p-4">
                                        <Link href={`/product/${product.slug}`}>
                                            <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 hover:text-pink-600 transition-colors">
                                                {product.title}
                                            </h3>
                                        </Link>

                                        {/* Price */}
                                        <div className="mb-4">
                                            <span className="text-lg font-semibold text-pink-600">
                                                ৳{product.basePrice?.toLocaleString()}
                                            </span>
                                            {product.variants?.[0]?.originalPrice && (
                                                <span className="text-sm text-gray-500 line-through ml-2">
                                                    ৳{product.variants[0].originalPrice.toLocaleString()}
                                                </span>
                                            )}
                                        </div>

                                        {/* Move to Cart Button */}
                                        <button
                                            onClick={() => handleMoveToCart(product)}
                                            className="w-full flex items-center justify-center px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                                        >
                                            <ShoppingCart className="h-4 w-4 mr-2" />
                                            Move to Cart
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Clear Wishlist Confirmation Modal */}
            {showClearModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-red-100 rounded-full">
                                    <AlertTriangle className="h-6 w-6 text-red-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Clear Wishlist
                                </h3>
                            </div>
                            <button
                                onClick={() => setShowClearModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="h-5 w-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6">
                            <p className="text-gray-600 mb-6">
                                Are you sure you want to clear your entire wishlist? This action cannot be undone and will remove all {wishlistCount} {wishlistCount === 1 ? 'item' : 'items'} from your wishlist.
                            </p>

                            {/* Action Buttons */}
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setShowClearModal(false)}
                                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={clearWishlist}
                                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-red-600 rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    Clear Wishlist
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}