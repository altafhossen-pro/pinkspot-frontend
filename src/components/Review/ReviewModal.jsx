'use client'

import { useState } from 'react'
import { X, Star, Upload, Image as ImageIcon, Trash2 } from 'lucide-react'
import { reviewAPI, uploadAPI } from '@/services/api'
import toast from 'react-hot-toast'
import { getCookie } from 'cookies-next'

export default function ReviewModal({ isOpen, onClose, product, onReviewSubmitted }) {
    const [rating, setRating] = useState(0)
    const [comment, setComment] = useState('')
    const [images, setImages] = useState([])
    const [imageFiles, setImageFiles] = useState([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isUploadingImages, setIsUploadingImages] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (rating === 0) {
            toast.error('Please select a rating')
            return
        }

        if (!comment.trim()) {
            toast.error('Please write a review')
            return
        }

        try {
            setIsSubmitting(true)
            const token = getCookie('token');

            if (!token) {
                toast.error('Please login to submit a review')
                return
            }

            // Upload images first if any
            let uploadedImageUrls = []
            if (imageFiles.length > 0) {
                setIsUploadingImages(true)
                try {
                    const uploadPromises = imageFiles.map(async (file) => {
                        const formData = new FormData()
                        formData.append('image', file)
                        const response = await uploadAPI.uploadSingle(formData)
                        if (response.success) {
                            return response.data.url
                        }
                        throw new Error(response.message || 'Failed to upload image')
                    })
                    
                    uploadedImageUrls = await Promise.all(uploadPromises)
                } catch (error) {
                    console.error('Error uploading images:', error)
                    toast.error('Failed to upload images')
                    return
                } finally {
                    setIsUploadingImages(false)
                }
            }

            const reviewData = {
                productId: product.product._id,
                rating,
                comment: comment.trim(),
                images: uploadedImageUrls
            }


            const response = await reviewAPI.createReview(reviewData, token)

            if (response.success) {
                toast.success('🎉 Review submitted successfully! Thank you for your feedback.')
                onReviewSubmitted()
                handleClose()
            } else {
                toast.error(response.message || 'Failed to submit review')
            }
        } catch (error) {
            console.error('Error submitting review:', error)
            toast.error('Failed to submit review')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleClose = () => {
        setRating(0)
        setComment('')
        setImages([])
        setImageFiles([])
        onClose()
    }

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files)
        if (imageFiles.length + files.length > 5) {
            toast.error('You can upload maximum 5 images')
            return
        }
        
        files.forEach(file => {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                toast.error('Image size should be less than 5MB')
                return
            }
            
            // Add file to imageFiles array
            setImageFiles(prev => [...prev, file])
            
            // Create preview URL for display
            const reader = new FileReader()
            reader.onload = (e) => {
                setImages(prev => [...prev, e.target.result])
            }
            reader.readAsDataURL(file)
        })
    }

    const removeImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index))
        setImageFiles(prev => prev.filter((_, i) => i !== index))
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Write a Review</h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Product Info */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-4">
                        <img
                            src={product.product.featuredImage || '/images/placeholder.png'}
                            alt={product.product.title}
                            className="h-16 w-16 object-cover rounded-lg"
                        />
                        <div>
                            <h3 className="font-medium text-gray-900">{product.product.title}</h3>
                            <p className="text-sm text-gray-500">Order #{product.orderId}</p>
                            <p className="text-sm text-gray-500">
                                Purchased on {new Date(product.orderDate).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Review Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Rating */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Rating *
                        </label>
                        <div className="flex space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className="focus:outline-none"
                                >
                                    <Star
                                        className={`h-8 w-8 ${star <= rating
                                                ? 'text-yellow-400 fill-current'
                                                : 'text-gray-300'
                                            }`}
                                    />
                                </button>
                            ))}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                            {rating === 0 && 'Click to rate'}
                            {rating === 1 && 'Poor'}
                            {rating === 2 && 'Fair'}
                            {rating === 3 && 'Good'}
                            {rating === 4 && 'Very Good'}
                            {rating === 5 && 'Excellent'}
                        </p>
                    </div>

                    {/* Comment */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Your Review *
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Tell us about your experience with this product..."
                            rows={5}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                            maxLength={1000}
                        />
                        <p className="text-sm text-gray-500 mt-1">{comment.length}/1000</p>
                    </div>

                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Photos (Optional)
                        </label>
                        <div className="space-y-4">
                            <div className="flex items-center justify-center w-full">
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <Upload className="w-8 h-8 mb-2 text-gray-400" />
                                        <p className="mb-2 text-sm text-gray-500">
                                            <span className="font-semibold">Click to upload</span> or drag and drop
                                        </p>
                                        <p className="text-xs text-gray-500">PNG, JPG up to 5MB (max 5 images)</p>
                                    </div>
                                    <input
                                        type="file"
                                        className="hidden"
                                        multiple
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                    />
                                </label>
                            </div>

                            {/* Image Preview */}
                            {images.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {images.map((image, index) => (
                                        <div key={index} className="relative">
                                            <img
                                                src={image}
                                                alt={`Review image ${index + 1}`}
                                                className="w-full h-24 object-cover rounded-lg"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(index)}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || isUploadingImages}
                            className="px-4 py-2 text-sm font-medium text-white bg-pink-600 border border-transparent rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isUploadingImages ? 'Uploading Images...' : isSubmitting ? 'Submitting...' : 'Submit Review'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
