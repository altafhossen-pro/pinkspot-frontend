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
    MoreVertical,
    Shield,
    Plus,
    X
} from 'lucide-react'
import toast from 'react-hot-toast'
import { userAPI, roleAPI } from '@/services/api'
import { getCookie } from 'cookies-next'
import { useAppContext } from '@/context/AppContext'
import PermissionDenied from '@/components/Common/PermissionDenied'
import DeleteConfirmationModal from '@/components/Common/DeleteConfirmationModal'

export default function AdminStaffPage() {
    const router = useRouter()
    const { hasPermission, contextLoading, user: currentUser, roleDetails } = useAppContext()
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
    
    // Create Staff Modal states
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [creating, setCreating] = useState(false)
    const [roles, setRoles] = useState([])
    const [loadingRoles, setLoadingRoles] = useState(false)
    const [createFormData, setCreateFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        roleId: '',
        status: 'active'
    })

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
                staffOnly: 'true' // Filter for staff only (non-customers)
            }
            
            // Add role filter if specified (for staff page, only admin and seller)
            if (roleFilter) {
                params.role = roleFilter
            }
            
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

    const getRoleBadge = (role, roleId) => {
        const roleConfig = {
            admin: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Admin' },
            customer: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Customer' },
            seller: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Seller' }
        }
        
        // If user has roleId, they are staff (admin with custom role)
        const displayRole = roleId ? 'admin' : role
        const config = roleConfig[displayRole] || roleConfig.customer
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

    // Fetch roles for create staff modal
    const fetchRoles = async () => {
        try {
            setLoadingRoles(true)
            const token = getCookie('token')
            const data = await roleAPI.getRoles({ limit: 100 }, token)
            
            if (data.success) {
                setRoles(data.data || [])
            }
        } catch (error) {
            console.error('Error fetching roles:', error)
        } finally {
            setLoadingRoles(false)
        }
    }

    // Open create staff modal
    const handleOpenCreateModal = () => {
        setCreateFormData({
            name: '',
            email: '',
            phone: '',
            password: '',
            confirmPassword: '',
            roleId: '',
            status: 'active'
        })
        setShowCreateModal(true)
        fetchRoles()
    }

    // Handle create staff form input change
    const handleCreateFormChange = (e) => {
        const { name, value } = e.target
        setCreateFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    // Handle create staff form submission
    const handleCreateStaff = async (e) => {
        e.preventDefault()
        
        // Validate form
        if (!createFormData.name || !createFormData.email || !createFormData.password) {
            toast.error('Name, email, and password are required')
            return
        }

        if (createFormData.password !== createFormData.confirmPassword) {
            toast.error('Passwords do not match')
            return
        }

        if (createFormData.password.length < 6) {
            toast.error('Password must be at least 6 characters long')
            return
        }

        try {
            setCreating(true)
            const token = getCookie('token')
            
            const staffData = {
                name: createFormData.name,
                email: createFormData.email,
                password: createFormData.password,
                status: createFormData.status
            }

            if (createFormData.phone) {
                staffData.phone = createFormData.phone
            }

            if (createFormData.roleId) {
                staffData.roleId = createFormData.roleId
            }

            const data = await userAPI.createStaff(staffData, token)
            
            if (data.success) {
                toast.success('Staff member created successfully!')
                setShowCreateModal(false)
                setCreateFormData({
                    name: '',
                    email: '',
                    phone: '',
                    password: '',
                    confirmPassword: '',
                    roleId: '',
                    status: 'active'
                })
                fetchUsers() // Refresh the list
            } else {
                toast.error(data.message || 'Failed to create staff member')
            }
        } catch (error) {
            console.error('Error creating staff:', error)
            toast.error(error?.data?.message || 'Error creating staff member')
        } finally {
            setCreating(false)
        }
    }

    // Check if current user is super admin
    const isSuperAdmin = roleDetails?.isSuperAdmin === true


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
                message={permissionError || "You don't have permission to access staff"}
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
                        <h1 className="text-2xl font-bold text-gray-900">Staff</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Manage your staff members and admin accounts
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        
                        {isSuperAdmin && (
                            <button
                                onClick={handleOpenCreateModal}
                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Create Staff
                            </button>
                        )}
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
                                            ? 'No staff members found matching your filters.' 
                                            : 'No staff members found.'
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
                                                            <Shield className="h-5 w-5 text-gray-400" />
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
                                            {getRoleBadge(user.role, user.roleId)}
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
                                                {(() => {
                                                    // Only Super Admin can edit staff users
                                                    const isCurrentUserSuperAdmin = roleDetails?.isSuperAdmin === true
                                                    const canEdit = hasPermission('user','update') && isCurrentUserSuperAdmin
                                                    return canEdit && (
                                                        <button
                                                            onClick={() => router.push(`/admin/dashboard/customers/${user._id}/edit`)}
                                                            className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50 cursor-pointer"
                                                            title="Edit User"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </button>
                                                    )
                                                })()}
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

            {/* Create Staff Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="flex-shrink-0 p-6 border-b border-gray-200 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">Create Staff Member</h2>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        
                        {/* Modal Body - Scrollable */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <form onSubmit={handleCreateStaff} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        required
                                        value={createFormData.name}
                                        onChange={handleCreateFormChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter staff name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        value={createFormData.email}
                                        onChange={handleCreateFormChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter email address"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Phone (Optional)
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={createFormData.phone}
                                        onChange={handleCreateFormChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter phone number"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Password <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        name="password"
                                        required
                                        value={createFormData.password}
                                        onChange={handleCreateFormChange}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                            createFormData.password && createFormData.password.length < 6
                                                ? 'border-red-300 focus:ring-red-500'
                                                : 'border-gray-300'
                                        }`}
                                        placeholder="Enter password (min 6 characters)"
                                        minLength={6}
                                    />
                                    {createFormData.password && createFormData.password.length < 6 && (
                                        <p className="mt-1 text-xs text-red-600">Password must be at least 6 characters</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Confirm Password <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        required
                                        value={createFormData.confirmPassword}
                                        onChange={handleCreateFormChange}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                            createFormData.confirmPassword && createFormData.password !== createFormData.confirmPassword
                                                ? 'border-red-300 focus:ring-red-500'
                                                : createFormData.confirmPassword && createFormData.password === createFormData.confirmPassword
                                                ? 'border-green-300 focus:ring-green-500'
                                                : 'border-gray-300'
                                        }`}
                                        placeholder="Confirm password"
                                    />
                                    {createFormData.confirmPassword && (
                                        <>
                                            {createFormData.password !== createFormData.confirmPassword ? (
                                                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                                                    <X className="h-3 w-3" />
                                                    Passwords do not match
                                                </p>
                                            ) : (
                                                <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                                                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                    Passwords match
                                                </p>
                                            )}
                                        </>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Role (Optional)
                                    </label>
                                    <select
                                        name="roleId"
                                        value={createFormData.roleId}
                                        onChange={handleCreateFormChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        disabled={loadingRoles}
                                    >
                                        <option value="">Select a role</option>
                                        {roles.map((role) => (
                                            <option key={role._id} value={role._id}>
                                                {role.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Status <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="status"
                                        required
                                        value={createFormData.status}
                                        onChange={handleCreateFormChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>

                                {/* Modal Footer */}
                                <div className="flex-shrink-0 pt-4 flex items-center justify-end space-x-3 border-t border-gray-200 mt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                        disabled={creating}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={creating}
                                    >
                                        {creating ? 'Creating...' : 'Create Staff'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

