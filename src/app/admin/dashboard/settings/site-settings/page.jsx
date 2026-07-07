'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { settingsAPI, uploadAPI } from '@/services/api';
import { Save, Image as ImageIcon, X } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';

export default function SiteSettingsPage() {
    const { token } = useAppContext();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [uploading, setUploading] = useState(false);
    
    const [formData, setFormData] = useState({
        logoUrl: '',
        isVideoAutoplayEnabled: true
    });

    useEffect(() => {
        fetchSiteSettings();
    }, []);

    const fetchSiteSettings = async () => {
        try {
            setFetching(true);
            const res = await settingsAPI.getSiteSettings();
            if (res.success && res.data) {
                setFormData({
                    logoUrl: res.data.logoUrl || '',
                    isVideoAutoplayEnabled: res.data.isVideoAutoplayEnabled ?? true
                });
            }
        } catch (error) {
            toast.error('Failed to load site settings');
            console.error(error);
        } finally {
            setFetching(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Please select a valid image file');
            return;
        }

        try {
            setUploading(true);
            const uploadData = new FormData();
            uploadData.append('image', file);

            const response = await uploadAPI.uploadSingle(uploadData);
            
            if (response.success) {
                const imageUrl = response.data.url || response.data.imageUrl;
                setFormData(prev => ({
                    ...prev,
                    logoUrl: imageUrl
                }));
                toast.success('Logo uploaded successfully!');
            } else {
                toast.error('Failed to upload logo: ' + response.message);
            }
        } catch (error) {
            console.error('Error uploading logo:', error);
            toast.error('Error uploading logo');
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveImage = () => {
        setFormData(prev => ({
            ...prev,
            logoUrl: ''
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            setLoading(true);
            
            const res = await settingsAPI.updateSiteSettings(formData, token);
            
            if (res.success) {
                toast.success('Site settings updated successfully');
            } else {
                toast.error(res.message || 'Failed to update site settings');
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
                <h1 className="text-2xl font-bold text-gray-900">Site Settings</h1>
                <p className="text-sm text-gray-500 mt-1">Manage global settings like logo and branding</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 space-y-6">
                    {/* Header Logo Section */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <ImageIcon className="w-5 h-5 mr-2 text-gray-500" />
                            Header Logo
                        </h2>
                        
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Logo URL
                                </label>
                                <input
                                    type="url"
                                    name="logoUrl"
                                    value={formData.logoUrl}
                                    onChange={handleChange}
                                    placeholder="https://example.com/logo.png"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500 transition-colors"
                                />
                                <p className="mt-2 text-xs text-gray-500">
                                    Paste an image URL here, or upload an image file below. (Recommended format: PNG or SVG)
                                </p>
                            </div>
                            
                            <div className="flex items-start space-x-4">
                                {formData.logoUrl ? (
                                    <div className="relative">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img 
                                            src={formData.logoUrl} 
                                            alt="Logo Preview" 
                                            className="w-48 h-auto object-contain bg-white border border-gray-200 rounded p-2"
                                            onError={(e) => { e.target.src = '/images/placeholder.png' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleRemoveImage}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-48 h-20 bg-gray-100 rounded flex items-center justify-center border-2 border-dashed border-gray-300">
                                        <ImageIcon className="w-8 h-8 text-gray-400" />
                                    </div>
                                )}
                                
                                <div className="flex-1 mt-2">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        disabled={uploading}
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100 disabled:opacity-50"
                                    />
                                    {uploading && (
                                        <p className="mt-1 text-sm text-pink-600">Uploading...</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Video Settings Section */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            Video Settings
                        </h2>
                        
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-900">Autoplay Videos</h3>
                                    <p className="text-sm text-gray-500">Automatically play (muted) videos on the product videos page.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, isVideoAutoplayEnabled: !prev.isVideoAutoplayEnabled }))}
                                    className={`${
                                        formData.isVideoAutoplayEnabled ? 'bg-pink-600' : 'bg-gray-200'
                                    } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2`}
                                >
                                    <span
                                        className={`${
                                            formData.isVideoAutoplayEnabled ? 'translate-x-5' : 'translate-x-0'
                                        } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                    <button
                        type="submit"
                        disabled={loading || uploading}
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
