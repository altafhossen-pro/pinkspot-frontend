'use client'

import { useAppContext } from '@/context/AppContext'
import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'
import { 
    ShoppingCart, 
    Heart, 
    Package, 
    User,
    Coins
} from 'lucide-react'
import Link from 'next/link'
import { getCookie } from 'cookies-next'
import { orderAPI, loyaltyAPI } from '@/services/api'
import toast from 'react-hot-toast'

const CustomerDashboardContent = () => {
    const { user, cartCount, wishlistCount } = useAppContext()
    const [loading, setLoading] = useState(true)
    const [dashboardData, setDashboardData] = useState({
        totalOrders: 0,
        recentOrders: [],
        loyaltyCoins: 0
    })

    useEffect(() => {
        if (user && user._id) {
            fetchDashboardData()
        }
    }, [user])

    const fetchDashboardData = async () => {
        try {
            setLoading(true)
            const token = getCookie('token')
            if (!token) {
                toast.error('Please login to view dashboard')
                return
            }

            // Fetch user orders
            const ordersResponse = await orderAPI.getUserOrders(token)
            if (ordersResponse.success) {
                const orders = ordersResponse.data || []
                
                setDashboardData(prev => ({
                    ...prev,
                    totalOrders: orders.length,
                    recentOrders: orders.slice(0, 5) // Latest 5 orders
                }))
            }

            // Fetch loyalty data
            const loyaltyResponse = await loyaltyAPI.getLoyalty(user._id, token)
            if (loyaltyResponse.success) {
                setDashboardData(prev => ({
                    ...prev,
                    loyaltyCoins: loyaltyResponse.data?.coins || 0
                }))
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error)
            toast.error('Failed to load dashboard data')
        } finally {
            setLoading(false)
        }
    }

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'delivered':
                return { color: 'text-green-600', bg: 'bg-green-100' }
            case 'shipped':
            case 'in transit':
                return { color: 'text-blue-600', bg: 'bg-blue-100' }
            case 'processing':
            case 'pending':
                return { color: 'text-yellow-600', bg: 'bg-yellow-100' }
            case 'cancelled':
                return { color: 'text-red-600', bg: 'bg-red-100' }
            default:
                return { color: 'text-gray-600', bg: 'bg-gray-100' }
        }
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const formatCurrency = (amount) => {
        return `৳${amount?.toLocaleString() || '0'}`
    }

    const stats = [
        {
            name: 'Total Orders',
            value: dashboardData.totalOrders.toString(),
            icon: ShoppingCart,
            color: 'bg-blue-500'
        },
        {
            name: 'Wishlist Items',
            value: wishlistCount.toString(),
            icon: Heart,
            color: 'bg-pink-500'
        },
        {
            name: 'Loyalty Coins',
            value: dashboardData.loyaltyCoins.toString(),
            icon: Coins,
            color: 'bg-yellow-500'
        }
    ]

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white rounded-lg shadow-sm p-6">
                            <div className="animate-pulse">
                                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Welcome Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Welcome back, {user?.name || 'Customer'}! 👋
                </h1>
                <p className="text-gray-600">
                    Here's what's happening with your account today.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stats.map((stat) => (
                    <div key={stat.name} className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                            </div>
                            <div className={`p-3 rounded-lg ${stat.color}`}>
                                <stat.icon className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
                    <Link 
                        href="/dashboard/my-orders"
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                        View all
                    </Link>
                </div>
                <div className="space-y-4">
                    {dashboardData.recentOrders.length === 0 ? (
                        <div className="text-center py-8">
                            <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No orders yet</p>
                            <Link 
                                href="/shop"
                                className="text-blue-600 hover:text-blue-700 font-medium"
                            >
                                Start shopping
                            </Link>
                        </div>
                    ) : (
                        dashboardData.recentOrders.map((order) => {
                            const statusColors = getStatusColor(order.status)
                            return (
                                <div key={order._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3">
                                            <Package className="h-5 w-5 text-gray-400" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    Order #{order.orderNumber || order._id.slice(-8)}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {formatDate(order.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-900">
                                            {formatCurrency(order.total)}
                                        </p>
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColors.bg} ${statusColors.color}`}>
                                            {order.status}
                                        </span>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link 
                        href="/shop"
                        className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                        <ShoppingCart className="h-6 w-6 text-blue-600 mr-3" />
                        <div>
                            <p className="font-medium text-blue-900">Shop Now</p>
                            <p className="text-sm text-blue-600">Browse our latest collection</p>
                        </div>
                    </Link>
                    
                    <Link 
                        href="/dashboard/my-orders"
                        className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                    >
                        <Package className="h-6 w-6 text-green-600 mr-3" />
                        <div>
                            <p className="font-medium text-green-900">Track Orders</p>
                            <p className="text-sm text-green-600">Check your order status</p>
                        </div>
                    </Link>
                    
                    <Link 
                        href="/dashboard/profile"
                        className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                    >
                        <User className="h-6 w-6 text-purple-600 mr-3" />
                        <div>
                            <p className="font-medium text-purple-900">Update Profile</p>
                            <p className="text-sm text-purple-600">Manage your information</p>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default dynamic(() => Promise.resolve(CustomerDashboardContent), {
    ssr: false,
    loading: () => (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <div className="h-12 w-12 border-4 border-pink-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading dashboard...</p>
            </div>
        </div>
    )
})