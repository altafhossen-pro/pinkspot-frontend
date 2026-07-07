'use client';

import React, { Suspense } from 'react';
import { CheckCircle, Eye, Calendar, DollarSign, Package, ExternalLink, User, Copy } from 'lucide-react';
import Footer from '@/components/Footer/Footer';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

function OrderConfirmation() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get('orderId');
    const status = searchParams.get('status');
    const total = searchParams.get('total');
    const createdAt = searchParams.get('createdAt');
    const couponDiscount = searchParams.get('couponDiscount');
    const loyaltyDiscount = searchParams.get('loyaltyDiscount');
    const discount = searchParams.get('discount');
    const upsellDiscount = searchParams.get('upsellDiscount');
    const affiliateDiscount = searchParams.get('affiliateDiscount');
    const affiliateCode = searchParams.get('affiliateCode');
    const coupon = searchParams.get('coupon');
    const isGuestOrder = searchParams.get('isGuestOrder') === 'true';

    // Calculate final total after discounts
    const calculateFinalTotal = () => {
        let finalTotal = parseFloat(total) || 0;
        if (couponDiscount) finalTotal -= parseFloat(couponDiscount);
        if (loyaltyDiscount) finalTotal -= parseFloat(loyaltyDiscount);
        if (discount) finalTotal -= parseFloat(discount);
        if (upsellDiscount) finalTotal -= parseFloat(upsellDiscount);
        if (affiliateDiscount) finalTotal -= parseFloat(affiliateDiscount);
        return Math.max(0, finalTotal); // Ensure total doesn't go below 0
    };

    const finalTotal = calculateFinalTotal();

    // Generate tracking URL
    const getTrackingUrl = () => {
        if (!orderId) return '';
        return `${window.location.origin}/tracking?orderId=${orderId}`;
    };

    // Copy tracking URL to clipboard
    const copyTrackingUrl = async () => {
        try {
            await navigator.clipboard.writeText(getTrackingUrl());
            toast.success('Tracking link copied to clipboard!');
        } catch (error) {
            toast.error('Failed to copy tracking link');
        }
    };


    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Get status color
    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'text-yellow-600 bg-yellow-100';
            case 'confirmed': return 'text-blue-600 bg-blue-100';
            case 'processing': return 'text-purple-600 bg-purple-100';
            case 'shipped': return 'text-indigo-600 bg-indigo-100';
            case 'delivered': return 'text-green-600 bg-green-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };
    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex flex-col">
            <div className="flex-1 flex items-center justify-center px-4 py-4">
                <div className="bg-white rounded-2xl shadow-xl p-4 text-center w-full max-w-xl mx-4">
                    {/* Success Icon */}
                    <div className="flex justify-center mb-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                            <CheckCircle className="w-8 h-8 text-white" />
                        </div>
                    </div>

                    {/* Success Message */}
                    <h1 className="text-lg font-bold text-gray-900 mb-2">
                        🎉 Order Placed Successfully!
                    </h1>
                    <p className="text-sm text-gray-600 mb-4">
                        Thank you for your order! We'll process it shortly.
                    </p>

                    {/* Guest Order Notice */}
                    {isGuestOrder && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                            <div className="flex items-start gap-2">
                                
                                <div>
                                    <h3 className="font-semibold text-blue-800 mb-1 text-sm">Guest Order Notice</h3>
                                    <p className="text-xs text-blue-700 mb-2">
                                        Since you placed this order as a guest, please save your Order ID and tracking link for future reference.
                                    </p>
                                    <div className="space-y-2">
                                        <div className="bg-white rounded p-3 border border-blue-200">
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs text-blue-600 font-medium">Order ID:</p>
                                                <p className="font-mono text-sm font-bold text-blue-800">{orderId}</p>
                                            </div>
                                        </div>
                                        <div className="bg-white rounded p-3 border border-blue-200">
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs text-blue-600 font-medium">Tracking Link:</p>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-mono text-xs text-blue-800 break-all max-w-xs truncate">{getTrackingUrl()}</p>
                                                    <button
                                                        onClick={copyTrackingUrl}
                                                        className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors flex-shrink-0 cursor-pointer"
                                                    >
                                                        <Copy className="w-3 h-3" />
                                                        Copy
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Order Information Grid */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        {/* Order ID */}
                        {orderId && (
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-2 border border-blue-100">
                                <div className="flex items-center justify-center mb-1">
                                    <Package className="w-3 h-3 text-blue-600 mr-1" />
                                    <span className="text-xs font-medium text-blue-600">Order ID</span>
                                </div>
                                <p className="text-xs font-bold text-gray-900">{orderId}</p>
                            </div>
                        )}

                        {/* Status */}
                        {status && (
                            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-2 border border-yellow-100">
                                <div className="flex items-center justify-center mb-1">
                                    <div className={`w-2 h-2 rounded-full mr-1 ${getStatusColor(status).split(' ')[1]}`}></div>
                                    <span className="text-xs font-medium text-gray-600">Status</span>
                                </div>
                                <p className={`text-xs font-semibold capitalize ${getStatusColor(status).split(' ')[0]}`}>
                                    {status}
                                </p>
                            </div>
                        )}

                        {/* Total Amount */}
                        {total && (
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-2 border border-green-100">
                                <div className="flex items-center justify-center mb-1">
                                    <DollarSign className="w-3 h-3 text-green-600 mr-1" />
                                    <span className="text-xs font-medium text-green-600">Total</span>
                                </div>
                                {finalTotal !== parseFloat(total) ? (
                                    <div className="text-center">
                                        <p className="text-sm font-bold text-gray-900">৳{finalTotal.toFixed(2)}</p>
                                        <p className="text-xs text-gray-500 line-through">৳{parseFloat(total).toFixed(2)}</p>
                                    </div>
                                ) : (
                                    <p className="text-sm font-bold text-gray-900">৳{finalTotal.toFixed(2)}</p>
                                )}
                            </div>
                        )}

                        {/* Order Date */}
                        {createdAt && (
                            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-2 border border-purple-100">
                                <div className="flex items-center justify-center mb-1">
                                    <Calendar className="w-3 h-3 text-purple-600 mr-1" />
                                    <span className="text-xs font-medium text-purple-600">Date</span>
                                </div>
                                <p className="text-xs font-semibold text-gray-900">{formatDate(createdAt)}</p>
                            </div>
                        )}
                    </div>

                    {/* Discount Breakdown */}
                    {(couponDiscount || loyaltyDiscount || discount || upsellDiscount || affiliateDiscount) && (
                        <div className="bg-gray-50 rounded-lg p-3 mb-4">
                            <h3 className="text-sm font-semibold text-gray-700 mb-2">Savings Applied</h3>
                            <div className="space-y-2">
                                {couponDiscount && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600">
                                            Coupon Discount {coupon && `(${coupon})`}
                                        </span>
                                        <span className="font-semibold text-blue-600">
                                            -৳{parseFloat(couponDiscount).toFixed(2)}
                                        </span>
                                    </div>
                                )}
                                {loyaltyDiscount && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600">Loyalty Points Discount</span>
                                        <span className="font-semibold text-pink-600">
                                            -৳{parseFloat(loyaltyDiscount).toFixed(2)}
                                        </span>
                                    </div>
                                )}
                                {upsellDiscount && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600">Upsell Discount</span>
                                        <span className="font-semibold text-green-600">
                                            -৳{parseFloat(upsellDiscount).toFixed(2)}
                                        </span>
                                    </div>
                                )}
                                {affiliateDiscount && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600">
                                            Affiliate Discount {affiliateCode && `(${affiliateCode})`}
                                        </span>
                                        <span className="font-semibold text-green-600">
                                            -৳{parseFloat(affiliateDiscount).toFixed(2)}
                                        </span>
                                    </div>
                                )}
                                {discount && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600">General Discount</span>
                                        <span className="font-semibold text-green-600">
                                            -৳{parseFloat(discount).toFixed(2)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    {orderId && (
                        <div className="space-y-3">
                            {/* Track Order Button */}
                            <Link
                                href={`/tracking?orderId=${orderId}`}
                                className="inline-flex items-center justify-center w-full px-6 py-3 border border-transparent text-base font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                            >
                                <ExternalLink className="w-5 h-5 mr-2" />
                                Track Your Order
                            </Link>


                            {/* View Details Button - Only for authenticated users */}
                            {!isGuestOrder && (
                                <Link
                                    href={`/dashboard/my-orders/${orderId}`}
                                    className="inline-flex items-center justify-center w-full px-6 py-3 border border-transparent text-base font-semibold rounded-xl text-white bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                                >
                                    <Eye className="w-5 h-5 mr-2" />
                                    View Order Details
                                </Link>
                            )}

                        </div>
                    )}
                </div>
            </div>

            <Footer />
        </div>
    );
}

// Wrapper component with Suspense boundary
export default function OrderConfirmationWithSuspense() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div></div>}>
            <OrderConfirmation />
        </Suspense>
    );
}
