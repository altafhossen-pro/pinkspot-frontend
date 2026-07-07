'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Edit, Trash2, Eye, Search, Star, StarOff, StarIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { testimonialAPI } from '@/services/api'
import { getCookie } from 'cookies-next'
import { useAppContext } from '@/context/AppContext'
import PermissionDenied from '@/components/Common/PermissionDenied'
import DeleteConfirmationModal from '@/components/Common/DeleteConfirmationModal'

export default function AdminTestimonialsPage() {
    const { hasPermission, contextLoading } = useAppContext()
    const [testimonials, setTestimonials] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchLoading, setSearchLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)
    const [itemsPerPage, setItemsPerPage] = useState(10)
    const [checkingPermission, setCheckingPermission] = useState(true)
    const [hasReadPermission, setHasReadPermission] = useState(false)
    const [hasCreatePermission, setHasCreatePermission] = useState(false)
    const [hasUpdatePermission, setHasUpdatePermission] = useState(false)
    const [hasDeletePermission, setHasDeletePermission] = useState(false)
    const [permissionError, setPermissionError] = useState(null)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [testimonialToDelete, setTestimonialToDelete] = useState(null)
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        if (contextLoading) return
        const canRead = hasPermission('testimonial', 'read')
        const canCreate = hasPermission('testimonial', 'create')
        const canUpdate = hasPermission('testimonial', 'update')
        const canDelete = hasPermission('testimonial', 'delete')
        setHasReadPermission(canRead)
        setHasCreatePermission(!!canCreate)
        setHasUpdatePermission(!!canUpdate)
        setHasDeletePermission(!!canDelete)
        setCheckingPermission(false)
        if (canRead) {
            fetchTestimonials()
        } else {
            setLoading(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [contextLoading, currentPage, itemsPerPage, statusFilter])

    // Debounce search term
    useEffect(() => {
        setSearchLoading(true)
        const timeoutId = setTimeout(() => {
            fetchTestimonials()
        }, 500) // 500ms delay

        return () => clearTimeout(timeoutId)
    }, [searchTerm])

    const fetchTestimonials = async () => {
        try {
            setLoading(true)
            const token = getCookie('token')
            
            const params = {
                page: currentPage,
                limit: itemsPerPage,
            }
            
            if (searchTerm) {
                params.search = searchTerm
            }
            
            if (statusFilter) {
                params.isActive = statusFilter
            }

            const data = await testimonialAPI.getTestimonials(params,token)
            
            if (data.success) {
                setTestimonials(data.data.testimonials)
                setTotalPages(data.data.pagination.totalPages)
                setTotalItems(data.data.pagination.totalItems)
            } else {
                if (data.status === 403) {
                    setPermissionError(data.message || "You don't have permission to read testimonials")
                } else {
                    console.error('Failed to fetch testimonials:', data.message)
                    toast.error('Failed to fetch testimonials')
                }
            }
        } catch (error) {
            console.error('Error fetching testimonials:', error)
            if (error?.status === 403) {
                setPermissionError(error?.data?.message || "You don't have permission to read testimonials")
            } else {
                toast.error('Error fetching testimonials')
            }
        } finally {
            setLoading(false)
            setSearchLoading(false)
        }
    }

    const handleDeleteClick = (testimonial) => {
        setTestimonialToDelete(testimonial)
        setShowDeleteModal(true)
    }

    const confirmDeleteTestimonial = async () => {
        if (!testimonialToDelete) return
        if (!hasDeletePermission) {
            toast.error("You don't have permission to delete testimonials")
            return
        }
        try {
            setDeleting(true)
            const token = getCookie('token')
            const data = await testimonialAPI.deleteTestimonial(testimonialToDelete._id, token)
            if (data.success) {
                toast.success('Testimonial deleted successfully!')
                setShowDeleteModal(false)
                setTestimonialToDelete(null)
                fetchTestimonials()
            } else {
                toast.error('Failed to delete testimonial: ' + data.message)
            }
        } catch (error) {
            console.error('Error deleting testimonial:', error)
            toast.error('Error deleting testimonial')
        } finally {
            setDeleting(false)
        }
    }

    const handleToggleStatus = async (testimonialId) => {
        if (!hasUpdatePermission) {
            toast.error("You don't have permission to update testimonials")
            return
        }
        try {
            const token = getCookie('token')
            const data = await testimonialAPI.toggleTestimonialStatus(testimonialId)
            
            if (data.success) {
                toast.success('Testimonial status updated successfully!')
                fetchTestimonials() // Refresh the list
            } else {
                toast.error('Failed to update testimonial status: ' + data.message)
            }
        } catch (error) {
            console.error('Error updating testimonial status:', error)
            toast.error('Error updating testimonial status')
        }
    }

    const renderStars = (rating) => {
        return Array.from({ length: 1 }, (_, index) => (
            <StarIcon
                key={index}
                className={`w-4 h-4 ${
                    index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                }`}
            />
        ))
    }

    const filteredTestimonials = testimonials.filter(testimonial => {
        const matchesStatus = !statusFilter || testimonial.isActive.toString() === statusFilter
        return matchesStatus
    })

    if (checkingPermission || contextLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (!hasReadPermission || permissionError) {
        return (
            <PermissionDenied
                title="Access Denied"
                message={permissionError || "You don't have permission to access testimonials"}
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
                        <h1 className="text-2xl font-bold text-gray-900">Testimonials</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Manage customer testimonials and reviews
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        {hasCreatePermission && (
                            <Link
                                href="/admin/dashboard/testimonials/create"
                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Testimonial
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Empty placeholder for search area */}
                    <div className="flex-1"></div>

                    {/* Status Filter */}
                    <div className="sm:w-48">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">All Status</option>
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                        </select>
                    </div>

                    {/* Items per page */}
                    <div className="sm:w-32">
                        <select
                            value={itemsPerPage}
                            onChange={(e) => setItemsPerPage(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value={10}>10 per page</option>
                            <option value={25}>25 per page</option>
                            <option value={50}>50 per page</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Testimonials Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Testimonial Image
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Order
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                                            <span>Loading testimonials...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredTestimonials.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                        <Star className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                                        <p className="text-lg font-medium">No testimonials found</p>
                                        <p className="text-sm">Get started by adding your first testimonial.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredTestimonials.map((testimonial) => (
                                    <tr key={testimonial._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex-shrink-0 h-20 w-auto">
                                                <img
                                                    className="h-20 object-contain rounded"
                                                    src={testimonial.image}
                                                    alt="Testimonial"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => handleToggleStatus(testimonial._id)}
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    testimonial.isActive
                                                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                                                }`}
                                            >
                                                {testimonial.isActive ? (
                                                    <>
                                                        <Star className="w-3 h-3 mr-1" />
                                                        Active
                                                    </>
                                                ) : (
                                                    <>
                                                        <StarOff className="w-3 h-3 mr-1" />
                                                        Inactive
                                                    </>
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {testimonial.order}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center space-x-2">
                                                <Link
                                                    href={`/admin/dashboard/testimonials/${testimonial._id}`}
                                                    className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                                    title="View Details"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                                {hasUpdatePermission && (
                                                    <Link
                                                        href={`/admin/dashboard/testimonials/${testimonial._id}/edit`}
                                                        className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
                                                        title="Edit"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Link>
                                                )}
                                                {hasDeletePermission && (
                                                    <button
                                                        onClick={() => handleDeleteClick(testimonial)}
                                                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
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

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <button
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Showing{' '}
                                    <span className="font-medium">
                                        {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}
                                    </span>{' '}
                                    to{' '}
                                    <span className="font-medium">
                                        {Math.min(currentPage * itemsPerPage, totalItems)}
                                    </span>{' '}
                                    of <span className="font-medium">{totalItems}</span> results
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                    <button
                                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                        disabled={currentPage === 1}
                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Previous
                                    </button>
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        const page = i + 1
                                        return (
                                            <button
                                                key={page}
                                                onClick={() => setCurrentPage(page)}
                                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                    currentPage === page
                                                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                }`}
                                            >
                                                {page}
                                            </button>
                                        )
                                    })}
                                    <button
                                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                        disabled={currentPage === totalPages}
                                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <DeleteConfirmationModal
                    isOpen={showDeleteModal}
                    onClose={() => { setShowDeleteModal(false); setTestimonialToDelete(null) }}
                    onConfirm={confirmDeleteTestimonial}
                    title="Delete Testimonial"
                    message="Are you sure you want to delete this testimonial? This action cannot be undone."
                    itemName={testimonialToDelete?.name}
                    itemType="testimonial"
                    isLoading={deleting}
                    confirmText={deleting ? 'Deleting...' : 'Delete'}
                />
            )}
        </div>
    )
}
