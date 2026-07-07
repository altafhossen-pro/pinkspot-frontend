'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
    ArrowLeft, 
    Edit, 
    Trash2, 
    Calendar, 
    Tag,
    Star,
    ShoppingCart,
    AlertCircle,
    CheckCircle,
    Clock
} from 'lucide-react'
import { getCookie } from 'cookies-next'
import toast from 'react-hot-toast'
import { categoryAPI } from '@/services/api'
import DeleteConfirmationModal from '@/components/Common/DeleteConfirmationModal'
import { useAppContext } from '@/context/AppContext'
import PermissionDenied from '@/components/Common/PermissionDenied'

export default function CategoryDetailPage() {
    const params = useParams()
    const router = useRouter()
    const categoryId = params.id
    const { hasPermission, contextLoading } = useAppContext()

    const [category, setCategory] = useState(null)
    const [loading, setLoading] = useState(true)
    const [deleteLoading, setDeleteLoading] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [checkingPermission, setCheckingPermission] = useState(true)
    const [hasReadPermission, setHasReadPermission] = useState(false)
    const [permissionError, setPermissionError] = useState(null)

    useEffect(() => {
        if (!categoryId) return
        if (contextLoading) return
        const canRead = hasPermission('category', 'read')
        setHasReadPermission(canRead)
        setCheckingPermission(false)
        if (canRead) {
            fetchCategoryDetails()
        } else {
            setLoading(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [categoryId, contextLoading])

    const fetchCategoryDetails = async () => {
        try {
            setLoading(true)
            const data = await categoryAPI.getCategoryById(categoryId)

            if (data.success) {
                setCategory(data.data)
            } else {
                if (data.status === 403) {
                    setPermissionError(data.message || "You don't have permission to read categories")
                } else {
                    toast.error(data.message || 'Failed to fetch category details')
                    router.push('/admin/dashboard/categories')
                }
            }
        } catch (error) {
            console.error('Error fetching category details:', error)
            if (error?.status === 403) {
                setPermissionError(error?.data?.message || "You don't have permission to read categories")
            } else {
                toast.error('Error fetching category details')
                router.push('/admin/dashboard/categories')
            }
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        try {
            setDeleteLoading(true)
            const token = getCookie('token')
            const data = await categoryAPI.deleteCategory(categoryId)

            if (data.success) {
                toast.success('Category deleted successfully')
                router.push('/admin/dashboard/categories')
            } else {
                toast.error(data.message || 'Failed to delete category')
            }
        } catch (error) {
            console.error('Error deleting category:', error)
            toast.error('Error deleting category')
        } finally {
            setDeleteLoading(false)
            setShowDeleteModal(false)
        }
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (checkingPermission || contextLoading || loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-500 border-t-transparent"></div>
                    <p className="text-gray-600 font-medium">Loading category details...</p>
                </div>
            </div>
        )
    }

    if (!hasReadPermission || permissionError) {
        return (
            <PermissionDenied 
                title="Access Denied"
                message={permissionError || "You don't have permission to view this category"}
                action="Contact your administrator for access"
                showBackButton={true}
            />
        )
    }

    if (!category) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Category not found</h3>
                    <p className="text-gray-600 mb-4">The category you're looking for doesn't exist.</p>
                    <Link
                        href="/admin/dashboard/categories"
                        className="inline-flex items-center px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Categories
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        <div className="flex items-center space-x-4">
                            <Link
                                href="/admin/dashboard/categories"
                                className="flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors mt-1"
                            >
                                <ArrowLeft className="h-5 w-5 text-gray-600" />
                            </Link>
                            <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                   
                                    <h1 className="text-2xl font-bold text-gray-900">{category.name}</h1>
                                </div>
                                <p className="text-gray-600 text-sm">Category Management • View and manage category details</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            {hasPermission('category','update') && (
                                <Link
                                    href={`/admin/dashboard/categories/${categoryId}/edit`}
                                    className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                                >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Category
                                </Link>
                            )}
                            {hasPermission('category','delete') && (
                                <button
                                    onClick={() => setShowDeleteModal(true)}
                                    className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 font-medium shadow-sm hover:shadow-md cursor-pointer"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Category Information */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">Category Information</h2>

                            <div className="space-y-6">
                                {/* Basic Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Category Name</label>
                                        <p className="text-lg font-semibold text-gray-900">{category.name}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Slug</label>
                                        <p className="text-lg font-mono text-gray-600">{category.slug}</p>
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                    <p className="text-gray-900 bg-gray-50 rounded-lg p-4">
                                        {category.description || 'No description provided'}
                                    </p>
                                </div>

                                {/* Status */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                    <div className="flex items-center space-x-2">
                                        {category.isActive ? (
                                            <>
                                                <CheckCircle className="h-5 w-5 text-green-500" />
                                                <span className="text-green-700 font-medium">Active</span>
                                            </>
                                        ) : (
                                            <>
                                                <Clock className="h-5 w-5 text-gray-400" />
                                                <span className="text-gray-500 font-medium">Inactive</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* SEO Information */}
                                <div className="border-t pt-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">SEO Information</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Meta Title</label>
                                            <p className="text-gray-900 bg-gray-50 rounded-lg p-3">
                                                {category.metaTitle || 'No meta title set'}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Meta Description</label>
                                            <p className="text-gray-900 bg-gray-50 rounded-lg p-3">
                                                {category.metaDescription || 'No meta description set'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        {/* Timestamps */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Timestamps</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                                    <p className="text-sm text-gray-600">
                                        {formatDate(category.createdAt)}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                                    <p className="text-sm text-gray-600">
                                        {formatDate(category.updatedAt)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Delete Confirmation Modal */}
                <DeleteConfirmationModal
                    isOpen={showDeleteModal}
                    onClose={() => setShowDeleteModal(false)}
                    onConfirm={handleDelete}
                    title="Delete Category"
                    message="Are you sure you want to delete this category?"
                    itemName={category?.name}
                    itemType="category"
                    isLoading={deleteLoading}
                    confirmText="Delete Category"
                    cancelText="Cancel"
                    dangerLevel="high"
                />
            </div>
        </div>
    )
}
