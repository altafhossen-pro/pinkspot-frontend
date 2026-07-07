'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
    ShoppingCart,
    Users,
    Package,
    DollarSign,
    TrendingUp,
    TrendingDown,
    Eye,
    MoreHorizontal,
    RefreshCw,
    AlertTriangle,
    BarChart3,
    PieChart,
    Activity,
    Edit,
    Mail,
    Calendar
} from 'lucide-react'
import { analyticsAPI } from '@/services/api'
import { useAppContext } from '@/context/AppContext'
import PermissionDenied from '@/components/Common/PermissionDenied'
import toast from 'react-hot-toast'
import { formatDateForTable } from '@/utils/formatDate'
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts'

const getStatusColor = (status) => {
    switch (status) {
        case 'Completed':
            return 'bg-green-100 text-green-800'
        case 'Processing':
            return 'bg-blue-100 text-blue-800'
        case 'Shipped':
            return 'bg-purple-100 text-purple-800'
        case 'Pending':
            return 'bg-yellow-100 text-yellow-800'
        default:
            return 'bg-gray-100 text-gray-800'
    }
}

export default function DashboardPage() {
    const { user, token, hasPermission, contextLoading } = useAppContext()
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [dashboardData, setDashboardData] = useState(null)
    const [selectedPeriod, setSelectedPeriod] = useState('today')
    const [checkingPermission, setCheckingPermission] = useState(true)
    const [hasReadPermission, setHasReadPermission] = useState(false)
    const [permissionError, setPermissionError] = useState(null)

    // Fetch dashboard data
    const fetchDashboardData = async (period = selectedPeriod) => {
        try {
            setLoading(true)
            const response = await analyticsAPI.getDashboardStats(period, token)

            if (response.success) {
                setDashboardData(response.data)
            } else {
                toast.error(response.message || 'Failed to fetch dashboard data')
            }
        } catch (error) {
            console.error('Dashboard data fetch error:', error)
            toast.error('Failed to fetch dashboard data')
        } finally {
            setLoading(false)
        }
    }

    // Refresh data
    const handleRefresh = async () => {
        setRefreshing(true)
        await fetchDashboardData(selectedPeriod)
        setRefreshing(false)
    }

    // Period change handler
    const handlePeriodChange = (period) => {
        setSelectedPeriod(period)
        fetchDashboardData(period)
    }

    useEffect(() => {
        if (!token || contextLoading) return
        const canRead = hasPermission('analytics', 'read')
        setHasReadPermission(canRead)
        setCheckingPermission(false)
        if (canRead) {
            fetchDashboardData()
        } else {
            setLoading(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, contextLoading])

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 0
        }).format(amount)
    }

    // Format number
    const formatNumber = (num) => {
        return new Intl.NumberFormat('en-US').format(num)
    }

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US')
    }

    // Get status color
    const getStatusColor = (status) => {
        switch (status) {
            case 'delivered':
                return 'bg-green-100 text-green-800'
            case 'processing':
                return 'bg-blue-100 text-blue-800'
            case 'shipped':
                return 'bg-purple-100 text-purple-800'
            case 'pending':
                return 'bg-yellow-100 text-yellow-800'
            case 'cancelled':
                return 'bg-red-100 text-red-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    // Get status text
    const getStatusText = (status) => {
        switch (status) {
            case 'delivered':
                return 'Delivered'
            case 'processing':
                return 'Processing'
            case 'shipped':
                return 'Shipped'
            case 'pending':
                return 'Pending'
            case 'cancelled':
                return 'Cancelled'
            default:
                return status
        }
    }

    // Get payment status color
    const getPaymentStatusColor = (status) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800'
            case 'paid':
                return 'bg-green-100 text-green-800'
            case 'failed':
                return 'bg-red-100 text-red-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    // Get order source label
    const getOrderSourceLabel = (source) => {
        if (!source) return 'N/A'
        const labels = {
            'website': 'Website',
            'facebook': 'Facebook',
            'whatsapp': 'WhatsApp',
            'phone': 'Phone Call',
            'email': 'Email',
            'walk-in': 'Walk-in',
            'instagram': 'Instagram',
            'manual': 'Manual',
            'other': 'Other'
        }
        return labels[source] || source
    }

    if (checkingPermission || contextLoading || loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex items-center space-x-2">
                    <RefreshCw className="h-6 w-6 animate-spin text-pink-600" />
                    <span className="text-gray-600">Loading dashboard...</span>
                </div>
            </div>
        )
    }

    if (!hasReadPermission || permissionError) {
        return (
            <PermissionDenied
                title="Access Denied"
                message={permissionError || "You don't have permission to view analytics"}
                action="Contact your administrator for access"
                showBackButton={true}
            />
        )
    }

    if (!dashboardData) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load dashboard</h3>
                    <p className="text-gray-600 mb-4">Unable to fetch dashboard data</p>
                    <button
                        onClick={handleRefresh}
                        className="bg-pink-600 text-white px-4 py-2 rounded-md hover:bg-pink-700"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        )
    }

    const { overview, orders, products, sales, recentOrders } = dashboardData

    // Prepare stats data - use period-based data for better accuracy
    const stats = [
        {
            title: 'Revenue',
            value: formatCurrency(sales.period || 0),
            change: `${overview.salesGrowth >= 0 ? '+' : ''}${overview.salesGrowth}%`,
            trend: overview.salesGrowth >= 0 ? 'up' : 'down',
            icon: DollarSign,
            color: 'blue'
        },
        {
            title: 'Orders',
            value: formatNumber(orders.periodTotal || 0),
            change: '+8.2%', // This would need to be calculated from period comparison
            trend: 'up',
            icon: ShoppingCart,
            color: 'green'
        },
        {
            title: 'Total Customers',
            value: formatNumber(overview.totalUsers),
            change: '+5.1%', // This would need to be calculated from period comparison
            trend: 'up',
            icon: Users,
            color: 'purple'
        },
        {
            title: 'Total Products',
            value: formatNumber(overview.totalProducts),
            change: '-2.4%', // This would need to be calculated from period comparison
            trend: 'down',
            icon: Package,
            color: 'orange'
        }
    ]

    // Prepare chart data
    const prepareChartData = () => {
        if (!sales?.monthlyData) return []

        return sales.monthlyData.map(item => ({
            month: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`,
            sales: item.total,
            orders: item.count
        }))
    }

    const chartData = prepareChartData()
    const orderStatusData = orders?.statusDistribution ? [
        { name: 'Delivered', value: orders.statusDistribution.delivered || 0, color: '#10B981' },
        { name: 'Confirmed', value: orders.statusDistribution.confirmed || 0, color: '#3B82F6' },
        { name: 'Shipped', value: orders.statusDistribution.shipped || 0, color: '#8B5CF6' },
        { name: 'Pending', value: orders.statusDistribution.pending || 0, color: '#F59E0B' },
        { name: 'Cancelled', value: orders.statusDistribution.cancelled || 0, color: '#EF4444' },
        { name: 'Returned', value: orders.statusDistribution.returned || 0, color: '#6B7280' }
    ].filter(item => item.value > 0) : []

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-600">Welcome back! Here's what's happening with your store.</p>
                </div>

                <div className="flex items-center space-x-4">
                    {/* Period Selector */}
                    <select
                        value={selectedPeriod}
                        onChange={(e) => handlePeriodChange(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                    >
                        <option value="today">Today</option>
                        <option value="yesterday">Yesterday</option>
                        <option value="7d">Last 7 days</option>
                        <option value="30d">Last 30 days</option>
                        <option value="90d">Last 90 days</option>
                        <option value="1y">Last year</option>
                    </select>

                    {/* Refresh Button */}
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <div
                        key={index}
                        className="bg-white rounded-xl border border-gray-200 p-6 card-hover"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                                {/* <div className="flex items-center mt-2">
                                    {stat.trend === 'up' ? (
                                        <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                                    ) : (
                                        <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                                    )}
                                    <span className={`text-sm font-medium ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        {stat.change}
                                    </span>
                                    <span className="text-sm text-gray-500 ml-1">from last month</span>
                                </div> */}
                            </div>
                            <div className={`p-3 rounded-full ${stat.color === 'blue' ? 'bg-blue-100' :
                                stat.color === 'green' ? 'bg-green-100' :
                                    stat.color === 'purple' ? 'bg-purple-100' : 'bg-orange-100'
                                }`}>
                                <stat.icon className={`h-6 w-6 ${stat.color === 'blue' ? 'text-blue-600' :
                                    stat.color === 'green' ? 'text-green-600' :
                                        stat.color === 'purple' ? 'text-purple-600' : 'text-orange-600'
                                    }`} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales Trend Chart */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-2">
                            <BarChart3 className="h-5 w-5 text-pink-600" />
                            <h3 className="text-lg font-semibold text-gray-900">Sales Trend</h3>
                        </div>
                    </div>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip
                                    formatter={(value, name) => [
                                        name === 'sales' ? formatCurrency(value) : value,
                                        name === 'sales' ? 'Sales' : 'Orders'
                                    ]}
                                />
                                <Legend />
                                <Area
                                    type="monotone"
                                    dataKey="sales"
                                    stackId="1"
                                    stroke="#EC4899"
                                    fill="#FCE7F3"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Order Status Distribution */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-2">
                            <PieChart className="h-5 w-5 text-pink-600" />
                            <h3 className="text-lg font-semibold text-gray-900">Order Status</h3>
                        </div>
                    </div>
                    <div className="h-80">
                        {orderStatusData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsPieChart>
                                    <Pie
                                        data={orderStatusData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => {
                                            if (percent < 0.05) return ''; // Hide labels for very small slices
                                            return `${(percent * 100).toFixed(0)}%`;
                                        }}
                                        outerRadius={80}
                                        innerRadius={20}
                                        fill="#8884d8"
                                        dataKey="value"
                                        paddingAngle={2}
                                    >
                                        {orderStatusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value, name) => [
                                            `${value} orders`,
                                            name
                                        ]}
                                    />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        formatter={(value, entry) => (
                                            <span style={{ color: entry.color }}>
                                                {value} ({entry.payload.value} orders)
                                            </span>
                                        )}
                                    />
                                </RechartsPieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                                    <p className="text-gray-500 text-sm">No order data available</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
                        <Link
                            href="/admin/dashboard/orders"
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
                        >
                            <Eye className="h-4 w-4 mr-1" />
                            View All
                        </Link>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Order ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Email/Phone
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Discount
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Payment
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Order Source
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {recentOrders && recentOrders.length > 0 ? (
                                recentOrders.map((order, index) => (
                                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            #{order.orderId || order._id?.slice(-8).toUpperCase()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <Mail className="h-4 w-4 text-gray-400 mr-2" />
                                                <div className="text-sm text-gray-900">
                                                    {order.orderType === 'manual' && order.manualOrderInfo?.phone
                                                        ? order.manualOrderInfo.phone
                                                        : order.user?.email || order.user?.phone || 'N/A'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                                                <div className="text-sm text-gray-900">
                                                    {formatDateForTable(order.createdAt)}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            ৳{order.total}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {(order.couponDiscount > 0 || order.loyaltyDiscount > 0 || order.discount > 0) ? (
                                                    <div className="space-y-1">
                                                        {order.couponDiscount > 0 && (
                                                            <div className="text-blue-600 font-medium">
                                                                -৳{order.couponDiscount} {order.coupon && `(${order.coupon})`}
                                                            </div>
                                                        )}
                                                        {order.loyaltyDiscount > 0 && (
                                                            <div className="text-pink-600 font-medium">
                                                                -৳{order.loyaltyDiscount} (Loyalty)
                                                            </div>
                                                        )}
                                                        {order.discount > 0 && order.couponDiscount === 0 && (
                                                            <div className="text-green-600 font-medium">
                                                                -৳{order.discount}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">No discount</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col space-y-1">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                                                    {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod || 'N/A'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                {getOrderSourceLabel(order.orderSource)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <Link
                                                href={`/admin/dashboard/orders/${order._id}`}
                                                className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-xs font-medium"
                                            >
                                                <Eye className="h-3 w-3 mr-1" />
                                                View Details
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                                        No recent orders found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Additional Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Top Products Chart */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-2">
                            <Activity className="h-5 w-5 text-pink-600" />
                            <h3 className="text-lg font-semibold text-gray-900">Top Products</h3>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {products.topSelling && products.topSelling.length > 0 ? (
                            products.topSelling.slice(0, 5).map((product, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900 truncate">{product.title}</p>
                                        <p className="text-xs text-gray-500">{product.category?.name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-pink-600">{formatNumber(product.totalSold || 0)}</p>
                                        <p className="text-xs text-gray-500">sales</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8">
                                <Package className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                                <p className="text-gray-500 text-sm">No sales data available</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Payment Methods Chart */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-2">
                            <DollarSign className="h-5 w-5 text-pink-600" />
                            <h3 className="text-lg font-semibold text-gray-900">Payment Methods</h3>
                        </div>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={sales?.paymentMethods || []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="_id" />
                                <YAxis />
                                <Tooltip
                                    formatter={(value, name) => [
                                        name === 'total' ? formatCurrency(value) : value,
                                        name === 'total' ? 'Amount' : 'Count'
                                    ]}
                                />
                                <Bar dataKey="count" fill="#EC4899" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-2">
                            <TrendingUp className="h-5 w-5 text-pink-600" />
                            <h3 className="text-lg font-semibold text-gray-900">Quick Stats</h3>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                            <div>
                                <p className="text-sm font-medium text-blue-900">Avg Order Value</p>
                                <p className="text-xs text-blue-600">Per order</p>
                            </div>
                            <p className="text-lg font-bold text-blue-900">{formatCurrency(overview.avgOrderValue || 0)}</p>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                            <div>
                                <p className="text-sm font-medium text-green-900">Growth Rate</p>
                                <p className="text-xs text-green-600">Sales growth</p>
                            </div>
                            <p className="text-lg font-bold text-green-900">{overview.salesGrowth >= 0 ? '+' : ''}{overview.salesGrowth}%</p>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                            <div>
                                <p className="text-sm font-medium text-purple-900">Total Categories</p>
                                <p className="text-xs text-purple-600">Active categories</p>
                            </div>
                            <p className="text-lg font-bold text-purple-900">{overview.totalCategories || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6 card-hover">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                        <button className="w-full text-left p-3 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
                            Add New Product
                        </button>
                        <button className="w-full text-left p-3 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors">
                            Process Orders
                        </button>
                        <button className="w-full text-left p-3 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors">
                            View Analytics
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6 card-hover">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                        Low Stock Alert
                    </h3>
                    <div className="space-y-3">
                        {products.lowStock && products.lowStock.length > 0 ? (
                            products.lowStock.map((product, index) => (
                                <div key={index} className="flex justify-between items-center p-2 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                                    <div className="flex-1">
                                        <span className="text-sm text-red-800 truncate">{product.title}</span>
                                        <div className="text-xs text-red-600 font-medium">
                                            {Math.min(...product.variants.map(v => v.stockQuantity || 0))} left
                                        </div>
                                    </div>
                                    <Link
                                        href={`/admin/dashboard/products/${product._id}/edit`}
                                        className="ml-2 p-1 text-red-600 hover:text-red-800 hover:bg-red-200 rounded transition-colors"
                                        title="Edit Product"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Link>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-4">
                                <div className="text-green-600 text-sm">All products are well stocked!</div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6 card-hover">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Products</h3>
                    <div className="space-y-3">
                        {products.topSelling && products.topSelling.length > 0 ? (
                            products.topSelling.map((product, index) => (
                                <div key={index} className="flex justify-between items-center">
                                    <span className="text-sm text-gray-700 truncate">{product.title}</span>
                                    <span className="text-xs font-medium text-green-600">
                                        {formatNumber(product.totalSold || 0)} sales
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-4">
                                <div className="text-gray-500 text-sm">No sales data available</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}