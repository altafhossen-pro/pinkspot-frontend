'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { settingsAPI } from '@/services/api';
import { Save } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';

export default function ProductSubtitlePage() {
    const { token } = useAppContext();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    
    const [formData, setFormData] = useState({
        globalProductSubtitle: {
            text: '',
            isEnabled: false
        }
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setFetching(true);
            const res = await settingsAPI.getSiteSettings();
            if (res.success && res.data) {
                setFormData({
                    globalProductSubtitle: {
                        text: res.data.globalProductSubtitle?.text || '',
                        isEnabled: res.data.globalProductSubtitle?.isEnabled ?? false
                    }
                });
            }
        } catch (error) {
            toast.error('Failed to load settings');
            console.error(error);
        } finally {
            setFetching(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            setLoading(true);
            
            const res = await settingsAPI.updateGlobalProductSubtitle(formData.globalProductSubtitle, token);
            
            if (res.success) {
                toast.success('Product subtitle updated successfully');
            } else {
                toast.error(res.message || 'Failed to update settings');
            }
        } catch (error) {
            toast.error('An error occurred');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Products Global Subtitle</h1>
                <p className="text-sm text-gray-500 mt-1">Manage the global subtitle shown on all products</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 space-y-6">
                    <div>
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-900">Enable Global Subtitle</h3>
                                    <p className="text-sm text-gray-500">Show this subtitle on all products globally.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ 
                                        ...prev, 
                                        globalProductSubtitle: {
                                            ...prev.globalProductSubtitle,
                                            isEnabled: !prev.globalProductSubtitle.isEnabled
                                        }
                                    }))}
                                    className={`${
                                        formData.globalProductSubtitle?.isEnabled ? 'bg-pink-600' : 'bg-gray-200'
                                    } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2`}
                                >
                                    <span
                                        className={`${
                                            formData.globalProductSubtitle?.isEnabled ? 'translate-x-5' : 'translate-x-0'
                                        } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                                    />
                                </button>
                            </div>
                            
                            {formData.globalProductSubtitle?.isEnabled && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Subtitle Text
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.globalProductSubtitle?.text || ''}
                                        onChange={(e) => setFormData(prev => ({ 
                                            ...prev, 
                                            globalProductSubtitle: {
                                                ...prev.globalProductSubtitle,
                                                text: e.target.value
                                            }
                                        }))}
                                        placeholder="e.g. Free Shipping on orders over ৳1500!"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500 transition-colors"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 transition-colors"
                    >
                        {loading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                            <Save className="w-4 h-4 mr-2" />
                        )}
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    );
}
