'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    Package,
    DollarSign,
    MapPin,
    User,
    Clock,
    Truck,
    CheckCircle,
    XCircle,
    AlertCircle,
    Download,
    FileText,
    Building2,
    Phone,
    Mail,
    Calendar,
    Printer,
    Coins,
    CreditCard
} from 'lucide-react';
import { orderAPI } from '@/services/api';
import { toast } from 'react-hot-toast';

export default function OrderInvoicePage() {
    const { id: orderId } = useParams();
    const router = useRouter();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrderDetails();
    }, [orderId]);

    const fetchOrderDetails = async () => {
        try {
            setLoading(true);
            const data = await orderAPI.getAdminOrderDetails(orderId);

            if (data.success) {
                setOrder(data.data);
            } else {
                toast.error('Failed to fetch order details');
                router.push('/admin/dashboard/orders');
            }
        } catch (error) {
            console.error('Error fetching order details:', error);
            toast.error('Error fetching order details');
            router.push('/admin/dashboard/orders');
        } finally {
            setLoading(false);
        }
    };

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

    // Print function
    const handlePrint = () => {
        window.print()
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading invoice...</p>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600">Order not found</p>
                    <Link href="/admin/dashboard/orders" className="text-blue-600 hover:underline">
                        Back to Orders
                    </Link>
                </div>
            </div>
        );
    }

    const statusInfo = getStatusInfo(order.status)
    const StatusIcon = statusInfo.icon

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 print:hidden">
                <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <Link
                                href={`/admin/dashboard/orders/${orderId}`}
                                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Order
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Invoice</h1>
                                <p className="text-sm text-gray-600">Order #{order.orderId}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={handlePrint}
                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Print Invoice
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <>
                {/* Print Styles */}
                <style jsx global>{`
                @media print {
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    body * {
                        visibility: hidden;
                    }
                    .print-area, .print-area * {
                        visibility: visible;
                    }
                    .print-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        background: white !important;
                        font-size: 12px !important;
                        line-height: 1.2 !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .bg-gray-50 {
                        background: white !important;
                    }
                    .shadow-lg {
                        box-shadow: none !important;
                    }
                    .border-b {
                        border-bottom: 1px solid #e5e7eb !important;
                    }
                    /* Reduce spacing for print */
                    .print-area .px-8 {
                        padding-left: 1rem !important;
                        padding-right: 1rem !important;
                    }
                    .print-area .py-6 {
                        padding-top: 0.75rem !important;
                        padding-bottom: 0.75rem !important;
                    }
                    .print-area .mb-8 {
                        margin-bottom: 1rem !important;
                    }
                    .print-area .mt-8 {
                        margin-top: 1rem !important;
                    }
                    .print-area .mt-12 {
                        margin-top: 1.5rem !important;
                    }
                    .print-area .pt-8 {
                        padding-top: 1rem !important;
                    }
                    .print-area .gap-8 {
                        gap: 1rem !important;
                    }
                    .print-area .text-3xl {
                        font-size: 1.5rem !important;
                    }
                    .print-area .text-2xl {
                        font-size: 1.25rem !important;
                    }
                    .print-area .text-lg {
                        font-size: 1rem !important;
                    }
                    .print-area .h-16 {
                        height: 3rem !important;
                    }
                    .print-area .w-16 {
                        width: 3rem !important;
                    }
                    .print-area .py-4 {
                        padding-top: 0.5rem !important;
                        padding-bottom: 0.5rem !important;
                    }
                    .print-area .py-3 {
                        padding-top: 0.25rem !important;
                        padding-bottom: 0.25rem !important;
                    }
                    .print-area .px-4 {
                        padding-left: 0.5rem !important;
                        padding-right: 0.5rem !important;
                    }
                    .print-area .gap-6 {
                        gap: 0.5rem !important;
                    }
                    .print-area .mb-1 {
                        margin-bottom: 0.25rem !important;
                    }
                    .print-area .mt-1 {
                        margin-top: 0.25rem !important;
                    }
                    .print-area .text-xs {
                        font-size: 10px !important;
                    }
                    .print-area .text-sm {
                        font-size: 12px !important;
                    }
                    /* Print header - White background with black text */
                    .print-area .bg-gradient-to-r {
                        background: #ffffff !important;
                        border: none !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    /* Force all text in header to be black */
                    .print-area .bg-gradient-to-r,
                    .print-area .bg-gradient-to-r *,
                    .print-area .bg-gradient-to-r h1,
                    .print-area .bg-gradient-to-r p,
                    .print-area .bg-gradient-to-r div,
                    .print-area .bg-gradient-to-r span {
                        color: #000000 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    /* Specific targeting for header elements - Black text */
                    .print-area [class*="text-white"],
                    .print-area [class*="text-pink"] {
                        color: #000000 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    /* Force black text on any element */
                    .print-area .text-white {
                        color: #000000 !important;
                    }
                    .print-area .text-pink-100 {
                        color: #000000 !important;
                    }
                    .print-area .text-pink-200 {
                        color: #000000 !important;
                    }
                }
            `}</style>

                <div className="min-h-screen bg-gray-50 mt-5">
                    

                    {/* Invoice Container */}
                    <div className="max-w-4xl mx-auto px-6 pb-6">
                        <div className="bg-white shadow-lg rounded-lg overflow-hidden print-area">
                            {/* Invoice Header */}
                            <div className="bg-gradient-to-r from-pink-500 to-pink-600 px-6 py-4 text-white">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h1 className="text-2xl font-bold">INVOICE</h1>
                                        <p className="text-pink-100 mt-1 text-sm">Forpink.com</p>
                                        <p className="text-pink-100 text-sm">Premium Gold Jewelry & Accessories</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xl font-bold">#{order.orderId}</div>
                                        <div className="text-pink-100 mt-1 text-sm">
                                            {formatDate(order.createdAt)}
                                        </div>
                                        <div className="text-pink-100 text-sm">
                                            {formatTime(order.createdAt)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Invoice Body */}
                            <div className="px-6 py-4">
                                {/* Status Badge */}
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center space-x-4">
                                        <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                                            <StatusIcon className="h-4 w-4 mr-2" />
                                            {statusInfo.label}
                                        </span>
                                    </div>
                                    {order.status === 'delivered' && (
                                        <div className="flex items-center space-x-3 no-print">
                                            <button className="inline-flex items-center px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors">
                                                <Download className="h-4 w-4 mr-2" />
                                                Download PDF
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Company & Customer Info - Compact Horizontal */}
                                <div className="grid grid-cols-2 gap-6 mb-4">
                                    {/* Company Info */}
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-900 mb-1">From:</h3>
                                        <div className="text-gray-700 text-sm">
                                            <div className="font-semibold">Forpink.com</div>
                                            <div>123 Jewelry Street, Dhaka 1000</div>
                                            <div className="flex items-center mt-1">
                                                <Phone className="h-3 w-3 mr-1" />
                                                +880 1234 567890
                                            </div>
                                            <div className="flex items-center">
                                                <Mail className="h-3 w-3 mr-1" />
                                                info@goldstore.com
                                            </div>
                                        </div>
                                    </div>

                                    {/* Customer Info */}
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-900 mb-1">Bill To:</h3>
                                        <div className="text-gray-700 text-sm">
                                            <div className="font-semibold">{order.user?.name || 'Customer'}</div>
                                            <div>{order.user?.email || 'customer@email.com'}</div>
                                            {order.shippingAddress && (
                                                <div className="mt-1">
                                                    <div className="font-medium text-gray-600">Delivery Address:</div>
                                                    <div>{order.shippingAddress.street}</div>
                                                    <div>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</div>
                                                    <div>{order.shippingAddress.country}</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Order Items Table */}
                                <div className="mb-4">
                                    <h3 className="text-base font-semibold text-gray-900 mb-2">Order Items</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr className="bg-gray-50">
                                                    <th className="border border-gray-300 px-2 py-2 text-left text-xs font-semibold text-gray-900">Item</th>
                                                    <th className="border border-gray-300 px-2 py-2 text-left text-xs font-semibold text-gray-900">Description</th>
                                                    <th className="border border-gray-300 px-2 py-2 text-center text-xs font-semibold text-gray-900">Qty</th>
                                                    <th className="border border-gray-300 px-2 py-2 text-right text-xs font-semibold text-gray-900">Unit Price</th>
                                                    <th className="border border-gray-300 px-2 py-2 text-right text-xs font-semibold text-gray-900">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {order.items?.map((item, index) => (
                                                    <tr key={index} className="hover:bg-gray-50">
                                                        <td className="border border-gray-300 px-2 py-2">
                                                            <img
                                                                src={item.image || '/images/placeholder.png'}
                                                                alt={item.name}
                                                                className="h-12 w-12 object-cover rounded"
                                                            />
                                                        </td>
                                                        <td className="border border-gray-300 px-2 py-2">
                                                            <div className="font-medium text-gray-900 text-sm">{item.name}</div>
                                                            {item.variant && (
                                                                <div className="text-xs text-gray-500">
                                                                    {item.variant.size && <span>Size: {item.variant.size}</span>}
                                                                    {item.variant.color && <span className="ml-2">Color: {item.variant.color}</span>}
                                                                </div>
                                                            )}

                                                        </td>
                                                        <td className="border border-gray-300 px-2 py-2 text-center text-sm">
                                                            {item.quantity}
                                                        </td>
                                                        <td className="border border-gray-300 px-2 py-2 text-right text-sm">
                                                            ৳{item.price?.toLocaleString()}
                                                        </td>
                                                        <td className="border border-gray-300 px-2 py-2 text-right font-medium text-sm">
                                                            ৳{item.subtotal?.toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Order Summary */}
                                <div className="flex justify-end">
                                    <div className="w-full max-w-sm">
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h3 className="text-base font-semibold text-gray-900 mb-2">Order Summary</h3>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">Subtotal</span>
                                                    <span className="text-gray-900">৳{order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()}</span>
                                                </div>

                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">Shipping</span>
                                                    <span className="text-gray-900">৳{order.shippingCost.toLocaleString()}</span>
                                                </div>
                                                {order.couponDiscount > 0 && (
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-600">Coupon Discount {order.coupon && `(${order.coupon})`}</span>
                                                        <span className="text-blue-600">-৳{order.couponDiscount.toLocaleString()}</span>
                                                    </div>
                                                )}
                                                {order.discount > 0 && order.couponDiscount === 0 && (
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-600">Discount</span>
                                                        <span className="text-green-600">-৳{order.discount.toLocaleString()}</span>
                                                    </div>
                                                )}
                                                {order.loyaltyDiscount > 0 && (
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-600">Loyalty Points Discount</span>
                                                        <span className="text-pink-600">-৳{order.loyaltyDiscount.toLocaleString()}</span>
                                                    </div>
                                                )}
                                                <div className="border-t border-gray-300 pt-2">
                                                    <div className="flex justify-between text-base font-bold">
                                                        <span className="text-gray-900">Total</span>
                                                        <span className="text-pink-600">৳{order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) + order.shippingCost - (order.discount || 0) - (order.loyaltyDiscount || 0) - (order.couponDiscount || 0)}</span>
                                                    </div>
                                                </div>
                                                {order.loyaltyPointsUsed > 0 && (
                                                    <div className="mt-2 p-2 bg-pink-50 rounded border border-pink-200">
                                                        <div className="text-xs text-pink-800 text-center">
                                                            <div className="font-semibold">🪙 Paid with {order.loyaltyPointsUsed} coins</div>
                                                            <div>No additional payment required</div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Information */}
                                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <h3 className="text-base font-semibold text-gray-900 mb-2">Payment Information</h3>
                                        <div className="text-gray-700 text-sm">
                                            <div className="flex items-center mb-1">
                                                <CreditCard className="h-3 w-3 mr-2" />
                                                <span className="font-medium">Payment Method:</span>
                                                <span className="ml-2 capitalize">
                                                    {order.paymentMethod === 'cod' ? 'Cash on Delivery' : (order.paymentMethod || 'N/A')}
                                                </span>
                                            </div>
                                            {!!order.loyaltyPointsUsed && order.loyaltyPointsUsed > 0 && (
                                                <div className="flex items-center mb-1">
                                                    <Coins className="h-3 w-3 mr-2" />
                                                    <span className="font-medium">Paid with Loyalty Points:</span>
                                                    <span className="ml-2 text-pink-600 font-semibold">
                                                        {order.loyaltyPointsUsed} coins (৳{order.loyaltyDiscount?.toLocaleString()})
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex items-center">
                                                <Calendar className="h-3 w-3 mr-2" />
                                                <span className="font-medium">Order Date:</span>
                                                <span className="ml-2">{formatDate(order.createdAt)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tracking Information */}
                                    {order.tracking && order.tracking.length > 0 && (
                                        <div>
                                            <h3 className="text-base font-semibold text-gray-900 mb-2">Order Tracking</h3>
                                            <div className="space-y-2">
                                                {order.tracking.map((track, index) => (
                                                    <div key={index} className="flex items-start">
                                                        <div className="flex-shrink-0">
                                                            <div className="w-2 h-2 bg-pink-600 rounded-full mt-1"></div>
                                                        </div>
                                                        <div className="ml-2">
                                                            <div className="text-xs font-medium text-gray-900 capitalize">
                                                                {track.status.replace('_', ' ')}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {formatDate(track.date)} at {formatTime(track.date)}
                                                            </div>
                                                            {track.note && (
                                                                <div className="text-xs text-gray-600">
                                                                    {track.note}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="mt-6 pt-4 border-t border-gray-200 text-center text-gray-500 text-xs">
                                    <p>Thank you for your shopping! For any questions about this invoice, please contact us.</p>
                                    <p className="mt-1">This is a computer-generated invoice and does not require a signature.</p>
                                </div>
                            </div>
                        </div>

                        {/* Print Button - Outside Invoice */}
                        <div className="mt-6 text-center no-print">
                            <button
                                onClick={handlePrint}
                                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg cursor-pointer"
                            >
                                <Printer className="h-5 w-5 mr-2" />
                                Print Invoice
                            </button>
                        </div>
                    </div>
                </div>
            </>
        </div>
    );
}
