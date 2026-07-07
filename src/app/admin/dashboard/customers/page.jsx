'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
    Search, 
    Star, 
    Eye, 
    Edit, 
    Trash2, 
    ChevronLeft, 
    ChevronRight,
    Users,
    UserCheck,
    UserX,
    Mail,
    Phone,
    Calendar,
    MoreVertical
} from 'lucide-react'
import toast from 'react-hot-toast'
import { userAPI } from '@/services/api'
import { getCookie } from 'cookies-next'
import { useAppContext } from '@/context/AppContext'
import PermissionDenied from '@/components/Common/PermissionDenied'
import DeleteConfirmationModal from '@/components/Common/DeleteConfirmationModal'

export default function AdminCustomersPage() {
    const router = useRouter()
    const { hasPermission, contextLoading, user: currentUser } = useAppContext()
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [checkingPermission, setCheckingPermission] = useState(true)
    const [hasReadPermission, setHasReadPermission] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [roleFilter, setRoleFilter] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)
    const [itemsPerPage, setItemsPerPage] = useState(10)
    const [permissionError, setPermissionError] = useState(null)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [userToDelete, setUserToDelete] = useState(null)
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        if (!contextLoading) {
            const canRead = hasPermission('user', 'read')
            setHasReadPermission(canRead)
            setCheckingPermission(false)
            if (canRead) {
                fetchUsers()
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [contextLoading, hasPermission, currentPage, itemsPerPage, searchTerm, statusFilter, roleFilter])

    const fetchUsers = async () => {
        const token = getCookie('token')
        try {
            setLoading(true)
            const params = {
                page: currentPage,
                limit: itemsPerPage,
                search: searchTerm,
                status: statusFilter,
                customersOnly: 'true' // Filter for customers only (role='customer' AND roleId is null)
            }
            
            // Don't add role filter for customers page since customersOnly already filters correctly
            // Role filter dropdown is kept for UI consistency but won't affect results
            
            const data = await userAPI.getUsers(params, token)
            
            if (data.success) {
                setUsers(data.data)
                setTotalPages(data.pagination.totalPages)
                setTotalItems(data.pagination.totalItems)
                setPermissionError(null)
            } else {
                if (data.status === 403 || (typeof data.message === 'string' && data.message.toLowerCase().includes('permission'))) {
                    setPermissionError(data.message || "You don't have permission to read users")
                } else {
                    toast.error('Failed to fetch users: ' + data.message)
                }
            }
        } catch (error) {
            console.error('Error fetching users:', error)
            if (error?.status === 403) {
                setPermissionError(error?.data?.message || "You don't have permission to read users")
            } else {
                toast.error('Error fetching users')
            }
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteClick = (user) => {
        setUserToDelete(user)
        setShowDeleteModal(true)
    }

    const confirmDeleteUser = async () => {
        if (!userToDelete) return
        const token = getCookie('token')
        try {
            setDeleting(true)
            const data = await userAPI.deleteUser(userToDelete._id, token)
            if (data.success) {
                toast.success('User deleted successfully!')
                setShowDeleteModal(false)
                setUserToDelete(null)
                fetchUsers()
            } else {
                toast.error('Failed to delete user: ' + data.message)
            }
        } catch (error) {
            console.error('Error deleting user:', error)
            toast.error('Error deleting user')
        } finally {
            setDeleting(false)
        }
    }

    const handleSearch = (e) => {
        e.preventDefault()
        setCurrentPage(1) // Reset to first page when searching
        fetchUsers()
    }

    const handleFilterChange = () => {
        setCurrentPage(1) // Reset to first page when filtering
        fetchUsers()
    }

    const getStatusBadge = (status) => {
        const statusConfig = {
            active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
            inactive: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Inactive' },
            banned: { bg: 'bg-red-100', text: 'text-red-800', label: 'Banned' },
            deleted: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Deleted' }
        }
        
        const config = statusConfig[status] || statusConfig.active
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        )
    }

    const getRoleBadge = (role) => {
        const roleConfig = {
            admin: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Admin' },
            customer: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Customer' },
            seller: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Seller' }
        }
        
        const config = roleConfig[role] || roleConfig.customer
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        )
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const handlePageChange = (page) => {
        setCurrentPage(page)
    }

    const handleItemsPerPageChange = (newItemsPerPage) => {
        setItemsPerPage(newItemsPerPage)
        setCurrentPage(1)
    }


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
                message={permissionError || "You don't have permission to access customers"}
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
                        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Manage your customers and user accounts
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <div className="text-sm text-gray-500">
                            Total: {totalItems} users
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Search */}
                    <form onSubmit={handleSearch} className="md:col-span-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name, email, or phone..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-text"
                            />
                        </div>
                    </form>

                    {/* Status Filter */}
                    <div>
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value)
                                handleFilterChange()
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                        >
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="banned">Banned</option>
                            <option value="deleted">Deleted</option>
                        </select>
                    </div>

                    {/* Role Filter */}
                    <div>
                        <select
                            value={roleFilter}
                            onChange={(e) => {
                                setRoleFilter(e.target.value)
                                handleFilterChange()
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                        >
                            <option value="">All Roles</option>
                            <option value="customer">Customer</option>
                            <option value="admin">Admin</option>
                            <option value="seller">Seller</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Contact
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Loyalty Points
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Joined
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                                        {searchTerm || statusFilter || roleFilter 
                                            ? 'No users found matching your filters.' 
                                            : 'No users found.'
                                        }
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    {user.avatar ? (
                                                        <img
                                                            className="h-10 w-10 rounded-full object-cover"
                                                            src={user.avatar}
                                                            alt={user.name}
                                                        />
                                                    ) : (
                                                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                                            <Users className="h-5 w-5 text-gray-400" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {user.name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        ID: {user._id.slice(-8)}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 flex items-center">
                                                <Mail className="h-4 w-4 mr-2 text-gray-400" />
                                                {user.email}
                                            </div>
                                            <div className="text-sm text-gray-500 flex items-center mt-1">
                                                <Phone className="h-4 w-4 mr-2 text-gray-400" />
                                                {user.phone}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getRoleBadge(user.role)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(user.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center text-sm">
                                                <Star className="h-4 w-4 text-yellow-400 mr-2" />
                                                <span className="font-medium text-yellow-600">
                                                    {user.loyaltyPoints || 0}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center">
                                            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                            {formatDate(user.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-2">
                                                {hasPermission('user','read') && (
                                                    <button
                                                        onClick={() => router.push(`/admin/dashboard/customers/${user._id}`)}
                                                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 cursor-pointer"
                                                        title="View Details"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                )}
                                                {hasPermission('user','update') && (
                                                    <button
                                                        onClick={() => router.push(`/admin/dashboard/customers/${user._id}/edit`)}
                                                        className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50 cursor-pointer"
                                                        title="Edit User"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                )}
                                                {(() => {
                                                    const isTargetAdmin = user.role === 'admin' || !!user.roleId
                                                    const targetIsSuperAdmin = !!(user.roleId && user.roleId.isSuperAdmin)
                                                    const canDelete = isTargetAdmin ? hasPermission('admin','delete') : hasPermission('user','delete')
                                                    const isSelf = currentUser?._id === user._id
                                                    return canDelete && !isSelf && !targetIsSuperAdmin
                                                })() && (
                                                    <button
                                                        onClick={() => handleDeleteClick(user)}
                                                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 cursor-pointer"
                                                        title="Delete User"
                                                        disabled={user.status === 'deleted'}
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
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg shadow-sm">
                    <div className="flex-1 flex justify-between sm:hidden">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            Next
                        </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700">
                                Showing{' '}
                                <span className="font-medium">
                                    {((currentPage - 1) * itemsPerPage) + 1}
                                </span>{' '}
                                to{' '}
                                <span className="font-medium">
                                    {Math.min(currentPage * itemsPerPage, totalItems)}
                                </span>{' '}
                                of{' '}
                                <span className="font-medium">{totalItems}</span>{' '}
                                results
                            </p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <select
                                value={itemsPerPage}
                                onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value))}
                                className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                            >
                                <option value={5}>5 per page</option>
                                <option value={10}>10 per page</option>
                                <option value={25}>25 per page</option>
                                <option value={50}>50 per page</option>
                            </select>
                            <div className="flex space-x-1">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                </button>
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    const page = i + 1
                                    return (
                                        <button
                                            key={page}
                                            onClick={() => handlePageChange(page)}
                                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium cursor-pointer ${
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
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    <ChevronRight className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <DeleteConfirmationModal
                    isOpen={showDeleteModal}
                    title="Delete User"
                    message={`Are you sure you want to delete ${userToDelete?.name}? This action cannot be undone.`}
                    confirmText={deleting ? 'Deleting...' : 'Delete'}
                    onClose={() => { setShowDeleteModal(false); setUserToDelete(null); }}
                    onConfirm={confirmDeleteUser}
                    isLoading={deleting}
                />
            )}
        </div>
    )
}
