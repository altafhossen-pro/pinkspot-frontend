'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, ArrowUp, ArrowDown, Upload, X } from 'lucide-react';
import { heroBannerAPI } from '@/services/api';
import DeleteConfirmationModal from '@/components/Common/DeleteConfirmationModal';
import { toast } from 'react-hot-toast';
import { getCookie } from 'cookies-next';
import { useAppContext } from '@/context/AppContext';
import PermissionDenied from '@/components/Common/PermissionDenied';
import ImageUpload from '@/components/Common/ImageUpload';

export default function HeroBannerManagement() {
    const { hasPermission, contextLoading } = useAppContext();
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [checkingPermission, setCheckingPermission] = useState(true);
    const [hasReadPermission, setHasReadPermission] = useState(false);
    const [hasUpdatePermission, setHasUpdatePermission] = useState(false);
    const [hasCreatePermission, setHasCreatePermission] = useState(false);
    const [hasDeletePermission, setHasDeletePermission] = useState(false);
    const [permissionError, setPermissionError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingBanner, setEditingBanner] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [bannerToDelete, setBannerToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Form data
    const [formData, setFormData] = useState({
        image: '',
        link: '',
        isActive: true,
        order: 0
    });

    useEffect(() => {
        if (contextLoading) return;
        const canRead = hasPermission('banner', 'read');
        const canUpdate = hasPermission('banner', 'update');
        const canCreate = hasPermission('banner', 'create');
        const canDelete = hasPermission('banner', 'delete');
        setHasReadPermission(canRead);
        setHasUpdatePermission(!!canUpdate);
        setHasCreatePermission(!!canCreate);
        setHasDeletePermission(!!canDelete);
        setCheckingPermission(false);
        if (canRead) {
            fetchBanners();
        } else {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [contextLoading]);

    const fetchBanners = async () => {
        try {
            setLoading(true);
            const token = getCookie('token');
            const response = await heroBannerAPI.getAllHeroBanners(token);
            
            if (response.success) {
                setBanners(response.data || []);
            } else {
                if (response.status === 403) {
                    setPermissionError(response.message || "You don't have permission to read hero banners");
                } else {
                    toast.error(response.message || 'Failed to fetch banners');
                }
            }
        } catch (error) {
            console.error('Error fetching banners:', error);
            if (error?.status === 403) {
                setPermissionError(error?.data?.message || "You don't have permission to read hero banners");
            } else {
                toast.error('Error fetching banners');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAddNew = () => {
        setEditingBanner(null);
        setFormData({
            image: '',
            link: '',
            isActive: true,
            order: banners.length
        });
        setShowModal(true);
    };

    const handleEdit = (banner) => {
        setEditingBanner(banner);
        setFormData({
            image: banner.image || '',
            link: banner.link || '',
            isActive: banner.isActive !== false,
            order: banner.order || 0
        });
        setShowModal(true);
    };

    const handleDeleteClick = (banner) => {
        setBannerToDelete(banner);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!bannerToDelete) return;
        if (!hasDeletePermission) {
            toast.error("You don't have permission to delete hero banners");
            return;
        }

        try {
            setDeleting(true);
            const token = getCookie('token');
            const response = await heroBannerAPI.deleteHeroBanner(bannerToDelete._id, token);
            
            if (response.success) {
                toast.success('Banner deleted successfully');
                fetchBanners();
            } else {
                toast.error(response.message || 'Failed to delete banner');
            }
        } catch (error) {
            console.error('Error deleting banner:', error);
            toast.error('Error deleting banner');
        } finally {
            setDeleting(false);
            setShowDeleteModal(false);
            setBannerToDelete(null);
        }
    };

    const handleDeleteCancel = () => {
        setShowDeleteModal(false);
        setBannerToDelete(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            const token = getCookie('token');
            let response;

            if (editingBanner) {
                response = await heroBannerAPI.updateHeroBanner(editingBanner._id, formData, token);
            } else {
                if (!hasCreatePermission) {
                    toast.error("You don't have permission to create hero banners");
                    return;
                }
                response = await heroBannerAPI.createHeroBanner(formData, token);
            }

            if (response.success) {
                toast.success(editingBanner ? 'Banner updated successfully' : 'Banner created successfully');
                setShowModal(false);
                fetchBanners();
            } else {
                toast.error(response.message || 'Failed to save banner');
            }
        } catch (error) {
            console.error('Error saving banner:', error);
            toast.error('Error saving banner');
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const toggleBannerStatus = async (banner) => {
        if (!hasUpdatePermission) {
            toast.error("You don't have permission to update hero banners");
            return;
        }
        try {
            const token = getCookie('token');
            const updatedData = {
                image: banner.image,
                link: banner.link || '',
                isActive: !banner.isActive,
                order: banner.order || 0
            };
            const response = await heroBannerAPI.updateHeroBanner(banner._id, updatedData, token);
            
            if (response.success) {
                toast.success(`Banner ${!banner.isActive ? 'activated' : 'deactivated'} successfully`);
                fetchBanners();
            } else {
                toast.error(response.message || 'Failed to update banner status');
            }
        } catch (error) {
            console.error('Error updating banner status:', error);
            toast.error('Error updating banner status');
        }
    };

    if (checkingPermission || contextLoading || loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
            </div>
        );
    }

    if (!hasReadPermission || permissionError) {
        return (
            <PermissionDenied
                title="Access Denied"
                message={permissionError || "You don't have permission to access hero banners"}
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
                    <h1 className="text-2xl font-bold text-gray-900">Hero Banner Management</h1>
                    <p className="text-gray-600">Manage your homepage hero banners</p>
                </div>
                {(hasUpdatePermission || hasCreatePermission) && (
                    <button
                        onClick={handleAddNew}
                        className="bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition-colors duration-200 flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add New Banner
                    </button>
                )}
            </div>

            {/* Banners List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                {banners.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-20 h-20 mx-auto mb-6 bg-pink-100 rounded-full flex items-center justify-center">
                            <svg className="w-10 h-10 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">No Hero Banners Yet</h3>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto">
                            Create engaging hero banners to showcase your products and attract customers to your homepage.
                        </p>
                        <div className="space-y-3">
                            <button
                                onClick={handleAddNew}
                                className="bg-pink-500 text-white px-6 py-3 rounded-lg hover:bg-pink-600 transition-colors duration-200 font-medium flex items-center gap-2 mx-auto"
                            >
                                <Plus className="w-5 h-5" />
                                Create First Banner
                            </button>
                            <p className="text-xs text-gray-400">
                                Add multiple banners to create a dynamic slider experience
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preview</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Link</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {banners.map((banner) => (
                                    <tr key={banner._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <img
                                                    src={banner.image}
                                                    alt="Banner preview"
                                                    className="w-20 h-12 object-cover rounded-lg"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">
                                                {banner.link || <span className="text-gray-400 italic">No link</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => toggleBannerStatus(banner)}
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    banner.isActive 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}
                                            >
                                                {banner.isActive ? (
                                                    <>
                                                        <Eye className="w-3 h-3 mr-1" />
                                                        Active
                                                    </>
                                                ) : (
                                                    <>
                                                        <EyeOff className="w-3 h-3 mr-1" />
                                                        Inactive
                                                    </>
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {banner.order}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center space-x-2">
                                                {hasUpdatePermission && (
                                                    <button
                                                        onClick={() => handleEdit(banner)}
                                                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 border border-gray-300 hover:border-blue-300 rounded-full transition-all duration-200 cursor-pointer"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {hasDeletePermission && (
                                                    <button
                                                        onClick={() => handleDeleteClick(banner)}
                                                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 border border-gray-300 hover:border-red-300 rounded-full transition-all duration-200 cursor-pointer"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">
                                {editingBanner ? 'Edit Banner' : 'Add New Banner'}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors duration-200 cursor-pointer"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="space-y-6">
                                <div>
                                    <ImageUpload
                                        onImageUpload={(url) => setFormData(prev => ({ ...prev, image: url }))}
                                        onImageRemove={() => setFormData(prev => ({ ...prev, image: '' }))}
                                        currentImage={formData.image}
                                        label="Banner Image *"
                                    />
                                </div>

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
                                        URL to navigate when banner is clicked. Leave empty if banner should not be clickable.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Order
                                    </label>
                                    <input
                                        type="number"
                                        name="order"
                                        value={formData.order}
                                        onChange={handleInputChange}
                                        min="0"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Lower numbers appear first. Default: 0
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
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-all duration-200 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-medium text-white bg-pink-500 border border-transparent rounded-md hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-all duration-200 cursor-pointer"
                                >
                                    {editingBanner ? 'Update Banner' : 'Create Banner'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={showDeleteModal}
                onClose={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
                title="Delete Hero Banner"
                message="Are you sure you want to delete this hero banner? This action cannot be undone."
                itemName="Hero Banner"
                itemType="banner"
                isLoading={deleting}
                dangerLevel="high"
            />
        </div>
    );
}
