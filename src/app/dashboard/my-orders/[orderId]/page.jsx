'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
    Package,
    Truck,
    CheckCircle,
    Clock,
    AlertCircle,
    ArrowLeft,
    MapPin,
    CreditCard,
    Calendar,
    RefreshCw,
    Coins,
    ShoppingCart
} from 'lucide-react'
import Link from 'next/link'
import { useAppContext } from '@/context/AppContext'
import { orderAPI } from '@/services/api'
import toast from 'react-hot-toast'

export default function OrderDetails() {
    const params = useParams()
    const router = useRouter()
    const { token, isAuthenticated } = useAppContext()
    const [order, setOrder] = useState(null)
    const [loading, setLoading] = useState(true)

    // Fetch order details from API
    const fetchOrderDetails = async () => {
        if (!isAuthenticated || !token || !params.orderId) {
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            const response = await orderAPI.getUserOrderById(params.orderId, token)

            if (response.success) {
                setOrder(response.data)
            } else {
                toast.error(response.message || 'Failed to fetch order details')
                router.push('/dashboard/my-orders')
            }
        } catch (error) {
            console.error('Error fetching order details:', error)
            toast.error('Failed to fetch order details')
            router.push('/dashboard/my-orders')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchOrderDetails()
    }, [isAuthenticated, token, params.orderId])

    if (!isAuthenticated) {
        return (
            <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Details</h1>
                    <p className="text-gray-600">Please login to view order details</p>
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

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-center py-12">
                        <RefreshCw className="h-8 w-8 text-gray-400 animate-spin" />
                        <span className="ml-2 text-gray-600">Loading order details...</span>
                    </div>
                </div>
            </div>
        )
    }

    if (!order) {
        return (
            <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h1>
                    <p className="text-gray-600">The order you're looking for doesn't exist or you don't have permission to view it.</p>
                    <div className="mt-4">
                        <Link
                            href="/dashboard/my-orders"
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Orders
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    // Transform order data for display
    const getStatusInfo = (status) => {
        const statusMap = {
            'pending': { label: 'Pending', color: 'text-pink-600', bg: 'bg-pink-100', icon: Clock },
            'confirmed': { label: 'Confirmed', color: 'text-blue-600', bg: 'bg-blue-100', icon: Clock },
            'processing': { label: 'Processing', color: 'text-pink-600', bg: 'bg-pink-100', icon: Clock },
            'shipped': { label: 'Shipped', color: 'text-blue-600', bg: 'bg-blue-100', icon: Truck },
            'delivered': { label: 'Delivered', color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle },
            'cancelled': { label: 'Cancelled', color: 'text-red-600', bg: 'bg-red-100', icon: AlertCircle },
            'returned': { label: 'Returned', color: 'text-gray-600', bg: 'bg-gray-100', icon: AlertCircle }
        }
        return statusMap[status] || statusMap['pending']
    }

    const statusInfo = getStatusInfo(order.status)
    const StatusIcon = statusInfo.icon

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        })
    }

    // Calculate totals
    const subtotal = order.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0
    const totalDiscount = (order.discount || 0) + (order.upsellDiscount || 0) + (order.loyaltyDiscount || 0) + (order.couponDiscount || 0)
    const total = subtotal + (order.shippingCost || 0) - totalDiscount

    return (
        <div className="min-h-screen bg-gray-50 py-6">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-6">
                    <Link
                        href="/dashboard/my-orders"
                        className="inline-flex items-center text-gray-600 hover:text-gray-900 text-sm font-medium mb-4"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Orders
                    </Link>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
                            <p className="text-sm text-gray-500 mt-1">Order #{order.orderId}</p>
                        </div>
                        <Link
                            href={`/dashboard/my-orders/${params.orderId}/reorder`}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Reorder
                        </Link>
                    </div>
                </div>

                {/* Order Status */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
                            <div>
                                <p className="text-sm text-gray-500">Order Status</p>
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                                    {statusInfo.label}
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500">Order Date</p>
                            <p className="text-sm font-medium text-gray-900">{formatDate(order.createdAt)}</p>
                            <p className="text-xs text-gray-500">{formatTime(order.createdAt)}</p>
                        </div>
                    </div>
                </div>

                {/* Order Items Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">Order Items</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {order.items?.map((item, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <img
                                                    src={item.image || '/images/placeholder.png'}
                                                    alt={item.name}
                                                    className="h-16 w-16 object-cover rounded-lg mr-4"
                                                />
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                                    {item.variant && (
                                                        <div className="text-sm text-gray-500 mt-1">
                                                            {item.variant.size && <span>Size: {item.variant.size}</span>}
                                                            {item.variant.color && <span className="ml-2">Color: {item.variant.color}</span>}
                                                        </div>
                                                    )}
                                                    {item.sku && (
                                                        <div className="text-xs text-gray-400 mt-1">SKU: {item.sku}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            ৳{item.price?.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                            {item.quantity}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                                            ৳{item.subtotal?.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Order Summary */}
                    <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Subtotal</span>
                                <span className="text-gray-900 font-medium">৳{subtotal.toLocaleString()}</span>
                            </div>
                            
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Shipping Cost</span>
                                <span className="text-gray-900 font-medium">৳{(order.shippingCost || 0).toLocaleString()}</span>
                            </div>

                            {order.couponDiscount > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Coupon Discount {order.coupon && `(${order.coupon})`}</span>
                                    <span className="text-green-600 font-medium">-৳{order.couponDiscount.toLocaleString()}</span>
                                </div>
                            )}

                            {order.discount > 0 && order.couponDiscount === 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Discount</span>
                                    <span className="text-green-600 font-medium">-৳{order.discount.toLocaleString()}</span>
                                </div>
                            )}

                            {order.upsellDiscount > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Upsell Discount</span>
                                    <span className="text-green-600 font-medium">-৳{order.upsellDiscount.toLocaleString()}</span>
                                </div>
                            )}

                            {order.loyaltyDiscount > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Loyalty Points Discount</span>
                                    <span className="text-pink-600 font-medium">-৳{order.loyaltyDiscount.toLocaleString()}</span>
                                </div>
                            )}

                            <div className="border-t border-gray-200 pt-3 mt-3">
                                <div className="flex justify-between">
                                    <span className="text-base font-semibold text-gray-900">Total</span>
                                    <span className="text-lg font-bold text-pink-600">৳{total.toLocaleString()}</span>
                                </div>
                            </div>

                            {order.loyaltyPointsUsed > 0 && (
                                <div className="mt-4 p-3 bg-pink-50 rounded-lg border border-pink-200">
                                    <div className="flex items-center text-sm text-pink-800">
                                        <Coins className="h-4 w-4 mr-2" />
                                        <div>
                                            <div className="font-semibold">Paid with {order.loyaltyPointsUsed} loyalty points</div>
                                            <div className="text-xs text-pink-600 mt-1">No additional payment required</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Payment & Other Info */}
                    <div className="space-y-6">
                        {/* Payment Information */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h2>
                            <div className="space-y-3">
                                <div className="flex items-start">
                                    <CreditCard className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-gray-500">Payment Method</p>
                                        <p className="text-sm font-medium text-gray-900 capitalize">
                                            {order.paymentMethod === 'cod' ? 'Cash on Delivery' : (order.paymentMethod || 'N/A')}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start">
                                    <Calendar className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-gray-500">Order Date</p>
                                        <p className="text-sm font-medium text-gray-900">{formatDate(order.createdAt)}</p>
                                        <p className="text-xs text-gray-500">{formatTime(order.createdAt)}</p>
                                    </div>
                                </div>

                                {order.loyaltyPointsUsed > 0 && (
                                    <div className="flex items-start">
                                        <Coins className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-gray-500">Loyalty Points Used</p>
                                            <p className="text-sm font-medium text-pink-600">
                                                {order.loyaltyPointsUsed} points (৳{order.loyaltyDiscount?.toLocaleString()})
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Shipping Address */}
                        {order.shippingAddress && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Address</h2>
                                <div className="space-y-2">
                                    <div className="flex items-start">
                                        <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                                        <div className="text-sm text-gray-700">
                                            {order.shippingAddress.street && <div>{order.shippingAddress.street}</div>}
                                            {order.shippingAddress.area && <div>{order.shippingAddress.area}</div>}
                                            {order.shippingAddress.upazila && <div>{order.shippingAddress.upazila}</div>}
                                            {order.shippingAddress.district && <div>{order.shippingAddress.district}</div>}
                                            {order.shippingAddress.division && <div>{order.shippingAddress.division}</div>}
                                            {order.shippingAddress.postalCode && <div>{order.shippingAddress.postalCode}</div>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    )
}