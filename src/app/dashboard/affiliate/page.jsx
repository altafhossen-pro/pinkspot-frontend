'use client';

import { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { affiliateAPI, settingsAPI } from '@/services/api';
import { getCookie } from 'cookies-next';
import toast from 'react-hot-toast';
import {
    Users,
    Link2,
    Copy,
    Share2,
    TrendingUp,
    ShoppingCart,
    DollarSign,
    Eye,
    CheckCircle,
    RefreshCw,
    Facebook,
    Twitter,
    MessageCircle,
    Mail,
    AlertCircle
} from 'lucide-react';

export default function AffiliatePage() {
    const { user } = useAppContext();
    const [loading, setLoading] = useState(true);
    const [affiliate, setAffiliate] = useState(null);
    const [copied, setCopied] = useState(false);
    const [baseUrl, setBaseUrl] = useState('');
    const [isAffiliateEnabled, setIsAffiliateEnabled] = useState(true);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setBaseUrl(window.location.origin);
        }
        fetchAffiliateSettings();
        fetchAffiliate();
    }, []);

    const fetchAffiliateSettings = async () => {
        try {
            const response = await settingsAPI.getAffiliateSettings();
            if (response.success && response.data) {
                setIsAffiliateEnabled(response.data.isAffiliateEnabled !== false);
            }
        } catch (error) {
            console.error('Error fetching affiliate settings:', error);
            // Default to enabled if API fails
        }
    };

    const fetchAffiliate = async () => {
        try {
            setLoading(true);
            const token = getCookie('token');
            if (!token) {
                toast.error('Please login to view affiliate');
                return;
            }

            const response = await affiliateAPI.createOrGetAffiliate(token);
            if (response.success) {
                setAffiliate(response.data);
            } else {
                toast.error(response.message || 'Failed to fetch affiliate data');
            }
        } catch (error) {
            console.error('Error fetching affiliate:', error);
            toast.error('Failed to load affiliate data');
        } finally {
            setLoading(false);
        }
    };

    const affiliateUrl = affiliate ? `${baseUrl}?affiliate=${affiliate.affiliateCode}` : '';

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(affiliateUrl);
            setCopied(true);
            toast.success('Affiliate link copied to clipboard!');
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
            toast.error('Failed to copy link');
        }
    };

    const shareOnSocialMedia = (platform) => {
        const text = `Check out this amazing store! Use my affiliate link: ${affiliateUrl}`;
        let url = '';

        switch (platform) {
            case 'facebook':
                url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(affiliateUrl)}`;
                break;
            case 'twitter':
                url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(affiliateUrl)}`;
                break;
            case 'whatsapp':
                url = `https://wa.me/?text=${encodeURIComponent(text)}`;
                break;
            case 'email':
                url = `mailto:?subject=Check out this store&body=${encodeURIComponent(text)}`;
                break;
            default:
                return;
        }

        window.open(url, '_blank', 'width=600,height=400');
    };

    const stats = [
        {
            name: 'Total Clicks',
            value: affiliate?.totalClicks || 0,
            icon: Eye,
            color: 'bg-blue-500'
        },
        {
            name: 'Unique Clicks',
            value: affiliate?.uniqueClicks || 0,
            icon: TrendingUp,
            color: 'bg-green-500'
        },
        {
            name: 'Total Purchases',
            value: affiliate?.totalPurchases || 0,
            icon: ShoppingCart,
            color: 'bg-purple-500'
        },
        {
            name: 'Total Revenue',
            value: `৳${(affiliate?.totalPurchaseAmount || 0).toLocaleString()}`,
            icon: DollarSign,
            color: 'bg-yellow-500'
        }
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center space-x-3">
                    <div className="p-3 bg-blue-100 rounded-lg">
                        <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Affiliate Program</h1>
                        <p className="text-gray-600">Share your unique link and earn rewards</p>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <div key={stat.name} className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                            </div>
                            <div className={`p-3 rounded-lg ${stat.color}`}>
                                <stat.icon className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Affiliate Link Section - Only show if enabled */}
            {isAffiliateEnabled && affiliate && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Affiliate Link</h2>
                    
                    <div className="space-y-4">
                        {/* Affiliate Code */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Your Affiliate Code
                            </label>
                            <div className="flex items-center space-x-2">
                                <div className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg font-mono text-lg font-semibold text-gray-900">
                                    {affiliate.affiliateCode}
                                </div>
                                <button
                                    onClick={copyToClipboard}
                                    className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer flex items-center space-x-2"
                                >
                                    {copied ? (
                                        <>
                                            <CheckCircle className="h-5 w-5" />
                                            <span>Copied!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="h-5 w-5" />
                                            <span>Copy</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Affiliate URL */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Your Affiliate URL
                            </label>
                            <div className="flex items-center space-x-2">
                                <div className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-700 break-all">
                                    {affiliateUrl || 'Loading...'}
                                </div>
                                <button
                                    onClick={copyToClipboard}
                                    className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
                                    title="Copy link"
                                >
                                    <Copy className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        {/* Share Buttons */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Share on Social Media
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <button
                                    onClick={() => shareOnSocialMedia('facebook')}
                                    className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                                >
                                    <Facebook className="h-5 w-5" />
                                    <span>Facebook</span>
                                </button>
                                <button
                                    onClick={() => shareOnSocialMedia('twitter')}
                                    className="flex items-center justify-center space-x-2 px-4 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors cursor-pointer"
                                >
                                    <Twitter className="h-5 w-5" />
                                    <span>Twitter</span>
                                </button>
                                <button
                                    onClick={() => shareOnSocialMedia('whatsapp')}
                                    className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer"
                                >
                                    <MessageCircle className="h-5 w-5" />
                                    <span>WhatsApp</span>
                                </button>
                                <button
                                    onClick={() => shareOnSocialMedia('email')}
                                    className="flex items-center justify-center space-x-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
                                >
                                    <Mail className="h-5 w-5" />
                                    <span>Email</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Disabled Message */}
            {!isAffiliateEnabled && (
                <div className="bg-amber-50 rounded-lg p-6 border border-amber-200">
                    <div className="flex items-start space-x-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                            <AlertCircle className="h-6 w-6 text-amber-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-amber-900 mb-2">
                                Affiliate System Currently Disabled
                            </h3>
                            <p className="text-amber-800">
                                The affiliate program is currently disabled. Your stats are still visible, but you cannot share affiliate links at this time. Please check back later or contact support for more information.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Info Section */}
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">How it works</h3>
                <ul className="space-y-2 text-blue-800">
                    <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Share your unique affiliate link with friends and family</span>
                    </li>
                    <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>When someone clicks your link and makes a purchase, you earn rewards</span>
                    </li>
                    <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Track your clicks, purchases, and earnings in real-time</span>
                    </li>
                    <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Your affiliate code is unique and cannot be changed</span>
                    </li>
                </ul>
            </div>
        </div>
    );
}

