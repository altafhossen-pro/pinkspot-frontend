'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Edit, Trash2, Eye, Search, FolderOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import { categoryAPI } from '@/services/api'
import DeleteConfirmationModal from '@/components/Common/DeleteConfirmationModal'
import { useAppContext } from '@/context/AppContext'
import PermissionDenied from '@/components/Common/PermissionDenied'

export default function AdminCategoriesPage() {
    const { hasPermission, contextLoading } = useAppContext()
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, categoryId: null, categoryName: '' })
    const [isDeleting, setIsDeleting] = useState(false)
    const [checkingPermission, setCheckingPermission] = useState(true)
    const [hasReadPermission, setHasReadPermission] = useState(false)
    const [permissionError, setPermissionError] = useState(null)

    useEffect(() => {
        if (contextLoading) return
        const canRead = hasPermission('category', 'read')
        setHasReadPermission(canRead)
        setCheckingPermission(false)
        if (canRead) {
            fetchCategories()
        } else {
            setLoading(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [contextLoading])

    const fetchCategories = async () => {
        try {
            setLoading(true)
            const data = await categoryAPI.getCategories()
            
            if (data.success) {
                setCategories(data.data)
                setPermissionError(null)
            } else {
                if (data.status === 403) {
                    setPermissionError(data.message || "You don't have permission to read categories")
                } else {
                    console.error('Failed to fetch categories:', data.message)
                }
            }
        } catch (error) {
            if (error?.status === 403) {
                setPermissionError(error?.data?.message || "You don't have permission to read categories")
            } else {
                console.error('Error fetching categories:', error)
            }
        } finally {
            setLoading(false)
        }
    }

    const openDeleteModal = (categoryId, categoryName) => {
        setDeleteModal({
            isOpen: true,
            categoryId,
            categoryName
        })
    }

    const closeDeleteModal = () => {
        setDeleteModal({
            isOpen: false,
            categoryId: null,
            categoryName: ''
        })
    }

    const handleDeleteCategory = async () => {
        try {
            setIsDeleting(true)
            const data = await categoryAPI.deleteCategory(deleteModal.categoryId)
            
            if (data.success) {
                toast.success('Category deleted successfully!')
                fetchCategories() // Refresh the list
                closeDeleteModal()
            } else {
                toast.error('Failed to delete category: ' + data.message)
            }
        } catch (error) {
            console.error('Error deleting category:', error)
            toast.error('Error deleting category')
        } finally {
            setIsDeleting(false)
        }
    }

    const filteredCategories = categories.filter(category => {
        return category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
               category.slug.toLowerCase().includes(searchTerm.toLowerCase())
    })

    const getParentCategoryName = (parent) => {
        if (!parent) return 'None'
        return parent.name
    }

    const getChildrenCount = (children) => {
        if (!children || children.length === 0) return 0
        return children.length
    }

    if (checkingPermission || contextLoading || loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (!hasReadPermission || permissionError) {
        return (
            <PermissionDenied
                title="Access Denied"
                message={permissionError || "You don't have permission to access categories"}
                action="Contact your administrator for access"
                showBackButton={true}
            />
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Manage your product categories
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        {hasPermission('category','create') && (
                            <Link
                                href="/admin/dashboard/categories/create"
                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 cursor-pointer"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Create Category
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search categories..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-text"
                    />
                </div>
            </div>

            {/* Categories Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Category
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Slug
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Parent Category
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Sub Categories
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Featured
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
                            {filteredCategories.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                                        {searchTerm ? 'No categories found matching your search.' : 'No categories found.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredCategories.map((category) => (
                                    <tr key={category._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    {category.image ? (
                                                        <img
                                                            className="h-10 w-10 rounded-lg object-cover"
                                                            src={category.image}
                                                            alt={category.name}
                                                        />
                                                    ) : (
                                                        <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                                                            <FolderOpen className="h-5 w-5 text-gray-400" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {category.name}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {category.slug}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {getParentCategoryName(category.parent)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {getChildrenCount(category.children)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {category.isFeatured ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    Featured
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                    Regular
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(category.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-2">
                                                {hasPermission('category','read') && (
                                                    <Link
                                                        href={`/admin/dashboard/categories/${category._id}`}
                                                        className="text-blue-600 hover:text-blue-900 p-1 cursor-pointer"
                                                        title="View"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                )}
                                                {hasPermission('category','update') && (
                                                    <Link
                                                        href={`/admin/dashboard/categories/${category._id}/edit`}
                                                        className="text-indigo-600 hover:text-indigo-900 p-1 cursor-pointer"
                                                        title="Edit"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Link>
                                                )}
                                                {hasPermission('category','delete') && (
                                                    <button
                                                        onClick={() => openDeleteModal(category._id, category.name)}
                                                        className="text-red-600 hover:text-red-900 p-1 cursor-pointer"
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
                </div>
            </div>

            {/* Summary */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm text-gray-500">
                    Showing {filteredCategories.length} of {categories.length} categories
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={closeDeleteModal}
                onConfirm={handleDeleteCategory}
                title="Delete Category"
                message="Are you sure you want to delete this category?"
                itemName={deleteModal.categoryName}
                itemType="category"
                isLoading={isDeleting}
                confirmText="Delete Category"
                cancelText="Cancel"
                dangerLevel="high"
            />
        </div>
    )
}
