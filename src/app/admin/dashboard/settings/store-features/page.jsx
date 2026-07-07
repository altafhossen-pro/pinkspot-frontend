'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { settingsAPI } from '@/services/api';
import { Save, Plus, Trash2 } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';

export default function StoreFeaturesPage() {
    const { token } = useAppContext();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    
    const [formData, setFormData] = useState({
        storeFeatures: {
            backgroundColor: '#FF1493',
            textColor: '#FFFFFF',
            iconColor: '#FFFFFF',
            features: [
                { icon: 'Truck', title: 'Fast & Free Delivery', subtitle: 'Free delivery for all order over ৳ 3000' },
                { icon: 'Trophy', title: 'High Quality Product', subtitle: 'Maintain proper measurement and quality of product' },
                { icon: 'Monitor', title: '24/7 Customer Support', subtitle: 'Friendly 24/7 Customer Support' },
                { icon: 'Contact', title: 'Secure Online Payment', subtitle: 'We possess SSL/ Secure Certificate' }
            ]
        }
    });

    useEffect(() => {
        fetchSiteSettings();
    }, []);

    const fetchSiteSettings = async () => {
        try {
            setFetching(true);
            const res = await settingsAPI.getSiteSettings();
            if (res.success && res.data && res.data.storeFeatures) {
                setFormData({
                    storeFeatures: {
                        backgroundColor: res.data.storeFeatures.backgroundColor || '#FF1493',
                        textColor: res.data.storeFeatures.textColor || '#FFFFFF',
                        iconColor: res.data.storeFeatures.iconColor || '#FFFFFF',
                        features: res.data.storeFeatures.features?.length ? res.data.storeFeatures.features : formData.storeFeatures.features
                    }
                });
            }
        } catch (error) {
            toast.error('Failed to load store features');
            console.error(error);
        } finally {
            setFetching(false);
        }
    };

    const handleFeatureChange = (index, field, value) => {
        const newFeatures = [...formData.storeFeatures.features];
        newFeatures[index][field] = value;
        setFormData(prev => ({
            ...prev,
            storeFeatures: {
                ...prev.storeFeatures,
                features: newFeatures
            }
        }));
    };

    const addFeature = () => {
        if (formData.storeFeatures.features.length >= 4) {
            toast.error('Maximum 4 features allowed');
            return;
        }
        setFormData(prev => ({
            ...prev,
            storeFeatures: {
                ...prev.storeFeatures,
                features: [...prev.storeFeatures.features, { icon: 'Star', title: '', subtitle: '' }]
            }
        }));
    };

    const removeFeature = (index) => {
        const newFeatures = [...formData.storeFeatures.features];
        newFeatures.splice(index, 1);
        setFormData(prev => ({
            ...prev,
            storeFeatures: {
                ...prev.storeFeatures,
                features: newFeatures
            }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            setLoading(true);
            const res = await settingsAPI.updateSiteSettings({ storeFeatures: formData.storeFeatures }, token);
            
            if (res.success) {
                toast.success('Store features updated successfully');
            } else {
                toast.error(res.message || 'Failed to update store features');
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
                <h1 className="text-2xl font-bold text-gray-900">Store Features Banner</h1>
                <p className="text-sm text-gray-500 mt-1">Manage the features displayed under the homepage hero banner</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 space-y-6">
                    {/* Background Color */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Banner Styling</h2>
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Background Color
                                </label>
                                <div className="flex items-center space-x-3">
                                    <input
                                        type="color"
                                        value={formData.storeFeatures.backgroundColor.startsWith('#') ? formData.storeFeatures.backgroundColor : '#FF1493'}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            storeFeatures: { ...prev.storeFeatures, backgroundColor: e.target.value }
                                        }))}
                                        className="h-10 w-14 rounded cursor-pointer border border-gray-300"
                                    />
                                    <input
                                        type="text"
                                        value={formData.storeFeatures.backgroundColor}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            storeFeatures: { ...prev.storeFeatures, backgroundColor: e.target.value }
                                        }))}
                                        placeholder="#FF1493 or bg-pink-500"
                                        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500 flex-1 w-full text-sm"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Text Color
                                </label>
                                <div className="flex items-center space-x-3">
                                    <input
                                        type="color"
                                        value={formData.storeFeatures.textColor.startsWith('#') ? formData.storeFeatures.textColor : '#FFFFFF'}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            storeFeatures: { ...prev.storeFeatures, textColor: e.target.value }
                                        }))}
                                        className="h-10 w-14 rounded cursor-pointer border border-gray-300"
                                    />
                                    <input
                                        type="text"
                                        value={formData.storeFeatures.textColor}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            storeFeatures: { ...prev.storeFeatures, textColor: e.target.value }
                                        }))}
                                        placeholder="#FFFFFF or text-white"
                                        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500 flex-1 w-full text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Icon Color
                                </label>
                                <div className="flex items-center space-x-3">
                                    <input
                                        type="color"
                                        value={formData.storeFeatures.iconColor.startsWith('#') ? formData.storeFeatures.iconColor : '#FFFFFF'}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            storeFeatures: { ...prev.storeFeatures, iconColor: e.target.value }
                                        }))}
                                        className="h-10 w-14 rounded cursor-pointer border border-gray-300"
                                    />
                                    <input
                                        type="text"
                                        value={formData.storeFeatures.iconColor}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            storeFeatures: { ...prev.storeFeatures, iconColor: e.target.value }
                                        }))}
                                        placeholder="#FFFFFF or text-white"
                                        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500 flex-1 w-full text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Features List */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">Features (Max 4)</h2>
                            {formData.storeFeatures.features.length < 4 && (
                                <button
                                    type="button"
                                    onClick={addFeature}
                                    className="flex items-center px-3 py-1.5 text-sm bg-pink-50 text-pink-600 rounded hover:bg-pink-100 transition-colors"
                                >
                                    <Plus className="w-4 h-4 mr-1" />
                                    Add Feature
                                </button>
                            )}
                        </div>
                        
                        <div className="space-y-4">
                            {formData.storeFeatures.features.map((feature, index) => (
                                <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-100 relative">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Lucide Icon Name</label>
                                            <input
                                                type="text"
                                                value={feature.icon}
                                                onChange={(e) => handleFeatureChange(index, 'icon', e.target.value)}
                                                placeholder="e.g. Truck, Trophy"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                            />
                                            <a href="https://lucide.dev/icons" target="_blank" rel="noreferrer" className="text-[10px] text-pink-500 hover:underline">Find icons here</a>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
                                            <input
                                                type="text"
                                                value={feature.title}
                                                onChange={(e) => handleFeatureChange(index, 'title', e.target.value)}
                                                placeholder="e.g. Fast & Free Delivery"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Subtitle</label>
                                            <input
                                                type="text"
                                                value={feature.subtitle}
                                                onChange={(e) => handleFeatureChange(index, 'subtitle', e.target.value)}
                                                placeholder="e.g. Free delivery over ৳3000"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                            />
                                        </div>
                                    </div>
                                    
                                    {formData.storeFeatures.features.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeFeature(index)}
                                            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                                            title="Remove feature"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
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
