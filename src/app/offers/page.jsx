'use client';

import React, { useState, useEffect } from 'react';
import Footer from "@/components/Footer/Footer";
import { Clock, Tag, Copy, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { couponAPI } from '@/services/api';
import toast from 'react-hot-toast';

export default function Offers() {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [copiedCode, setCopiedCode] = useState(null);
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        fetchPublicCoupons();
    }, []);

    const fetchPublicCoupons = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Fetch publicly visible coupons (no authentication required)
            const response = await couponAPI.getPublicCoupons({ 
                limit: 20 
            });
            
            if (response.success) {
                // The API already filters for valid coupons, so we can use them directly
                setCoupons(response.data || []);
            } else {
                setError('Failed to load offers');
            }
        } catch (error) {
            console.error('Error fetching coupons:', error);
            setError('Failed to load offers. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Helper function to format discount display
    const formatDiscount = (coupon) => {
        if (coupon.discountType === 'percentage') {
            return `${coupon.discountValue}% Off`;
        } else {
            return `৳${coupon.discountValue} Off`;
        }
    };

    // Helper function to get status
    const getCouponStatus = (coupon) => {
        const now = new Date();
        const endDate = new Date(coupon.endDate);
        
        if (!coupon.isActive) return 'Inactive';
        if (endDate <= now) return 'Expired';
        if (coupon.maxUsage && coupon.usedCount >= coupon.maxUsage) return 'Used Up';
        return 'Active';
    };

    const formatTimeLeft = (endDate) => {
        const difference = endDate - currentTime;

        if (difference <= 0) {
            return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        }

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);

        return { days, hours, minutes, seconds };
    };

    const formatNumber = (num) => {
        return num < 10 ? `0${num}` : num;
    };

    const copyToClipboard = (code, id) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(id);
        toast.success(`Coupon code "${code}" copied to clipboard!`);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Header Section */}
                <div className="text-center mb-12">
                    
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Special Offers & Coupons</h1>
                    <p className="text-gray-600 text-lg">Discover amazing discounts and voucher codes</p>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-pink-500 mr-3" />
                        <span className="text-gray-600">Loading amazing offers...</span>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="flex items-center justify-center py-12">
                        <AlertCircle className="w-8 h-8 text-red-500 mr-3" />
                        <div className="text-center">
                            <p className="text-red-600 mb-4">{error}</p>
                            <button 
                                onClick={fetchPublicCoupons}
                                className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                )}

                {/* No Offers State */}
                {!loading && !error && coupons.length === 0 && (
                    <div className="text-center py-12">
                        <Tag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Offers</h3>
                        <p className="text-gray-600">Check back later for amazing deals!</p>
                    </div>
                )}

                {/* Offers Grid */}
                {!loading && !error && coupons.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-12">
                        {coupons.map((coupon) => {
                            const timeLeft = formatTimeLeft(new Date(coupon.endDate));
                            const status = getCouponStatus(coupon);
                            const isExpired = status !== 'Active';

                        return (
                            <div key={coupon._id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 ">
                                {/* Header with discount badge */}
                                <div className="bg-gradient-to-r from-pink-500 to-purple-500 p-4 text-white text-center">
                                    <div className="text-2xl font-bold">{formatDiscount(coupon)}</div>
                                    <div className="text-sm opacity-90">{coupon.description || 'Special Offer'}</div>
                                </div>

                                <div className="p-6">
                                    {/* Countdown Timer */}
                                    <div className="mb-6">
                                        <div className="text-center mb-3">
                                            <span className="text-sm font-medium text-gray-600">Offer expires in:</span>
                                        </div>
                                        <div className="grid grid-cols-4 gap-2">
                                            {[
                                                { label: 'Days', value: timeLeft.days },
                                                { label: 'Hours', value: timeLeft.hours },
                                                { label: 'Mins', value: timeLeft.minutes },
                                                { label: 'Secs', value: timeLeft.seconds }
                                            ].map((item, index) => (
                                                <div key={index} className={`rounded-lg p-3 text-center shadow-sm border ${isExpired
                                                        ? 'bg-red-50 border-red-200'
                                                        : 'bg-gradient-to-br from-pink-50 to-purple-50 border-pink-200'
                                                    }`}>
                                                    <div className="text-lg font-bold text-gray-900">
                                                        {formatNumber(item.value)}
                                                    </div>
                                                    <div className="text-xs text-gray-500">{item.label}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Coupon Code Section */}
                                    <div className="mb-4">
                                        <div className="bg-gradient-to-r from-pink-50 to-purple-50 border-2 border-dashed border-pink-300 rounded-xl p-4 shadow-sm">
                                            <div className="text-center mb-2">
                                                <span className="text-sm text-gray-600">Coupon Code</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xl font-bold text-pink-600 tracking-wider">{coupon.code}</span>
                                                <button
                                                    onClick={() => copyToClipboard(coupon.code, coupon._id)}
                                                    className="text-pink-600 hover:text-pink-700 transition-colors p-2 rounded-full hover:bg-pink-100 cursor-pointer"
                                                >
                                                    {copiedCode === coupon._id ? (
                                                        <CheckCircle className="w-5 h-5" />
                                                    ) : (
                                                        <Copy className="w-5 h-5" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status and Conditions */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Status:</span>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                status === 'Active' 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {status}
                                            </span>
                                        </div>
                                        
                                        <div className="text-sm text-gray-500 text-center">
                                            * Minimum order: <span className="font-bold text-gray-700">৳{coupon.minOrderAmount || 0}</span>
                                        </div>
                                        
                                        {coupon.maxUsage && (
                                            <div className="text-sm text-gray-500 text-center">
                                                * Limited to {coupon.maxUsage} uses
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    </div>
                )}

                {/* Additional Info Section */}
                <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">How to Use Coupons</h2>
                        <p className="text-gray-600">Follow these simple steps to redeem your discount</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            {
                                step: "1",
                                title: "Copy Code",
                                description: "Click the copy button next to your desired coupon code"
                            },
                            {
                                step: "2",
                                title: "Add to Cart",
                                description: "Add products worth the minimum amount to your cart"
                            },
                            {
                                step: "3",
                                title: "Apply & Save",
                                description: "Paste the code at checkout and enjoy your discount"
                            }
                        ].map((item, index) => (
                            <div key={index} className="text-center p-6 rounded-xl bg-gradient-to-br from-pink-50 to-purple-50 border border-pink-100 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                                <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg shadow-lg">
                                    {item.step}
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                                <p className="text-gray-600 text-sm">{item.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
