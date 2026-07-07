'use client';

import React, { useState, useEffect } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { settingsAPI } from '@/services/api';
import toast from 'react-hot-toast';
import { getCookie } from 'cookies-next';
import { useAppContext } from '@/context/AppContext';
import PermissionDenied from '@/components/Common/PermissionDenied';
import ImageUpload from '@/components/Common/ImageUpload';

export default function TopHeroBannerManagement() {
    const { hasPermission, contextLoading } = useAppContext();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [checkingPermission, setCheckingPermission] = useState(true);
    const [hasReadPermission, setHasReadPermission] = useState(false);
    const [hasUpdatePermission, setHasUpdatePermission] = useState(false);

    const [formData, setFormData] = useState({
        type: 'image',
        image: '',
        videoUrl: '',
        title: '',
        subtitle: '',
        buttonText: '',
        link: '',
        isActive: true
    });

    useEffect(() => {
        if (contextLoading) return;
        // Re-use banner permissions
        const canRead = hasPermission('banner', 'read');
        const canUpdate = hasPermission('banner', 'update');
        setHasReadPermission(canRead);
        setHasUpdatePermission(!!canUpdate);
        setCheckingPermission(false);
        if (canRead) {
            fetchSettings();
        } else {
            setLoading(false);
        }
    }, [contextLoading, hasPermission]);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await settingsAPI.getSiteSettings();
            if (response.success && response.data?.topHeroBanner) {
                setFormData({
                    type: response.data.topHeroBanner.type || 'image',
                    image: response.data.topHeroBanner.image || '',
                    videoUrl: response.data.topHeroBanner.videoUrl || '',
                    title: response.data.topHeroBanner.title || '',
                    subtitle: response.data.topHeroBanner.subtitle || '',
                    buttonText: response.data.topHeroBanner.buttonText || '',
                    link: response.data.topHeroBanner.link || '',
                    isActive: response.data.topHeroBanner.isActive ?? true
                });
            }
        } catch (error) {
            console.error('Error fetching top hero banner settings:', error);
            toast.error('Error fetching settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!hasUpdatePermission) {
            toast.error("You don't have permission to update settings");
            return;
        }

        try {
            setSaving(true);
            const token = getCookie('token');
            const response = await settingsAPI.updateSiteSettings({ topHeroBanner: formData }, token);

            if (response.success) {
                toast.success('Top Hero Banner updated successfully');
            } else {
                toast.error(response.message || 'Failed to save banner');
            }
        } catch (error) {
            console.error('Error saving top hero banner:', error);
            toast.error('Error saving banner');
        } finally {
            setSaving(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    if (checkingPermission || contextLoading || loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
            </div>
        );
    }

    if (!hasReadPermission) {
        return (
            <PermissionDenied
                title="Access Denied"
                message="You don't have permission to access top hero banner settings"
                action="Contact your administrator for access"
                showBackButton={true}
            />
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Hero Banner Top</h1>
                    <p className="text-gray-600">Manage the static banner displayed at the very top of the homepage</p>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-6 max-w-3xl">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Banner Type
                            </label>
                            <select
                                name="type"
                                value={formData.type}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                            >
                                <option value="image">Image Banner</option>
                                <option value="video">Video Banner</option>
                            </select>
                        </div>

                        {formData.type === 'image' ? (
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <ImageUpload
                                    onImageUpload={(url) => setFormData(prev => ({ ...prev, image: url }))}
                                    onImageRemove={() => setFormData(prev => ({ ...prev, image: '' }))}
                                    currentImage={formData.image}
                                    label="Banner Image Upload"
                                />
                                
                                <div className="mt-4 flex items-center justify-center">
                                    <span className="text-gray-400 font-medium px-4">OR</span>
                                </div>

                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Image URL
                                    </label>
                                    <input
                                        type="text"
                                        name="image"
                                        value={formData.image}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                                        placeholder="https://example.com/image.jpg"
                                    />
                                </div>
                                <p className="mt-4 text-sm text-gray-500">
                                    Recommended aspect ratio: 5:1 (Desktop) / 5:2 (Mobile).
                                </p>
                            </div>
                        ) : (
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Video Embed URL / Direct URL
                                    </label>
                                    <input
                                        type="text"
                                        name="videoUrl"
                                        value={formData.videoUrl}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                                        placeholder="e.g. https://www.youtube.com/embed/..."
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Paste an embed URL (e.g. YouTube, Vimeo) or a direct video URL.
                                    </p>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Title Text (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                                            placeholder="Hero Title"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Subtitle Text (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            name="subtitle"
                                            value={formData.subtitle}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                                            placeholder="Hero Subtitle"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Button Text (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            name="buttonText"
                                            value={formData.buttonText}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                                            placeholder="e.g. Shop Now"
                                        />
                                        <p className="mt-1 text-xs text-gray-500">
                                            A button will appear on the banner if you provide text and a Link below.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Link (Optional)
                            </label>
                            <input
                                type="text"
                                name="link"
                                value={formData.link}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                                placeholder="e.g., /shop or https://example.com"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                URL to navigate when the banner is clicked.
                            </p>
                        </div>

                        <div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="isActive"
                                    checked={formData.isActive}
                                    onChange={handleInputChange}
                                    className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                                />
                                <label className="ml-2 text-sm text-gray-700">
                                    Active (visible on website)
                                </label>
                            </div>
                            <p className="mt-1 text-xs text-gray-500 ml-6">
                                Toggle to show or hide this banner from the homepage.
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-start pt-6 border-t border-gray-200 mt-8">
                        {hasUpdatePermission && (
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-6 py-2 text-sm font-medium text-white bg-pink-500 border border-transparent rounded-md hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 flex items-center"
                            >
                                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                <Save className="w-4 h-4 mr-2" />
                                Save Changes
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
