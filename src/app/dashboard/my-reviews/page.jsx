'use client'

import { useState, useEffect } from 'react'
import { 
    Star, 
    MessageSquare, 
    Calendar, 
    Package, 
    CheckCircle,
    RefreshCw,
    Plus,
    Trash2
} from 'lucide-react'
import { useAppContext } from '@/context/AppContext'
import { reviewAPI } from '@/services/api'
import toast from 'react-hot-toast'
import ReviewModal from '@/components/Review/ReviewModal'

export default function MyReviews() {
    const { token, isAuthenticated } = useAppContext()
    const [activeTab, setActiveTab] = useState('reviewable')
    const [reviewableProducts, setReviewableProducts] = useState([])
    const [myReviews, setMyReviews] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedProduct, setSelectedProduct] = useState(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    const fetchReviewableProducts = async () => {
        if (!isAuthenticated || !token) return

        try {
            setLoading(true)
            const response = await reviewAPI.getUserReviewableProducts(token)
            
            if (response.success) {
                setReviewableProducts(response.data)
            } else {
                toast.error(response.message || 'Failed to fetch reviewable products')
            }
        } catch (error) {
            console.error('Error fetching reviewable products:', error)
            toast.error('Failed to fetch reviewable products')
        } finally {
            setLoading(false)
        }
    }

    const fetchMyReviews = async () => {
        if (!isAuthenticated || !token) return

        try {
            setLoading(true)
            const response = await reviewAPI.getUserReviews(token)
            
            if (response.success) {
                setMyReviews(response.data)
            } else {
                toast.error(response.message || 'Failed to fetch your reviews')
            }
        } catch (error) {
            console.error('Error fetching reviews:', error)
            toast.error('Failed to fetch your reviews')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (isAuthenticated && token) {
            if (activeTab === 'reviewable') {
                fetchReviewableProducts()
            } else {
                fetchMyReviews()
            }
        }
    }, [isAuthenticated, token, activeTab])

    const handleWriteReview = (product) => {
        setSelectedProduct(product)
        setIsModalOpen(true)
    }

    const handleReviewSubmitted = () => {
        fetchReviewableProducts()
        fetchMyReviews()
    }

    const handleDeleteReview = async (reviewId) => {
        if (!confirm('Are you sure you want to delete this review?')) return

        try {
            const response = await reviewAPI.deleteReview(reviewId, token)
            
            if (response.success) {
                toast.success('Review deleted successfully')
                // Update both tabs in realtime
                fetchMyReviews()
                fetchReviewableProducts()
            } else {
                toast.error(response.message || 'Failed to delete review')
            }
        } catch (error) {
            console.error('Error deleting review:', error)
            toast.error('Failed to delete review')
        }
    }

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const renderStars = (rating) => {
        return (
            <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`h-4 w-4 ${
                            star <= rating
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                        }`}
                    />
                ))}
            </div>
        )
    }

    if (!isAuthenticated) {
        return (
            <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">My Reviews</h1>
                    <p className="text-gray-600">Please login to view your reviews</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">My Reviews</h1>
                <p className="text-gray-600">Manage your product reviews and write new ones</p>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8 px-6">
                        <button
                            onClick={() => setActiveTab('reviewable')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'reviewable'
                                    ? 'border-pink-500 text-pink-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Products to Review ({reviewableProducts.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('my-reviews')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'my-reviews'
                                    ? 'border-pink-500 text-pink-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            My Reviews ({myReviews.length})
                        </button>
                    </nav>
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <RefreshCw className="h-8 w-8 text-gray-400 animate-spin" />
                            <span className="ml-2 text-gray-600">Loading...</span>
                        </div>
                    ) : (
                        <>
                            {/* Reviewable Products Tab */}
                            {activeTab === 'reviewable' && (
                                <div className="space-y-4">
                                    {reviewableProducts.length === 0 ? (
                                        <div className="text-center py-12">
                                            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">No products to review</h3>
                                            <p className="text-gray-500">You don't have any delivered products that need reviews yet.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {reviewableProducts.map((item, index) => (
                                                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                                    <div className="flex items-start space-x-4">
                                                        <img
                                                            src={item.product.featuredImage || '/images/placeholder.png'}
                                                            alt={item.product.title}
                                                            className="h-16 w-16 object-cover rounded-lg"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="font-medium text-gray-900 truncate">
                                                                {item.product.title}
                                                            </h3>
                                                            <p className="text-sm text-gray-500 mt-1">
                                                                Order #{item.orderId}
                                                            </p>
                                                            <p className="text-sm text-gray-500">
                                                                Delivered on {formatDate(item.orderDate)}
                                                            </p>
                                                            <div className="mt-3">
                                                                <button
                                                                    onClick={() => handleWriteReview(item)}
                                                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                                                                >
                                                                    <Plus className="h-4 w-4 mr-2" />
                                                                    Write Review
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* My Reviews Tab */}
                            {activeTab === 'my-reviews' && (
                                <div className="space-y-4">
                                    {myReviews.length === 0 ? (
                                        <div className="text-center py-12">
                                            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
                                            <p className="text-gray-500">You haven't written any reviews yet.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {myReviews.map((review) => (
                                                <div key={review._id} className="border border-gray-200 rounded-lg p-6">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-start space-x-4 flex-1">
                                                            <img
                                                                src={review.product.featuredImage || '/images/placeholder.png'}
                                                                alt={review.product.title}
                                                                className="h-16 w-16 object-cover rounded-lg"
                                                            />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center space-x-2 mb-2">
                                                                    <h3 className="font-medium text-gray-900">
                                                                        {review.product.title}
                                                                    </h3>
                                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                                        Verified Purchase
                                                                    </span>
                                                                </div>
                                                                
                                                                <div className="flex items-center space-x-4 mb-3">
                                                                    {renderStars(review.rating)}
                                                                    <span className="text-sm text-gray-500">
                                                                        {formatDate(review.createdAt)}
                                                                    </span>
                                                                </div>

                                                                {review.title && (
                                                                    <h4 className="font-medium text-gray-900 mb-2">
                                                                        {review.title}
                                                                    </h4>
                                                                )}

                                                                {review.comment && (
                                                                    <p className="text-gray-700 mb-4">
                                                                        {review.comment}
                                                                    </p>
                                                                )}

                                                                {review.images && review.images.length > 0 && (
                                                                    <div className="flex space-x-2 mb-4">
                                                                        {review.images.map((image, index) => (
                                                                            <img
                                                                                key={index}
                                                                                src={image}
                                                                                alt={`Review image ${index + 1}`}
                                                                                className="h-16 w-16 object-cover rounded-lg"
                                                                            />
                                                                        ))}
                                                                    </div>
                                                                )}

                                                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                                                    <span className="flex items-center">
                                                                        <MessageSquare className="h-4 w-4 mr-1" />
                                                                        {review.helpfulCount} helpful
                                                                    </span>
                                                                    <span className="flex items-center">
                                                                        <Calendar className="h-4 w-4 mr-1" />
                                                                        {formatDate(review.createdAt)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center space-x-2">
                                                            <button
                                                                onClick={() => handleDeleteReview(review._id)}
                                                                className="text-red-600 hover:text-red-800 p-2"
                                                                title="Delete review"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
        </div>

            {/* Review Modal */}
            {isModalOpen && selectedProduct && (
                <ReviewModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    product={selectedProduct}
                    onReviewSubmitted={handleReviewSubmitted}
                />
            )}
        </div>
    )
}