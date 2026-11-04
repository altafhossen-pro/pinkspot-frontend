'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { 
    ArrowLeft, 
    Save, 
    Facebook, 
    CheckCircle2, 
    AlertCircle, 
    RefreshCw, 
    ShieldCheck, 
    Sliders, 
    Eye,
    EyeOff
} from 'lucide-react';
import { settingsAPI } from '@/services/api';
import { useAppContext } from '@/context/AppContext';
import PermissionDenied from '@/components/Common/PermissionDenied';

export default function FacebookCapiSettingsPage() {
    const { token, hasPermission, contextLoading } = useAppContext();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [testingConnection, setTestingConnection] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const [showToken, setShowToken] = useState(false);

    // Form state - Single Pixel & CAPI setup
    const [formData, setFormData] = useState({
        isEnabled: false,
        pixelId: '',
        accessToken: '',
        testEventCode: '',
        trackPurchase: true,
        trackAddToCart: true,
        trackInitiateCheckout: true,
        trackViewContent: true,
        trackViewCategory: true,
        trackSearch: true,
        trackCompleteRegistration: true,
        trackContact: true
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setFetching(true);
            const capiRes = await settingsAPI.getFacebookCapiSettings();

            if (capiRes?.success && capiRes?.data) {
                const data = capiRes.data.facebookCapiSettings || capiRes.data;
                setFormData({
                    isEnabled: Boolean(data.isEnabled),
                    pixelId: data.pixelId || '',
                    accessToken: data.accessToken || '',
                    testEventCode: data.testEventCode || '',
                    trackPurchase: data.trackPurchase !== false,
                    trackAddToCart: data.trackAddToCart !== false,
                    trackInitiateCheckout: data.trackInitiateCheckout !== false,
                    trackViewContent: data.trackViewContent !== false,
                    trackViewCategory: data.trackViewCategory !== false,
                    trackSearch: data.trackSearch !== false,
                    trackCompleteRegistration: data.trackCompleteRegistration !== false,
                    trackContact: data.trackContact !== false
                });
            }
        } catch (error) {
            console.error('Failed to load Facebook CAPI settings:', error);
            toast.error('Failed to load Facebook CAPI settings');
        } finally {
            setFetching(false);
        }
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault();

        if (!hasPermission('settings', 'update')) {
            toast.error('You do not have permission to update settings');
            return;
        }

        try {
            setLoading(true);
            const res = await settingsAPI.updateFacebookCapiSettings(formData, token);
            if (res.success) {
                toast.success('Facebook Pixel & CAPI settings saved successfully!');
            } else {
                toast.error(res.message || 'Failed to update settings');
            }
        } catch (error) {
            console.error('Update failed:', error);
            toast.error(error.message || 'Error updating Facebook settings');
        } finally {
            setLoading(false);
        }
    };

    const handleTestConnection = async () => {
        if (!formData.pixelId) {
            toast.error('Please enter a Pixel ID before testing');
            return;
        }
        if (!formData.accessToken) {
            toast.error('Please enter a Conversions API Access Token before testing');
            return;
        }

        try {
            setTestingConnection(true);
            setTestResult(null);
            const res = await settingsAPI.testFacebookCapiConnection({
                pixelId: formData.pixelId,
                accessToken: formData.accessToken,
                testEventCode: formData.testEventCode
            }, token);

            if (res.success) {
                setTestResult({
                    success: true,
                    message: res.message || 'Meta CAPI connection verified! Test event dispatched.'
                });
                toast.success('Meta API connection successful!');
            } else {
                setTestResult({
                    success: false,
                    message: res.message || 'Failed to connect to Meta Graph API'
                });
                toast.error(res.message || 'Connection test failed');
            }
        } catch (error) {
            setTestResult({
                success: false,
                message: error.message || 'Network error while testing connection'
            });
            toast.error(error.message || 'Connection test error');
        } finally {
            setTestingConnection(false);
        }
    };

    if (contextLoading || fetching) {
        return (
            <div className="p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1877F2]"></div>
                </div>
            </div>
        );
    }

    if (!hasPermission('settings', 'read')) {
        return <PermissionDenied />;
    }

    return (
        <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3">
                    <Link
                        href="/admin/dashboard/settings"
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700 transition"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <Facebook className="w-5 h-5 text-[#1877F2]" />
                            <h1 className="text-xl font-bold text-gray-900">Facebook Pixel & Conversions API (CAPI)</h1>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Unified Meta Pixel & server-side Conversions API configuration for your entire store.
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-[#1877F2] text-white rounded-lg text-sm font-semibold hover:bg-[#166fe5] disabled:opacity-50 transition shadow-sm"
                >
                    <Save className="w-4 h-4" />
                    {loading ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            {/* Master Switch Card */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-semibold text-gray-900">Facebook Pixel & CAPI Status</h2>
                        <p className="text-xs text-gray-500 mt-1">
                            Enable or disable Facebook Pixel and Conversions API tracking across the store.
                        </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.isEnabled}
                            onChange={(e) => setFormData(prev => ({ ...prev, isEnabled: e.target.checked }))}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1877F2]"></div>
                    </label>
                </div>
            </div>

            {/* Pixel Credentials */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                    <ShieldCheck className="w-5 h-5 text-[#1877F2]" />
                    <div>
                        <h2 className="text-base font-semibold text-gray-900">Meta Pixel & API Credentials</h2>
                        <p className="text-xs text-gray-500">
                            Enter your Meta Pixel ID and Conversions API Access Token from Meta Events Manager.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Meta Pixel ID <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. 123456789012345"
                            value={formData.pixelId}
                            onChange={(e) => setFormData(prev => ({ ...prev, pixelId: e.target.value.trim() }))}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1877F2]"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Test Event Code (Optional)
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. TEST12345 (From Meta Events Manager 'Test events' tab)"
                            value={formData.testEventCode}
                            onChange={(e) => setFormData(prev => ({ ...prev, testEventCode: e.target.value.trim() }))}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1877F2]"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-semibold text-gray-700">
                                Conversions API Access Token <span className="text-red-500">*</span>
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowToken(!showToken)}
                                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                            >
                                {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                {showToken ? 'Hide Token' : 'Show Token'}
                            </button>
                        </div>
                        <textarea
                            rows={3}
                            placeholder="EAAG... (Generated from Meta Events Manager -> Settings -> Conversions API -> Set up manually)"
                            value={formData.accessToken}
                            onChange={(e) => setFormData(prev => ({ ...prev, accessToken: e.target.value.trim() }))}
                            className={`w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1877F2] font-mono ${!showToken ? 'tracking-wider' : ''}`}
                        />
                    </div>
                </div>

                {/* Test Connection Button & Result Alert */}
                <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={handleTestConnection}
                        disabled={testingConnection || !formData.pixelId || !formData.accessToken}
                        className="flex items-center gap-2 px-3.5 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-800 disabled:opacity-50 transition"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
                        {testingConnection ? 'Testing Meta Connection...' : 'Test Connection with Meta API'}
                    </button>

                    {testResult && (
                        <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg ${
                            testResult.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                            {testResult.success ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
                            <span>{testResult.message}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Event Toggles Grid */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                    <Sliders className="w-5 h-5 text-[#1877F2]" />
                    <div>
                        <h2 className="text-base font-semibold text-gray-900">Event Tracking Toggles</h2>
                        <p className="text-xs text-gray-500">
                            Choose which customer actions should be tracked and transmitted to Meta.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                        { key: 'trackPurchase', label: 'Purchase (Order Complete)', desc: 'Sends server-side on checkout success' },
                        { key: 'trackAddToCart', label: 'Add To Cart', desc: 'When customer adds an item to cart' },
                        { key: 'trackInitiateCheckout', label: 'Initiate Checkout', desc: 'When customer lands on checkout' },
                        { key: 'trackViewContent', label: 'View Content', desc: 'When viewing product details page' },
                        { key: 'trackViewCategory', label: 'View Category', desc: 'When filtering or viewing catalog' },
                        { key: 'trackSearch', label: 'Search', desc: 'When customer searches products' },
                        { key: 'trackCompleteRegistration', label: 'Registration', desc: 'When a new user registers an account' },
                        { key: 'trackContact', label: 'Contact', desc: 'When customer submits contact form' },
                    ].map((item) => (
                        <div key={item.key} className="flex items-start justify-between p-3 border border-gray-100 rounded-lg hover:border-gray-200 transition bg-gray-50/50">
                            <div className="pr-2">
                                <p className="text-xs font-semibold text-gray-800">{item.label}</p>
                                <p className="text-[11px] text-gray-500 mt-0.5">{item.desc}</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={formData[item.key]}
                                onChange={(e) => setFormData(prev => ({ ...prev, [item.key]: e.target.checked }))}
                                className="h-4 w-4 mt-0.5 text-[#1877F2] focus:ring-[#1877F2] rounded border-gray-300"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
