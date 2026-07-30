'use client';

import React, { useState, useEffect } from 'react';
import { Save, Loader2, Plus, Trash2 } from 'lucide-react';
import { settingsAPI } from '@/services/api';
import toast from 'react-hot-toast';
import { getCookie } from 'cookies-next';
import { useAppContext } from '@/context/AppContext';
import PermissionDenied from '@/components/Common/PermissionDenied';
import ImageUpload from '@/components/Common/ImageUpload';

export default function HeroOffersManagement() {
    const { hasPermission, contextLoading } = useAppContext();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [checkingPermission, setCheckingPermission] = useState(true);
    const [hasReadPermission, setHasReadPermission] = useState(false);
    const [hasUpdatePermission, setHasUpdatePermission] = useState(false);

    const [formData, setFormData] = useState({
        isActive: true,
        gridColumns: 3,
        offers: []
    });

    useEffect(() => {
        if (contextLoading) return;
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
            if (response.success && response.data?.heroOffers) {
                setFormData({
                    isActive: response.data.heroOffers.isActive ?? true,
                    gridColumns: response.data.heroOffers.gridColumns || 3,
                    offers: response.data.heroOffers.offers || []
                });
            }
        } catch (error) {
            console.error('Error fetching hero offers settings:', error);
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
            const response = await settingsAPI.updateSiteSettings({ heroOffers: formData }, token);

            if (response.success) {
                toast.success('Hero Offers updated successfully');
            } else {
                toast.error(response.message || 'Failed to save hero offers');
            }
        } catch (error) {
            console.error('Error saving hero offers:', error);
            toast.error('Error saving hero offers');
        } finally {
            setSaving(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (name === 'gridColumns' ? parseInt(value, 10) : value)
        }));
    };

    const handleAddOffer = () => {
        if (formData.offers.length >= 4) {
            toast.error("Maximum 4 offers allowed.");
            return;
        }
        setFormData(prev => ({
            ...prev,
            offers: [...prev.offers, { image: '', link: '' }]
        }));
    };

    const handleRemoveOffer = (index) => {
        setFormData(prev => {
            const newOffers = [...prev.offers];
            newOffers.splice(index, 1);
            return { ...prev, offers: newOffers };
        });
    };

    const handleOfferChange = (index, field, value) => {
        setFormData(prev => {
            const newOffers = [...prev.offers];
            newOffers[index] = { ...newOffers[index], [field]: value };
            return { ...prev, offers: newOffers };
        });
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
                message="You don't have permission to access hero offers settings"
                action="Contact your administrator for access"
                showBackButton={true}
            />
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Hero Offers</h1>
                    <p className="text-gray-600">Manage the dynamic offer grids displayed on the homepage</p>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-6 max-w-3xl">
                        
                        <div>
                            <div className="flex items-center mb-6">
                                <input
                                    type="checkbox"
                                    name="isActive"
                                    checked={formData.isActive}
                                    onChange={handleInputChange}
                                    className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded cursor-pointer"
                                />
                                <label className="ml-2 text-sm font-medium text-gray-700">
                                    Active (visible on website)
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Desktop Grid Columns
                                </label>
                                <select
                                    name="gridColumns"
                                    value={formData.gridColumns}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 cursor-pointer max-w-xs"
                                >
                                    <option value={1}>1 Column Grid</option>
                                    <option value={2}>2 Column Grid</option>
                                    <option value={3}>3 Column Grid</option>
                                    <option value={4}>4 Column Grid</option>
                                </select>
                                <p className="mt-1 text-xs text-gray-500">
                                    Control how many offers show side-by-side on desktop.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {formData.offers.map((offer, index) => (
                                <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200 relative">
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveOffer(index)}
                                        className="absolute top-4 right-4 text-red-500 hover:text-red-700 focus:outline-none bg-white rounded-full p-1 shadow-sm cursor-pointer"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                    
                                    <h4 className="font-medium text-gray-700 mb-4">Offer Banner {index + 1}</h4>
                                    
                                    <div className="space-y-4">
                                        <ImageUpload
                                            onImageUpload={(url) => handleOfferChange(index, 'image', url)}
                                            onImageRemove={() => handleOfferChange(index, 'image', '')}
                                            currentImage={offer.image}
                                            label="Offer Image"
                                        />
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Image URL (Or paste directly)
                                            </label>
                                            <input
                                                type="text"
                                                value={offer.image}
                                                onChange={(e) => handleOfferChange(index, 'image', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                                                placeholder="https://example.com/image.jpg"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Link (Optional)
                                            </label>
                                            <input
                                                type="text"
                                                value={offer.link}
                                                onChange={(e) => handleOfferChange(index, 'link', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                                                placeholder="e.g., /shop or https://example.com"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {formData.offers.length < 4 && (
                                <button
                                    type="button"
                                    onClick={handleAddOffer}
                                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-pink-500 hover:text-pink-500 transition-colors flex items-center justify-center cursor-pointer font-medium"
                                >
                                    <Plus className="w-5 h-5 mr-2" />
                                    Add Offer
                                </button>
                            )}

                            <div className="mt-4 p-4 bg-blue-50 text-blue-800 rounded-md border border-blue-200 shadow-sm">
                                <h3 className="text-sm font-bold mb-2">💡 Recommended Image Sizes</h3>
                                <ul className="text-sm space-y-2 list-disc list-inside">
                                    <li><strong>1 Grid Item:</strong> 1200 x 400 pixels (Wide rectangle)</li>
                                    <li><strong>2 Grid Items:</strong> 600 x 400 pixels (Half rectangle)</li>
                                    <li><strong>3 Grid Items:</strong> 400 x 400 pixels (Square or close to square)</li>
                                    <li><strong>4 Grid Items:</strong> 300 x 400 pixels (Portrait)</li>
                                </ul>
                                <p className="text-xs mt-3 opacity-80 border-t border-blue-200 pt-2">
                                * The number of items you add here automatically changes the layout columns on desktop! It is best to use images of the <strong>same dimensions</strong> for all items to ensure a clean layout.
                                </p>
                            </div>
                        </div>

                    </div>

                    <div className="flex justify-start pt-6 border-t border-gray-200 mt-8">
                        {hasUpdatePermission && (
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-6 py-2 text-sm font-medium text-white bg-pink-500 border border-transparent rounded-md hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 flex items-center cursor-pointer"
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
