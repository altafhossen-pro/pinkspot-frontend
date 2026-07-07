'use client'

import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { uploadAPI } from '@/services/api'
import { toast } from 'react-hot-toast'

export default function ImageUpload({ 
    onImageUpload, 
    onImageRemove, 
    currentImage = '', 
    label = 'Upload Image',
    accept = 'image/*',
    maxSize = 5, // 5MB
    className = ''
}) {
    const [uploading, setUploading] = useState(false)
    const [dragActive, setDragActive] = useState(false)
    const [error, setError] = useState('')
    const fileInputRef = useRef(null)

    const handleFileUpload = async (file) => {
        if (!file) return

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file')
            toast.error('Please select an image file')
            return
        }

        // Validate file size (MB)
        const fileSizeMB = file.size / (1024 * 1024)
        if (fileSizeMB > maxSize) {
            setError(`File size must be less than ${maxSize}MB`)
            toast.error(`File size must be less than ${maxSize}MB`)
            return
        }

        setError('')
        setUploading(true)

        // Show loading toast
        const loadingToast = toast.loading('Uploading image...')

        try {
            const formData = new FormData()
            formData.append('image', file)

            const data = await uploadAPI.uploadSingle(formData)

            if (data.success) {
                onImageUpload(data.data.url)
                toast.success('Image uploaded successfully!', { id: loadingToast })
            } else {
                setError(data.message || 'Upload failed')
                toast.error(data.message || 'Upload failed', { id: loadingToast })
            }
        } catch (error) {
            console.error('Upload error:', error)
            setError('Upload failed. Please try again.')
            toast.error('Upload failed. Please try again.', { id: loadingToast })
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

    const handleRemoveImage = () => {
        onImageRemove()
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    return (
        <div className={`space-y-4 ${className}`}>
            <label className="block text-sm font-medium text-gray-700">
                {label}
            </label>

            {/* Current Image Display */}
            {currentImage && (
                <div className="relative inline-block">
                    <img
                        src={currentImage}
                        alt="Current"
                        className="h-32 w-32 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* Upload Area */}
            <div
                className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    dragActive
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                } ${currentImage ? 'hidden' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={accept}
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
                            <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="text-sm text-gray-600">
                                <span className="font-medium text-blue-600 hover:text-blue-500">
                                    Click to upload
                                </span>{' '}
                                or drag and drop
                            </div>
                            <p className="text-xs text-gray-500">
                                PNG, JPG, GIF up to {maxSize}MB
                            </p>
                        </>
                    )}
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <p className="text-sm text-red-600">{error}</p>
            )}

            {/* Upload Button (when current image exists) */}
            {currentImage && (
                <div className="space-y-2">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                        <Upload className="h-4 w-4 mr-2" />
                        {uploading ? 'Uploading...' : 'Change Image'}
                    </button>
                    <p className="text-xs text-gray-500">
                        Click to select a new image or drag and drop
                    </p>
                </div>
            )}
        </div>
    )
}
