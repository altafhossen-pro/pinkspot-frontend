'use client'

import { useState, useRef } from 'react'
import { Upload, X, Plus } from 'lucide-react'
import { uploadAPI } from '@/services/api'

export default function GalleryImageUpload({ 
    onImagesChange, 
    currentImages = [], 
    label = 'Gallery Images',
    maxImages = 10,
    maxSize = 5, // 5MB
    className = ''
}) {
    const [uploading, setUploading] = useState(false)
    const [dragActive, setDragActive] = useState(false)
    const [error, setError] = useState('')
    const fileInputRef = useRef(null)

    const handleFileUpload = async (file) => {
        if (!file) return

        // Check if we've reached max images
        if (currentImages.length >= maxImages) {
            setError(`Maximum ${maxImages} images allowed`)
            return
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file')
            return
        }

        // Validate file size (MB)
        const fileSizeMB = file.size / (1024 * 1024)
        if (fileSizeMB > maxSize) {
            setError(`File size must be less than ${maxSize}MB`)
            return
        }

        setError('')
        setUploading(true)

        try {
            const formData = new FormData()
            formData.append('image', file)

            const data = await uploadAPI.uploadSingle(formData)

            if (data.success) {
                const newImage = {
                    url: data.data.url,
                    altText: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension for alt text
                    sortOrder: currentImages.length
                }
                
                const updatedImages = [...currentImages, newImage]
                onImagesChange(updatedImages)
            } else {
                setError(data.message || 'Upload failed')
            }
        } catch (error) {
            console.error('Upload error:', error)
            setError('Upload failed. Please try again.')
        } finally {
            setUploading(false)
        }
    }

    const handleDrag = (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true)
        } else if (e.type === 'dragleave') {
            setDragActive(false)
        }
    }

    const handleDrop = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files[0])
        }
    }

    const handleFileInput = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0])
        }
    }

    const handleRemoveImage = (index) => {
        const updatedImages = currentImages.filter((_, i) => i !== index)
        
        // Update sort order
        updatedImages.forEach((img, i) => {
            img.sortOrder = i
        })
        
        onImagesChange(updatedImages)
    }

    const handleReorder = (fromIndex, toIndex) => {
        const updatedImages = [...currentImages]
        const [movedImage] = updatedImages.splice(fromIndex, 1)
        updatedImages.splice(toIndex, 0, movedImage)
        
        // Update sort order
        updatedImages.forEach((img, i) => {
            img.sortOrder = i
        })
        
        onImagesChange(updatedImages)
    }

    return (
        <div className={`space-y-4 ${className}`}>
            <label className="block text-sm font-medium text-gray-700">
                {label} ({currentImages.length}/{maxImages})
            </label>

            {/* Current Images Grid */}
            {currentImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {currentImages.map((image, index) => (
                        <div key={index} className="relative group">
                            <img
                                src={image.url}
                                alt={image.altText || `Product image ${index + 1}`}
                                className="h-32 w-full object-cover rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-all"
                            />
                            
                            {/* Actions Overlay */}
                            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                <button
                                    type="button"
                                    onClick={() => handleRemoveImage(index)}
                                    className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600"
                                    title="Remove image"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                            
                            {/* Drag Handle */}
                            <div className="absolute bottom-2 right-2 bg-white/80 rounded-full p-1 cursor-move">
                                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                                </svg>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Area */}
            {currentImages.length < maxImages && (
                <div
                    className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                        dragActive
                            ? 'border-blue-400 bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileInput}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={uploading}
                    />
                    
                    <div className="space-y-2">
                        {uploading ? (
                            <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                <span className="ml-2 text-sm text-gray-600">Uploading...</span>
                            </div>
                        ) : (
                            <>
                                <Plus className="mx-auto h-12 w-12 text-gray-400" />
                                <div className="text-sm text-gray-600">
                                    <span className="font-medium text-blue-600 hover:text-blue-500">
                                        Click to upload
                                    </span>{' '}
                                    or drag and drop
                                </div>
                                <p className="text-xs text-gray-500">
                                    PNG, JPG, GIF up to {maxSize}MB • Max {maxImages} images
                                </p>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <p className="text-sm text-red-600">{error}</p>
            )}

            {/* Upload Button (when images exist) */}
            {currentImages.length > 0 && currentImages.length < maxImages && (
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? 'Uploading...' : 'Add More Images'}
                </button>
            )}
        </div>
    )
}
