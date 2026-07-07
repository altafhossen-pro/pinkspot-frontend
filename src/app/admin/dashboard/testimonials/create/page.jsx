'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload, X, Image as ImageIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { testimonialAPI, uploadAPI } from '@/services/api'
import { getCookie } from 'cookies-next'
import { useAppContext } from '@/context/AppContext'
import PermissionDenied from '@/components/Common/PermissionDenied'

export default function CreateTestimonialPage() {
    const router = useRouter()
    const { hasPermission, contextLoading } = useAppContext()
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [formData, setFormData] = useState({
        image: '',
        isActive: true,
        order: 0
    })
    const [previewImage, setPreviewImage] = useState('')
    const [checkingPermission, setCheckingPermission] = useState(true)
    const [hasCreatePermission, setHasCreatePermission] = useState(false)
    const [permissionError, setPermissionError] = useState(null)

    useEffect(() => {
        if (contextLoading) return
        const canCreate = hasPermission('testimonial', 'create')
        setHasCreatePermission(!!canCreate)
        setCheckingPermission(false)
        if (canCreate) {
            fetchHighestOrder()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [contextLoading])

    const fetchHighestOrder = async () => {
        try {
            const token = getCookie('token')
            const response = await testimonialAPI.getTestimonials({ limit: 1, sort: 'order' }, token)
            
            if (response.success && response.data.testimonials.length > 0) {
                const highestOrder = response.data.testimonials[0].order
                setFormData(prev => ({
                    ...prev,
                    order: highestOrder + 1
                }))
            } else {
                setFormData(prev => ({
                    ...prev,
                    order: 1
                }))
            }
        } catch (error) {
            console.error('Error fetching highest order:', error)
            setFormData(prev => ({
                ...prev,
                order: 1
            }))
        }
    }

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))
        if (name === 'image') {
            setPreviewImage(value)
        }
    }

    const handleImageUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            toast.error('Please select a valid image file')
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size should be less than 5MB')
            return
        }

        try {
            setUploading(true)
            const uploadData = new FormData()
            uploadData.append('image', file)

            const response = await uploadAPI.uploadSingle(uploadData)
            
            if (response.success) {
                const imageUrl = response.data.url || response.data.imageUrl
                setFormData(prev => ({
                    ...prev,
                    image: imageUrl
                }))
                setPreviewImage(imageUrl)
                toast.success('Image uploaded successfully!')
            } else {
                toast.error('Failed to upload image: ' + response.message)
            }
        } catch (error) {
            console.error('Error uploading image:', error)
            toast.error('Error uploading image')
        } finally {
            setUploading(false)
        }
    }

    const handleRemoveImage = () => {
        setFormData(prev => ({
            ...prev,
            image: ''
        }))
        setPreviewImage('')
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        if (!formData.image) {
            toast.error('Please provide a testimonial screenshot (URL or upload)')
            return
        }

        if (!hasCreatePermission) {
            toast.error("You don't have permission to create testimonials")
            return
        }
        try {
            setLoading(true)
            const token = getCookie('token')
            
            const response = await testimonialAPI.createTestimonial(formData,token)
            
            if (response.success) {
                toast.success('Testimonial created successfully!')
                router.push('/admin/dashboard/testimonials')
            } else {
                toast.error('Failed to create testimonial: ' + response.message)
            }
        } catch (error) {
            console.error('Error creating testimonial:', error)
            toast.error('Error creating testimonial')
        } finally {
            setLoading(false)
        }
    }

    if (checkingPermission || contextLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (!hasCreatePermission || permissionError) {
        return (
            <PermissionDenied
                title="Access Denied"
                message={permissionError || "You don't have permission to create testimonials"}
                action="Contact your administrator for access"
                showBackButton={true}
            />
        )
    }

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link
                            href="/admin/dashboard/testimonials"
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5 text-gray-600" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Create Testimonial</h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Add a new customer testimonial screenshot
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* Testimonial Image */}
                        <div className="lg:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Testimonial Screenshot *
                            </label>
                            
                            <div className="mb-4">
                                <label className="block text-xs text-gray-500 mb-1">Image URL</label>
                                <input
                                    type="text"
                                    name="image"
                                    value={formData.image}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Paste image URL here or upload below"
                                />
                            </div>

                            <div className="flex items-start space-x-4">
                                {previewImage ? (
                                    <div className="relative">
                                        <img
                                            src={previewImage}
                                            alt="Testimonial preview"
                                            className="w-48 h-auto object-contain border-2 border-gray-200 rounded"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleRemoveImage}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-48 h-32 bg-gray-100 rounded flex items-center justify-center border-2 border-dashed border-gray-300">
                                        <ImageIcon className="w-8 h-8 text-gray-400" />
                                    </div>
                                )}
                                
                                <div className="flex-1 mt-2">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        disabled={uploading}
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                                    />
                                    {uploading && (
                                        <p className="mt-1 text-sm text-blue-600">Uploading...</p>
                                    )}
                                    <p className="mt-2 text-xs text-gray-500">
                                        You can either upload an image from your computer or paste an image URL above.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Order */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Display Order
                            </label>
                            <input
                                type="number"
                                name="order"
                                value={formData.order}
                                onChange={handleInputChange}
                                min="1"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Auto-assigned based on existing testimonials"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Automatically set to next available order. Lower numbers appear first.
                            </p>
                        </div>

                        {/* Status */}
                        <div className="lg:col-span-2">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="isActive"
                                    checked={formData.isActive}
                                    onChange={handleInputChange}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label className="ml-2 block text-sm text-gray-700">
                                    Active (visible on website)
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                        <Link
                            href="/admin/dashboard/testimonials"
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={loading || uploading}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? 'Creating...' : 'Create Testimonial'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
