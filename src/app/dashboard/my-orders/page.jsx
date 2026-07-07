'use client'

import { useState, useEffect } from 'react'
import {
    Package,
    Truck,
    CheckCircle,
    Clock,
    AlertCircle,
    Eye,
    Download,
    RefreshCw,
    Filter,
    X,
    Calendar,
    ChevronDown,
    ShoppingCart
} from 'lucide-react'
import Link from 'next/link'
import { useAppContext } from '@/context/AppContext'
import { orderAPI } from '@/services/api'
import toast from 'react-hot-toast'

export default function MyOrders() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [showFilters, setShowFilters] = useState(false)
    const { token, isAuthenticated } = useAppContext()

    // Filter states
    const [filters, setFilters] = useState({
        status: '',
        dateRange: '',
        amountRange: '',
        paymentMethod: '',
        search: ''
    })

    // Fetch orders from API
    const fetchOrders = async () => {
        if (!isAuthenticated || !token) {
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            const response = await orderAPI.getUserOrders(token)

            if (response.success) {
                setOrders(response.data || [])
            } else {
                toast.error(response.message || 'Failed to fetch orders')
            }
        } catch (error) {
            console.error('Error fetching orders:', error)
            toast.error('Failed to fetch orders')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchOrders()
    }, [isAuthenticated, token])

    // Transform order data for display
    const transformOrderData = (order) => {
        const statusMap = {
            'pending': { label: 'Pending', color: 'text-yellow-600', bg: 'bg-yellow-100', icon: Clock },
            'confirmed': { label: 'Confirmed', color: 'text-blue-600', bg: 'bg-blue-100', icon: Clock },
            'processing': { label: 'Processing', color: 'text-yellow-600', bg: 'bg-yellow-100', icon: Clock },
            'shipped': { label: 'Shipped', color: 'text-blue-600', bg: 'bg-blue-100', icon: Truck },
            'delivered': { label: 'Delivered', color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle },
            'cancelled': { label: 'Cancelled', color: 'text-red-600', bg: 'bg-red-100', icon: AlertCircle },
            'returned': { label: 'Returned', color: 'text-gray-600', bg: 'bg-gray-100', icon: AlertCircle }
        }

        const statusInfo = statusMap[order.status] || statusMap['pending']

        // Calculate items subtotal
        const itemsSubtotal = order.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0
        
        // Calculate final total: subtotal + shipping - all discounts
        const finalTotal = itemsSubtotal 
            + (order.shippingCost || 0)
            - (order.discount || 0)
            - (order.couponDiscount || 0)
            - (order.upsellDiscount || 0)
            - (order.loyaltyDiscount || 0)

        return {
            id: order._id,
            orderId: order.orderId,
            orderNumber: order.orderId,
            productCount: order.items?.length || 1,
            date: new Date(order.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }),
            time: new Date(order.createdAt).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }),
            status: order.status,
            statusLabel: statusInfo.label,
            statusColor: statusInfo.color,
            statusBg: statusInfo.bg,
            statusIcon: statusInfo.icon,
            amount: `৳${Math.max(0, finalTotal).toLocaleString()}`,
            items: order.items || []
        }
    }

    const transformedOrders = orders.map(transformOrderData)

    // Filter orders based on current filters
    const filteredOrders = transformedOrders.filter(order => {
        // Status filter
        if (filters.status && order.status !== filters.status) {
            return false
        }

        // Date range filter
        if (filters.dateRange) {
            const orderDate = new Date(order.date)
            const now = new Date()
            const daysDiff = Math.floor((now - orderDate) / (1000 * 60 * 60 * 24))

            switch (filters.dateRange) {
                case 'today':
                    if (daysDiff !== 0) return false
                    break
                case 'week':
                    if (daysDiff > 7) return false
                    break
                case 'month':
                    if (daysDiff > 30) return false
                    break
                case 'year':
                    if (daysDiff > 365) return false
                    break
            }
        }

        // Amount range filter
        if (filters.amountRange) {
            const amount = parseFloat(order.amount.replace('৳', '').replace(',', ''))
            switch (filters.amountRange) {
                case '0-1000':
                    if (amount < 0 || amount > 1000) return false
                    break
                case '1000-5000':
                    if (amount < 1000 || amount > 5000) return false
                    break
                case '5000-10000':
                    if (amount < 5000 || amount > 10000) return false
                    break
                case '10000+':
                    if (amount < 10000) return false
                    break
            }
        }

        // Search filter (by order ID)
        if (filters.search && !order.orderNumber.toLowerCase().includes(filters.search.toLowerCase())) {
            return false
        }

        return true
    })

    // Get filter counts
    const getFilterCounts = () => {
        return {
            all: transformedOrders.length,
            pending: transformedOrders.filter(o => o.status === 'pending').length,
            processing: transformedOrders.filter(o => o.status === 'processing').length,
            shipped: transformedOrders.filter(o => o.status === 'shipped').length,
            delivered: transformedOrders.filter(o => o.status === 'delivered').length,
            cancelled: transformedOrders.filter(o => o.status === 'cancelled').length
        }
    }

    const filterCounts = getFilterCounts()

    // Clear all filters
    const clearFilters = () => {
        setFilters({
            status: '',
            dateRange: '',
            amountRange: '',
            paymentMethod: '',
            search: ''
        })
    }

    // Check if any filters are active
    const hasActiveFilters = Object.values(filters).some(value => value !== '')

    const getStatusIcon = (status) => {
        const statusMap = {
            'pending': Clock,
            'confirmed': Clock,
            'processing': Clock,
            'shipped': Truck,
            'delivered': CheckCircle,
            'cancelled': AlertCircle,
            'returned': AlertCircle
        }
        return statusMap[status] || Package
    }

    if (!isAuthenticated) {
        return (
            <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">My Orders</h1>
                    <p className="text-gray-600">Please login to view your orders</p>
                    <div className="mt-4">
                        <Link
                            href="/login"
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                            Login
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">My Orders</h1>
                        <p className="text-gray-600">
                            Track your orders and view order history
                        </p>
                    </div>
                    <button
                        onClick={fetchOrders}
                        disabled={loading}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-lg font-medium text-gray-900">Orders</h2>
                            <span className="text-sm text-gray-500">
                                {filteredOrders.length} of {transformedOrders.length} orders
                            </span>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md ${showFilters
                                        ? 'bg-blue-50 text-blue-700 border-blue-300'
                                        : 'text-gray-700 bg-white hover:bg-gray-50'
                                    }`}
                            >
                                <Filter className="h-4 w-4 mr-2" />
                                Filters
                                {hasActiveFilters && (
                                    <span className="ml-2 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                        {Object.values(filters).filter(v => v !== '').length}
                                    </span>
                                )}
                            </button>
                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    <X className="h-4 w-4 mr-2" />
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Filter Panel */}
                {showFilters && (
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            {/* Search */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Search Order ID
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter order ID..."
                                    value={filters.search}
                                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            {/* Status Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Status
                                </label>
                                <select
                                    value={filters.status}
                                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">All Status</option>
                                    <option value="pending">Pending ({filterCounts.pending})</option>
                                    <option value="processing">Processing ({filterCounts.processing})</option>
                                    <option value="shipped">Shipped ({filterCounts.shipped})</option>
                                    <option value="delivered">Delivered ({filterCounts.delivered})</option>
                                    <option value="cancelled">Cancelled ({filterCounts.cancelled})</option>
                                </select>
                            </div>

                            {/* Date Range Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Date Range
                                </label>
                                <select
                                    value={filters.dateRange}
                                    onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">All Time</option>
                                    <option value="today">Today</option>
                                    <option value="week">Last 7 Days</option>
                                    <option value="month">Last 30 Days</option>
                                    <option value="year">Last Year</option>
                                </select>
                            </div>

                            {/* Amount Range Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Amount Range
                                </label>
                                <select
                                    value={filters.amountRange}
                                    onChange={(e) => setFilters({ ...filters, amountRange: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">All Amounts</option>
                                    <option value="0-1000">৳0 - ৳1,000</option>
                                    <option value="1000-5000">৳1,000 - ৳5,000</option>
                                    <option value="5000-10000">৳5,000 - ৳10,000</option>
                                    <option value="10000+">৳10,000+</option>
                                </select>
                            </div>

                            {/* Payment Method Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Payment Method
                                </label>
                                <select
                                    value={filters.paymentMethod}
                                    onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">All Methods</option>
                                    <option value="cod">Cash on Delivery</option>
                                    <option value="card">Credit/Debit Card</option>
                                    <option value="bkash">bKash</option>
                                    <option value="nagad">Nagad</option>
                                    <option value="rocket">Rocket</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Orders Table */}
                <div className="p-6">
                    {loading ? (
                        <div className="text-center py-12">
                            <RefreshCw className="mx-auto h-8 w-8 text-gray-400 animate-spin" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">Loading orders...</h3>
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="text-center py-12">
                            <Package className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {hasActiveFilters
                                    ? "No orders match your current filters. Try adjusting your search criteria."
                                    : "You haven't placed any orders yet."
                                }
                            </p>
                            <div className="mt-6 space-x-3">
                                {hasActiveFilters ? (
                                    <button
                                        onClick={clearFilters}
                                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                    >
                                        Clear Filters
                                    </button>
                                ) : (
                                    <Link
                                        href="/shop"
                                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                    >
                                        Start Shopping
                                    </Link>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Order ID
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Items
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Date & Time
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Amount
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredOrders.map((order) => {
                                        const StatusIcon = order.statusIcon
                                        return (
                                            <tr key={order.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <Package className="h-8 w-8 text-gray-400 mr-3" />
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {order.orderNumber}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {order.productCount} {order.productCount === 1 ? 'item' : 'items'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{order.date}</div>
                                                    <div className="text-sm text-gray-500">{order.time}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order.statusBg} ${order.statusColor}`}>
                                                        <StatusIcon className="h-3 w-3 mr-1" />
                                                        {order.statusLabel}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {order.amount}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex justify-center space-x-2">
                                                        <Link
                                                            href={`/dashboard/my-orders/${order.orderId}`}
                                                            className="bg-pink-500 hover:bg-pink-600 text-white px-2 py-2 rounded-md flex items-center justify-center gap-1"
                                                            title="View Order"
                                                        >
                                                            <Eye className="h-4 w-4" /> 
                                                        </Link>
                                                        <Link
                                                            href={`/dashboard/my-orders/${order.orderId}/reorder`}
                                                            className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-2 rounded-md flex items-center justify-center gap-1"
                                                            title="Reorder"
                                                        >
                                                            <ShoppingCart className="h-4 w-4" /> 
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}