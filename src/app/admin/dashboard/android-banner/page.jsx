'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, Calendar, Image as ImageIcon, Link as LinkIcon, Upload, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getCookie } from 'cookies-next';
import { androidBannerAPI, uploadAPI } from '@/services/api';
import DeleteConfirmationModal from '@/components/Common/DeleteConfirmationModal';

export default function AndroidBannerPage() {
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

    // Pagination state
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        limit: 10
    });

    const [formData, setFormData] = useState({
        image: '',
        link: '',
        isActive: true
    });

    useEffect(() => {
        fetchBanners();
    }, [pagination.currentPage]);

    const fetchBanners = async () => {
        try {
            setLoading(true);
            const token = getCookie('token');
            const response = await androidBannerAPI.getAllAndroidBanners({
                page: pagination.currentPage,
                limit: pagination.limit
            }, token);

            if (response.success) {
                setBanners(response.data.banners);
                setPagination(prev => ({
                    ...prev,
                    ...response.data.pagination
                }));
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
            image: '',
            link: '',
            isActive: true
        });
        setSelectedFile(null);
        setImagePreview(null);
        setShowModal(true);
    };

    const handleEdit = (banner) => {
        setEditingBanner(banner);
        setFormData({
            image: banner.image || '',
            link: banner.link || '',
            isActive: banner.isActive !== undefined ? banner.isActive : true
        });

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

        if (!formData.image) {
            toast.error('Please upload an image for the banner');
            return;
        }

        try {
            const token = getCookie('token');
            const submitData = { ...formData };

            if (editingBanner) {
                const response = await androidBannerAPI.updateAndroidBanner(editingBanner._id, submitData, token);
                if (response.success) {
                    toast.success('Banner updated successfully');
                    fetchBanners();
                } else {
                    toast.error('Failed to update banner');
                }
            } else {
                const response = await androidBannerAPI.createAndroidBanner(submitData, token);
                if (response.success) {
                    toast.success('Banner created successfully');
                    fetchBanners();
                } else {
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
            const response = await androidBannerAPI.deleteAndroidBanner(bannerToDelete._id, token);
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
            const response = await androidBannerAPI.toggleBannerStatus(banner._id, token);
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
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                toast.error('Please select an image file');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                toast.error('File size must be less than 5MB');
                return;
            }
            setSelectedFile(file);
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

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setPagination(prev => ({ ...prev, currentPage: newPage }));
        }
    };

    if (loading && pagination.currentPage === 1) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Android Banners</h1>
                    <p className="text-sm text-gray-500">Manage banners displayed in the Android app</p>
                </div>
                <button
                    onClick={handleAddNew}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Add New Banner
                </button>
            </div>

            {banners.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
                    <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No android banners found</h3>
                    <p className="text-gray-500 mb-6">Create your first banner to get started</p>
                    <button
                        onClick={handleAddNew}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Create Banner
                    </button>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {banners.map((banner) => (
                            <div key={banner._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                                <div className="relative h-48">
                                    <img
                                        src={banner.image}
                                        alt="Android Banner"
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute top-2 right-2 flex gap-2">
                                        <button
                                            onClick={() => toggleBannerStatus(banner)}
                                            className={`p-2 rounded-full transition-colors ${banner.isActive
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-gray-500 text-white'
                                                }`}
                                            title={banner.isActive ? 'Active' : 'Inactive'}
                                        >
                                            {banner.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="p-4 flex-1 flex flex-col justify-between">
                                    <div>
                                        {banner.link && (
                                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-3 break-all">
                                                <LinkIcon className="w-4 h-4 flex-shrink-0" />
                                                <span className="truncate">{banner.link}</span>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4" />
                                                {new Date(banner.createdAt).toLocaleDateString()}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${banner.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {banner.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(banner)}
                                            className="flex-1 bg-blue-50 text-blue-600 py-2 px-3 rounded text-sm hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
                                        >
                                            <Edit className="w-4 h-4" />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(banner)}
                                            className="flex-1 bg-red-50 text-red-600 py-2 px-3 rounded text-sm hover:bg-red-100 transition-colors flex items-center justify-center gap-1"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between bg-white px-4 py-3 border border-gray-200 rounded-lg">
                            <div className="flex-1 flex justify-between sm:hidden">
                                <button
                                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                                    disabled={pagination.currentPage === 1}
                                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                                    disabled={pagination.currentPage === pagination.totalPages}
                                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm text-gray-700">
                                        Showing <span className="font-medium">{(pagination.currentPage - 1) * pagination.limit + 1}</span> to <span className="font-medium">{Math.min(pagination.currentPage * pagination.limit, pagination.totalItems)}</span> of{' '}
                                        <span className="font-medium">{pagination.totalItems}</span> results
                                    </p>
                                </div>
                                <div>
                                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                        <button
                                            onClick={() => handlePageChange(pagination.currentPage - 1)}
                                            disabled={pagination.currentPage === 1}
                                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                        >
                                            <span className="sr-only">Previous</span>
                                            <ChevronLeft className="h-5 w-5" />
                                        </button>
                                        {[...Array(pagination.totalPages)].map((_, i) => (
                                            <button
                                                key={i + 1}
                                                onClick={() => handlePageChange(i + 1)}
                                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${pagination.currentPage === i + 1
                                                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {i + 1}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => handlePageChange(pagination.currentPage + 1)}
                                            disabled={pagination.currentPage === pagination.totalPages}
                                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                        >
                                            <span className="sr-only">Next</span>
                                            <ChevronRight className="h-5 w-5" />
                                        </button>
                                    </nav>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl max-w-lg w-full overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingBanner ? 'Edit Android Banner' : 'Create Android Banner'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Banner Image <span className="text-red-500">*</span>
                                    </label>

                                    {/* Image Preview */}
                                    {imagePreview && (
                                        <div className="mb-4 relative group">
                                            <img
                                                src={imagePreview}
                                                alt="Banner preview"
                                                className="w-full h-40 object-cover rounded-lg border border-gray-200"
                                            />
                                            <button
                                                type="button"
                                                onClick={removeSelectedFile}
                                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}

                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center gap-3">
                                            <label className="flex-1 cursor-pointer">
                                                <div className="flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all">
                                                    <Upload className="w-5 h-5 text-gray-400" />
                                                    <span className="text-sm font-medium text-gray-600">
                                                        {selectedFile ? selectedFile.name : 'Choose Banner Image'}
                                                    </span>
                                                </div>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleFileSelect}
                                                    className="hidden"
                                                />
                                            </label>

                                            {selectedFile && (
                                                <button
                                                    type="button"
                                                    onClick={handleImageUpload}
                                                    disabled={uploading}
                                                    className="bg-blue-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-2"
                                                >
                                                    {uploading ? (
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                    ) : (
                                                        <Upload className="w-4 h-4" />
                                                    )}
                                                    Upload
                                                </button>
                                            )}
                                        </div>
                                        {formData.image && !selectedFile && (
                                            <p className="text-xs text-green-600 font-medium">✓ Image is ready</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Banner Link (Optional)
                                    </label>
                                    <div className="relative">
                                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            name="link"
                                            value={formData.link}
                                            onChange={handleInputChange}
                                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                            placeholder="e.g., /category/electronics or https://..."
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center pt-2">
                                    <input
                                        type="checkbox"
                                        id="isActiveCheckbox"
                                        name="isActive"
                                        checked={formData.isActive}
                                        onChange={handleInputChange}
                                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition-all cursor-pointer"
                                    />
                                    <label htmlFor="isActiveCheckbox" className="ml-2 text-sm font-medium text-gray-700 cursor-pointer">
                                        Active this banner immediately
                                    </label>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className="flex-1 px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-md transition-all"
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
                title="Delete Android Banner"
                message="Are you sure you want to delete this banner? This will remove it from the Android app."
                itemType="banner"
                isLoading={deleting}
            />
        </div>
    );
}
