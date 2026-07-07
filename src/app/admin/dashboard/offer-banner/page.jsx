'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, Calendar, Image as ImageIcon, Palette, Link as LinkIcon, Upload, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getCookie } from 'cookies-next';
import { offerBannerAPI, uploadAPI } from '@/services/api';
import DeleteConfirmationModal from '@/components/Common/DeleteConfirmationModal';

export default function OfferBannerPage() {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingBanner, setEditingBanner] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [bannerToDelete, setBannerToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        image: '',
        type: 'offer', // 'offer' or 'promo'
        buttonText: '',
        buttonLink: '',
        discountPercentage: '',
        discountText: '',
        isActive: false
    });

    useEffect(() => {
        fetchBanners();
    }, []);

    const fetchBanners = async () => {
        try {
            setLoading(true);
            const token = getCookie('token');
            const response = await offerBannerAPI.getAllOfferBanners({}, token);
            if (response.success) {
                setBanners(response.data);
            }
        } catch (error) {
            console.error('Error fetching banners:', error);
            toast.error('Failed to fetch banners');
        } finally {
            setLoading(false);
        }
    };

    const handleAddNew = () => {
        setEditingBanner(null);
        setFormData({
            title: '',
            subtitle: '',
            image: '',
            type: 'offer',
            buttonText: '',
            buttonLink: '',
            discountPercentage: '',
            discountText: '',
            isActive: false
        });
        setSelectedFile(null);
        setImagePreview(null);
        setShowModal(true);
    };

    const handleEdit = (banner) => {
        setEditingBanner(banner);
        
        setFormData({
            title: banner.title || '',
            subtitle: banner.subtitle || '',
            image: banner.image || '',
            type: banner.type || 'offer',
            buttonText: banner.buttonText || '',
            buttonLink: banner.buttonLink || '',
            discountPercentage: banner.discountPercentage || '',
            discountText: banner.discountText || '',
            isActive: banner.isActive || false
        });
        
        // Set image preview if banner has an image
        if (banner.image) {
            setImagePreview(banner.image);
        } else {
            setImagePreview(null);
        }
        setSelectedFile(null);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Check if image is required but not uploaded
        if (!formData.image) {
            toast.error('Please upload an image for the banner');
            return;
        }
        
        try {
            const token = getCookie('token');
            
            // Clean data - include all fields that have values
            let submitData = {
                title: formData.title,
                subtitle: formData.subtitle,
                image: formData.image,
                type: formData.type,
                isActive: formData.isActive
            };

            // Add optional fields only if they have values
            if (formData.buttonText.trim()) {
                submitData.buttonText = formData.buttonText;
            }
            if (formData.buttonLink.trim()) {
                submitData.buttonLink = formData.buttonLink;
            }
            if (formData.discountPercentage) {
                submitData.discountPercentage = parseInt(formData.discountPercentage);
            }
            if (formData.discountText.trim()) {
                submitData.discountText = formData.discountText;
            }


            if (editingBanner) {
                const response = await offerBannerAPI.updateOfferBanner(editingBanner._id, submitData, token);
                if (response.success) {
                    toast.success('Banner updated successfully');
                    fetchBanners();
                } else {
                    console.error('Update failed:', response);
                    toast.error('Failed to update banner');
                }
            } else {
                const response = await offerBannerAPI.createOfferBanner(submitData, token);
                if (response.success) {
                    toast.success('Banner created successfully');
                    fetchBanners();
                } else {
                    console.error('Create failed:', response);
                    toast.error('Failed to create banner');
                }
            }
            setShowModal(false);
        } catch (error) {
            console.error('Error saving banner:', error);
            toast.error('Failed to save banner');
        }
    };

    const handleDelete = (banner) => {
        setBannerToDelete(banner);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        try {
            setDeleting(true);
            const token = getCookie('token');
            const response = await offerBannerAPI.deleteOfferBanner(bannerToDelete._id, token);
            if (response.success) {
                toast.success('Banner deleted successfully');
                fetchBanners();
            }
        } catch (error) {
            console.error('Error deleting banner:', error);
            toast.error('Failed to delete banner');
        } finally {
            setDeleting(false);
            setShowDeleteModal(false);
            setBannerToDelete(null);
        }
    };

    const toggleBannerStatus = async (banner) => {
        try {
            const token = getCookie('token');
            const response = await offerBannerAPI.toggleBannerStatus(banner._id, token);
            if (response.success) {
                toast.success(`Banner ${banner.isActive ? 'deactivated' : 'activated'} successfully`);
                fetchBanners();
            }
        } catch (error) {
            console.error('Error toggling banner status:', error);
            toast.error('Failed to toggle banner status');
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        // If banner type changes, reset related fields
        if (name === 'type') {
            setFormData(prev => ({
                ...prev,
                [name]: value,
                // Reset fields based on new type
                ...(value === 'offer' ? {
                    discountPercentage: '',
                    discountText: '',
                    buttonText: prev.buttonText || '',
                    buttonLink: prev.buttonLink || ''
                } : {
                    buttonText: '',
                    buttonLink: '',
                    discountPercentage: prev.discountPercentage || '',
                    discountText: prev.discountText || ''
                })
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast.error('Please select an image file');
                return;
            }
            
            // Validate file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('File size must be less than 5MB');
                return;
            }
            
            setSelectedFile(file);
            
            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleImageUpload = async () => {
        if (!selectedFile) {
            toast.error('Please select an image file');
            return;
        }

        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('image', selectedFile);

            const response = await uploadAPI.uploadSingle(formData);
            
            if (response.success) {
                setFormData(prev => ({
                    ...prev,
                    image: response.data.url
                }));
                toast.success('Image uploaded successfully');
            } else {
                toast.error('Failed to upload image');
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            toast.error('Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    const removeSelectedFile = () => {
        setSelectedFile(null);
        setImagePreview(null);
        setFormData(prev => ({
            ...prev,
            image: ''
        }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Offer Banners</h1>
                <button
                    onClick={handleAddNew}
                    className="bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition-colors flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Add New Banner
                </button>
            </div>

            {banners.length === 0 ? (
                <div className="text-center py-12">
                    <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No banners found</h3>
                    <p className="text-gray-500 mb-6">Create your first offer banner to get started</p>
                    <button
                        onClick={handleAddNew}
                        className="bg-pink-500 text-white px-6 py-3 rounded-lg hover:bg-pink-600 transition-colors"
                    >
                        Create Banner
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {banners.map((banner) => (
                        <div key={banner._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <div className="relative">
                                <img
                                    src={banner.image}
                                    alt={banner.title}
                                    className="w-full h-48 object-cover"
                                />
                                <div className="absolute top-2 right-2 flex gap-2">
                                    <div className={`px-2 py-1 rounded text-xs font-semibold ${
                                        banner.type === 'promo' 
                                            ? 'bg-purple-100 text-purple-800' 
                                            : 'bg-blue-100 text-blue-800'
                                    }`}>
                                        {banner.type === 'promo' ? 'Promo Code' : 'Offer Text'}
                                    </div>
                                    <button
                                        onClick={() => toggleBannerStatus(banner)}
                                        className={`p-2 rounded-full transition-colors ${
                                            banner.isActive 
                                                ? 'bg-green-500 text-white' 
                                                : 'bg-gray-500 text-white'
                                        }`}
                                        title={banner.isActive ? 'Active' : 'Inactive'}
                                    >
                                        {banner.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                    </button>
                                </div>
                                {banner.discountPercentage && (
                                    <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-sm font-semibold">
                                        {banner.discountPercentage}% OFF
                                    </div>
                                )}
                            </div>
                            
                            <div className="p-4">
                                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{banner.title}</h3>
                                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{banner.subtitle}</p>
                                
                                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        {new Date(banner.createdAt).toLocaleDateString()}
                                    </span>
                                    <span className={`px-2 py-1 rounded text-xs ${
                                        banner.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                        {banner.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(banner)}
                                        className="flex-1 bg-blue-500 text-white py-2 px-3 rounded text-sm hover:bg-blue-600 transition-colors flex items-center justify-center gap-1"
                                    >
                                        <Edit className="w-4 h-4" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(banner)}
                                        className="flex-1 bg-red-500 text-white py-2 px-3 rounded text-sm hover:bg-red-600 transition-colors flex items-center justify-center gap-1"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">
                                {editingBanner ? 'Edit Banner' : 'Add New Banner'}
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Basic Information */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                                        <ImageIcon className="w-5 h-5" />
                                        Basic Information
                                    </h3>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Banner Type <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="type"
                                            value={formData.type}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                                        >
                                            <option value="offer">Offer Text (with button)</option>
                                            <option value="promo">Promo Code (no button)</option>
                                        </select>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Title <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                                            placeholder={formData.type === 'offer' ? "e.g., 50% Discount" : "e.g., Special Offer"}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Subtitle <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="subtitle"
                                            value={formData.subtitle}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                                            placeholder="e.g., Only for the first order"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Banner Image <span className="text-red-500">*</span>
                                        </label>
                                        
                                        {/* Image Preview */}
                                        {imagePreview && (
                                            <div className="mb-4">
                                                <div className="relative inline-block">
                                                    <img
                                                        src={imagePreview}
                                                        alt="Banner preview"
                                                        className="w-full max-w-xs h-32 object-cover rounded-lg border border-gray-300"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={removeSelectedFile}
                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* File Upload */}
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleFileSelect}
                                                    className="hidden"
                                                    id="image-upload"
                                                />
                                                <label
                                                    htmlFor="image-upload"
                                                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                                >
                                                    <Upload className="w-4 h-4" />
                                                    Choose Image
                                                </label>
                                                
                                                {selectedFile && (
                                                    <button
                                                        type="button"
                                                        onClick={handleImageUpload}
                                                        disabled={uploading}
                                                        className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                    >
                                                        {uploading ? (
                                                            <>
                                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                                Uploading...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Upload className="w-4 h-4" />
                                                                Upload
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                            
                                            {selectedFile && (
                                                <p className="text-sm text-gray-600">
                                                    Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                                                </p>
                                            )}
                                            
                                            {formData.image && !selectedFile && (
                                                <p className="text-sm text-green-600">
                                                    ✓ Image uploaded successfully
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Button & Discount */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                                        <LinkIcon className="w-5 h-5" />
                                        {formData.type === 'offer' ? 'Button Settings' : 'Promo Code Settings'}
                                    </h3>

                                    {formData.type === 'offer' ? (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Button Text <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    name="buttonText"
                                                    value={formData.buttonText}
                                                    onChange={handleInputChange}
                                                    required
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                                                    placeholder="e.g., Shop Now"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Button Link <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    name="buttonLink"
                                                    value={formData.buttonLink}
                                                    onChange={handleInputChange}
                                                    required
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                                                    placeholder="e.g., /shop or https://example.com"
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Discount %
                                                </label>
                                                <input
                                                    type="number"
                                                    name="discountPercentage"
                                                    value={formData.discountPercentage}
                                                    onChange={handleInputChange}
                                                    min="0"
                                                    max="100"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                                                    placeholder="50"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Promo Code <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    name="discountText"
                                                    value={formData.discountText}
                                                    onChange={handleInputChange}
                                                    required
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                                                    placeholder="PINKFAST50"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center">
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                name="isActive"
                                                checked={formData.isActive}
                                                onChange={handleInputChange}
                                                className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">Active Banner</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
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
                onClose={() => setShowDeleteModal(false)}
                onConfirm={confirmDelete}
                title="Delete Banner"
                message="Are you sure you want to delete this banner? This action cannot be undone."
                itemName={bannerToDelete?.title}
                itemType="banner"
                isLoading={deleting}
            />
        </div>
    );
}
