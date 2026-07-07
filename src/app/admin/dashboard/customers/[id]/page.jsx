'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft,
    Edit,
    Mail,
    Phone,
    MapPin,
    Calendar,
    User,
    ShoppingBag,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Star,
    Eye,
    Save,
    X
} from 'lucide-react'
import toast from 'react-hot-toast'
import { userAPI, orderAPI } from '@/services/api'
import { getCookie } from 'cookies-next'
import LoyaltyPointsSection from '@/components/Admin/LoyaltyPointsSection'
import { useAppContext } from '@/context/AppContext'
import PermissionDenied from '@/components/Common/PermissionDenied'

export default function CustomerDetailPage() {
    const router = useRouter()
    const params = useParams()
    const customerId = params.id
    const { hasPermission, contextLoading } = useAppContext()

    const [customer, setCustomer] = useState(null)
    const [loyaltyData, setLoyaltyData] = useState(null)
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [ordersLoading, setOrdersLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [editData, setEditData] = useState({})
    const [saving, setSaving] = useState(false)
    const [checkingPermission, setCheckingPermission] = useState(true)
    const [hasReadPermission, setHasReadPermission] = useState(false)
    const [permissionError, setPermissionError] = useState(null)
    const [ordersPagination, setOrdersPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10,
        hasNextPage: false,
        hasPrevPage: false
    })

    useEffect(() => {
        if (!customerId) return
        if (contextLoading) return
        const canRead = hasPermission('user', 'read')
        setHasReadPermission(canRead)
        setCheckingPermission(false)
        if (canRead) {
            fetchCustomerDetails()
            fetchLoyaltyData()
            fetchCustomerOrders()
        } else {
            // Ensure loading spinner doesn't block when no permission
            setLoading(false)
            setOrdersLoading(false)
        }
        // Intentionally exclude hasPermission from deps to avoid re-renders on function identity change
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [customerId, contextLoading])

    const fetchCustomerDetails = async () => {
        try {
            setLoading(true)
            const token = getCookie('token')
            const data = await userAPI.getUserById(customerId, token)

            if (data.success) {
                setCustomer(data.data)
                setEditData({
                    name: data.data.name,
                    phone: data.data.phone,
                    address: data.data.address || '',
                    status: data.data.status,
                    role: data.data.role
                })
            } else {
                if (data.status === 403) {
                    setPermissionError(data.message || "You don't have permission to read users")
                } else {
                    toast.error('Customer not found')
                    router.push('/admin/dashboard/customers')
                }
            }
        } catch (error) {
            console.error('Error fetching customer:', error)
            if (error?.status === 403) {
                setPermissionError(error?.data?.message || "You don't have permission to read users")
            } else {
                toast.error('Error fetching customer details')
            }
        } finally {
            setLoading(false)
        }
    }

    const fetchLoyaltyData = async () => {
        try {
            const token = getCookie('token')
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/loyalty/user/${customerId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            const data = await response.json()

            if (data.success) {
                setLoyaltyData(data.data)
            }
        } catch (error) {
            console.error('Error fetching loyalty data:', error)
        }
    }

    const fetchCustomerOrders = async (page = 1) => {
        try {
            setOrdersLoading(true)
            const token = getCookie('token')
            const data = await orderAPI.getOrders({
                userId: customerId,
                page: page,
                limit: ordersPagination.itemsPerPage
            }, token)

            if (data.success) {
                setOrders(data.data)
                setOrdersPagination(data.pagination)
            }
        } catch (error) {
            console.error('Error fetching orders:', error)
            toast.error('Error fetching customer orders')
        } finally {
            setOrdersLoading(false)
        }
    }

    const handleEdit = () => {
        if (!hasPermission('user','update')) return
        setIsEditing(true)
    }

    const handleCancelEdit = () => {
        setIsEditing(false)
        setEditData({
            name: customer.name,
            phone: customer.phone,
            address: customer.address || '',
            status: customer.status,
            role: customer.role
        })
    }

    const handleSave = async () => {
        try {
            setSaving(true)
            const token = getCookie('token')

            // Update customer data
            const updateData = {
                name: editData.name,
                phone: editData.phone,
                address: editData.address,
                status: editData.status,
                role: editData.role
            }

            const data = await userAPI.updateUserById(customerId, updateData, token)

            if (data.success) {
                toast.success('Customer updated successfully!')
                setCustomer(prev => ({ ...prev, ...updateData }))
                setIsEditing(false)
            } else {
                if (data.status === 403) {
                    setPermissionError(data.message || "You don't have permission to update users")
                } else {
                    toast.error('Failed to update customer: ' + data.message)
                }
            }
        } catch (error) {
            console.error('Error updating customer:', error)
            if (error?.status === 403) {
                setPermissionError(error?.data?.message || "You don't have permission to update users")
            } else {
                toast.error('Error updating customer')
            }
        } finally {
            setSaving(false)
        }
    }

    const handlePageChange = (newPage) => {
        fetchCustomerOrders(newPage)
    }

    const handleItemsPerPageChange = (newLimit) => {
        setOrdersPagination(prev => ({ ...prev, itemsPerPage: newLimit }))
        fetchCustomerOrders(1)
    }

    const getStatusBadge = (status) => {
        const statusConfig = {
            active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active', icon: CheckCircle },
            inactive: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Inactive', icon: Clock },
            banned: { bg: 'bg-red-100', text: 'text-red-800', label: 'Banned', icon: XCircle },
            deleted: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Deleted', icon: AlertCircle }
        }

        const config = statusConfig[status] || statusConfig.active
        const Icon = config.icon
        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
                <Icon className="h-4 w-4 mr-1" />
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
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        )
    }

    const getOrderStatusBadge = (status) => {
        const statusConfig = {
            pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
            processing: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Processing' },
            shipped: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Shipped' },
            delivered: { bg: 'bg-green-100', text: 'text-green-800', label: 'Delivered' },
            cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' }
        }

        const config = statusConfig[status] || statusConfig.pending
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        )
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

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount)
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
                message={permissionError || "You don't have permission to view this customer"}
                action="Contact your administrator for access"
                showBackButton={true}
            />
        )
    }

    if (!customer) {
        return (
            <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Customer not found</h3>
                <p className="text-gray-500 mb-4">The customer you're looking for doesn't exist.</p>
                <Link
                    href="/admin/dashboard/customers"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Customers
                </Link>
            </div>
        )
    }

    return (
        <div>
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center space-x-4">
                            <Link
                                href="/admin/dashboard/customers"
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <ArrowLeft className="h-6 w-6" />
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
                                <p className="text-sm text-gray-500">Customer Details & Order History</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            {!isEditing ? (
                                hasPermission('user','update') && (
                                    <Link href={`/admin/dashboard/customers/${customerId}/edit`}
                                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit Customer
                                    </Link>
                                )
                            ) : (
                                <div className="flex space-x-2">
                                    <button
                                        onClick={handleCancelEdit}
                                        className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                                    >
                                        <X className="h-4 w-4 mr-2" />
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                    >
                                        <Save className="h-4 w-4 mr-2" />
                                        {saving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                 <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
                     {/* Customer Information */}
                     <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>

                            <div className="space-y-4">
                                {/* Avatar */}
                                <div className="flex items-center space-x-4">
                                    <div className="flex-shrink-0 h-16 w-16">
                                        {customer.avatar ? (
                                            <img
                                                className="h-16 w-16 rounded-full object-cover"
                                                src={customer.avatar}
                                                alt={customer.name}
                                            />
                                        ) : (
                                            <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                                                <User className="h-8 w-8 text-gray-400" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={editData.name}
                                                onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-lg font-medium"
                                                placeholder="Enter customer name"
                                            />
                                        ) : (
                                            <h3 className="text-lg font-medium text-gray-900">{customer.name}</h3>
                                        )}
                                        <div className="flex space-x-2 mt-1">
                                            {getStatusBadge(customer.status)}
                                            {getRoleBadge(customer.role)}
                                        </div>
                                    </div>
                                </div>

                                {/* Contact Information */}
                                <div className="space-y-3">
                                    <div className="flex items-center text-sm text-gray-600">
                                        <Mail className="h-4 w-4 mr-3 text-gray-400" />
                                        <span className="text-gray-500">{customer.email}</span>
                                        <span className="ml-2 text-xs text-gray-400">(Cannot be changed)</span>
                                    </div>

                                    <div className="flex items-center text-sm text-gray-600">
                                        <Phone className="h-4 w-4 mr-3 text-gray-400" />
                                        {isEditing ? (
                                            <input
                                                type="tel"
                                                value={editData.phone}
                                                onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                placeholder="Enter phone number"
                                            />
                                        ) : (
                                            <span>{customer.phone}</span>
                                        )}
                                    </div>

                                    <div className="flex items-start text-sm text-gray-600">
                                        <MapPin className="h-4 w-4 mr-3 mt-0.5 text-gray-400" />
                                        {isEditing ? (
                                            <textarea
                                                value={editData.address}
                                                onChange={(e) => setEditData(prev => ({ ...prev, address: e.target.value }))}
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                rows={3}
                                                placeholder="Enter address"
                                            />
                                        ) : (
                                            <span>{customer.address || 'No address provided'}</span>
                                        )}
                                    </div>

                                    <div className="flex items-center text-sm text-gray-600">
                                        <Calendar className="h-4 w-4 mr-3 text-gray-400" />
                                        <span>Joined {formatDate(customer.createdAt)}</span>
                                    </div>

                                    <div className="flex items-center text-sm text-gray-600">
                                        <Star className="h-4 w-4 mr-3 text-yellow-400" />
                                        <span className="font-medium text-yellow-600">
                                            {loyaltyData?.loyalty?.coins || 0} Loyalty Coins
                                        </span>
                                    </div>
                                </div>

                                {/* Account Status */}
                                {isEditing && (
                                    <div className="space-y-4 pt-4 border-t border-gray-200">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Account Status</label>
                                            <select
                                                value={editData.status}
                                                onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                            >
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                                <option value="banned">Banned</option>
                                                <option value="deleted">Deleted</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">User Role</label>
                                            <select
                                                value={editData.role}
                                                onChange={(e) => setEditData(prev => ({ ...prev, role: e.target.value }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                            >
                                                <option value="customer">Customer</option>
                                                <option value="admin">Admin</option>
                                                <option value="seller">Seller</option>
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                     {/* Order History */}
                     <div className="lg:col-span-4">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900">Order History</h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    {ordersPagination.totalItems} total orders
                                </p>
                            </div>

                            {ordersLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                </div>
                            ) : orders.length === 0 ? (
                                <div className="text-center py-12">
                                    <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                                    <p className="text-gray-500">This customer hasn't placed any orders yet.</p>
                                </div>
                            ) : (
                                <>
                                    {/* Orders Table */}
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Order
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Status
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Items
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Payment
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Total
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Date
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {orders.map((order) => (
                                                    <tr key={order._id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                #{order.orderId}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {getOrderStatusBadge(order.status)}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900">
                                                                {order.items.length} item(s)
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {order?.items[0]?.product?.title}
                                                                {order?.items?.length > 1 && ` +${order?.items?.length - 1} more`}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900 capitalize">
                                                                {order.paymentMethod}
                                                            </div>
                                                            <div className="text-xs text-gray-500 capitalize">
                                                                {order.paymentStatus}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {formatCurrency(order.total)}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900">
                                                                {formatDate(order.createdAt)}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                            <button className="text-blue-600 hover:text-blue-900">
                                                                <Eye className="h-4 w-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination */}
                                    {ordersPagination.totalPages > 1 && (
                                        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                                            <div className="flex-1 flex justify-between sm:hidden">
                                                <button
                                                    onClick={() => handlePageChange(ordersPagination.currentPage - 1)}
                                                    disabled={!ordersPagination.hasPrevPage}
                                                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Previous
                                                </button>
                                                <button
                                                    onClick={() => handlePageChange(ordersPagination.currentPage + 1)}
                                                    disabled={!ordersPagination.hasNextPage}
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
                                                            {((ordersPagination.currentPage - 1) * ordersPagination.itemsPerPage) + 1}
                                                        </span>{' '}
                                                        to{' '}
                                                        <span className="font-medium">
                                                            {Math.min(ordersPagination.currentPage * ordersPagination.itemsPerPage, ordersPagination.totalItems)}
                                                        </span>{' '}
                                                        of{' '}
                                                        <span className="font-medium">{ordersPagination.totalItems}</span>{' '}
                                                        results
                                                    </p>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <select
                                                        value={ordersPagination.itemsPerPage}
                                                        onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value))}
                                                        className="text-sm border border-gray-300 rounded-md px-2 py-1"
                                                    >
                                                        <option value={5}>5 per page</option>
                                                        <option value={10}>10 per page</option>
                                                        <option value={25}>25 per page</option>
                                                        <option value={50}>50 per page</option>
                                                    </select>
                                                    <div className="flex space-x-1">
                                                        <button
                                                            onClick={() => handlePageChange(ordersPagination.currentPage - 1)}
                                                            disabled={!ordersPagination.hasPrevPage}
                                                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            Previous
                                                        </button>
                                                        {Array.from({ length: ordersPagination.totalPages }, (_, i) => i + 1).map((page) => (
                                                            <button
                                                                key={page}
                                                                onClick={() => handlePageChange(page)}
                                                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${page === ordersPagination.currentPage
                                                                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                                    }`}
                                                            >
                                                                {page}
                                                            </button>
                                                        ))}
                                                        <button
                                                            onClick={() => handlePageChange(ordersPagination.currentPage + 1)}
                                                            disabled={!ordersPagination.hasNextPage}
                                                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            Next
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Loyalty Points Management */}
                <div className="mt-6">
                    <LoyaltyPointsSection
                        userId={customerId}
                        customerName={customer?.name}
                    />
                </div>
            </div>
        </div>
    )
}
