'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, ArrowUp, ArrowDown, X, Search, Check, Upload, Link } from 'lucide-react';
import { productAPI, heroProductAPI } from '@/services/api';
import DeleteConfirmationModal from '@/components/Common/DeleteConfirmationModal';
import ImageUpload from '@/components/Common/ImageUpload';
import { toast } from 'react-hot-toast';
import { getCookie } from 'cookies-next';

export default function HeroProductsManagement() {
    const [heroProducts, setHeroProducts] = useState([]);
    const [allProducts, setAllProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searching, setSearching] = useState(false);
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [errors, setErrors] = useState({});
    const [imageUploadMode, setImageUploadMode] = useState('upload'); // 'url' or 'upload'

    // Form data
    const [formData, setFormData] = useState({
        productId: '',
        customImage: '',
        size: 'large', // large, small
        badge: {
            text: '',
            color: 'bg-pink-500'
        },
        order: 0
    });

    // Badge color options
    const badgeColors = [
        { value: 'bg-pink-500', label: 'Pink' },
        { value: 'bg-red-500', label: 'Red' },
        { value: 'bg-blue-500', label: 'Blue' },
        { value: 'bg-green-500', label: 'Green' },
        { value: 'bg-yellow-500', label: 'Yellow' },
        { value: 'bg-purple-500', label: 'Purple' },
        { value: 'bg-orange-500', label: 'Orange' },
        { value: 'bg-indigo-500', label: 'Indigo' }
    ];

    // Size options
    const sizeOptions = [
        { value: 'large', label: 'Large (Top)' },
        { value: 'small', label: 'Small (Bottom)' }
    ];

    useEffect(() => {
        fetchHeroProducts();
        // Don't load products initially, only when user searches
    }, []);

    const fetchHeroProducts = async () => {
        try {
            setLoading(true);
            const token = getCookie('token');
            const response = await heroProductAPI.getAllHeroProducts(token);
            
            if (response.success) {
                setHeroProducts(response.data || []);
            } else {
                toast.error(response.message || 'Failed to fetch hero products');n
            }
        } catch (error) {
            console.error('Error fetching hero products:', error);
            toast.error('Error fetching hero products');
        } finally {
            setLoading(false);
        }
    };

    const fetchAllProducts = async (searchQuery = '') => {
        try {
            setSearching(true);
            const filters = { 
                limit: 20
            };
            const response = await productAPI.searchProducts(searchQuery, filters);
            
            if (response.success) {
                // API returns data as array directly, not in products property
                setAllProducts(response.data || []);
            } else {
                toast.error(response.message || 'Failed to fetch products');
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            toast.error('Error fetching products');
        } finally {
            setSearching(false);
        }
    };

    const handleAddNew = () => {
        // Check if maximum products reached
        if (heroProducts.length >= 3) {
            toast.error('Maximum 3 hero products allowed (1 large + 2 small)');
            return;
        }
        
        // Smart size selection - choose available size
        const existingLarge = heroProducts.filter(p => p.size === 'large').length;
        const existingSmall = heroProducts.filter(p => p.size === 'small').length;
        
        let defaultSize = 'small'; // Default to small
        if (existingLarge === 0) {
            defaultSize = 'large'; // If no large, default to large
        } else if (existingSmall < 2) {
            defaultSize = 'small'; // If large exists but small < 2, default to small
        }
        
        setEditingProduct(null);
        setFormData({
            productId: '',
            customImage: '',
            size: defaultSize,
            badge: {
                text: '',
                color: 'bg-pink-500'
            },
            order: heroProducts.length
        });
        setSearchTerm('');
        setSelectedProduct(null);
        setAllProducts([]);
        setErrors({});
        setShowModal(true);
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        
        // Set selected product for display
        const selectedProductData = product.productId;
        setSelectedProduct(selectedProductData);
        
        setFormData({
            productId: product.productId || '',
            customImage: product.customImage || '',
            size: product.size || 'large',
            badge: product.badge || { text: '', color: 'bg-pink-500' },
            order: product.order || 0
        });
        
        // Set search term to show product name
        setSearchTerm(selectedProductData?.title || selectedProductData?.name || '');
        setAllProducts([]);
        setErrors({});
        setShowModal(true);
    };

    const handleDeleteClick = (product) => {
        setProductToDelete(product);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!productToDelete) return;

        try {
            setDeleting(true);
            const token = getCookie('token');
            const response = await heroProductAPI.deleteHeroProduct(productToDelete._id, token);
            
            if (response.success) {
                toast.success('Product removed from hero section');
                fetchHeroProducts();
            } else {
                toast.error(response.message || 'Failed to remove product');
            }
        } catch (error) {
            console.error('Error removing product:', error);
            toast.error('Error removing product');
        } finally {
            setDeleting(false);
            setShowDeleteModal(false);
            setProductToDelete(null);
        }
    };

    const handleDeleteCancel = () => {
        setShowDeleteModal(false);
        setProductToDelete(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate form
        if (!validateForm()) {
            return;
        }
        
        // Check if adding new product and maximum reached
        if (!editingProduct && heroProducts.length >= 3) {
            toast.error('Maximum 3 hero products allowed (1 large + 2 small)');
            return;
        }
        
        // Check size-specific limits
        const existingLarge = heroProducts.filter(p => p.size === 'large' && p._id !== editingProduct?._id);
        const existingSmall = heroProducts.filter(p => p.size === 'small' && p._id !== editingProduct?._id);
        
        if (formData.size === 'large' && existingLarge.length >= 1) {
            toast.error('Only 1 large product allowed');
            return;
        }
        
        if (formData.size === 'small' && existingSmall.length >= 2) {
            toast.error('Only 2 small products allowed');
            return;
        }
        
        try {
            const token = getCookie('token');
            const productData = {
                productId: formData.productId,
                customImage: formData.customImage || null,
                size: formData.size,
                badge: formData.badge,
                order: formData.order,
                isActive: true
            };

            let response;
            if (editingProduct) {
                response = await heroProductAPI.updateHeroProduct(editingProduct._id, productData, token);
            } else {
                response = await heroProductAPI.createHeroProduct(productData, token);
            }

            if (response.success) {
                toast.success(editingProduct ? 'Hero product updated successfully' : 'Hero product added successfully');
                setShowModal(false);
                setShowProductDropdown(false);
                fetchHeroProducts();
            } else {
                toast.error(response.message || 'Failed to save hero product');
            }
        } catch (error) {
            console.error('Error saving hero product:', error);
            toast.error('Error saving hero product');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('badge.')) {
            const badgeField = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                badge: {
                    ...prev.badge,
                    [badgeField]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
        
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.size || formData.size.trim() === '') {
            newErrors.size = 'Size is required';
        }
        
        if (!selectedProduct) {
            newErrors.product = 'Please select a product';
        }
        
        if (!formData.badge.text || formData.badge.text.trim() === '') {
            newErrors.badgeText = 'Badge text is required';
        }
        
        if (!formData.badge.color || formData.badge.color.trim() === '') {
            newErrors.badgeColor = 'Badge color is required';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const isFormValid = () => {
        return selectedProduct && 
               formData.size && 
               formData.size.trim() !== '' && 
               formData.badge.text && 
               formData.badge.text.trim() !== '' && 
               formData.badge.color && 
               formData.badge.color.trim() !== '';
    };

    // Handle search with debouncing
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchTerm.trim()) {
                fetchAllProducts(searchTerm);
            } else {
                setAllProducts([]);
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    const filteredProducts = allProducts;

    const getProductById = (productId) => {
        return allProducts.find(p => p._id === productId);
    };

    const getProductImage = (heroProduct) => {
        if (heroProduct.customImage) {
            return heroProduct.customImage;
        }
        if (heroProduct.productId?.images?.[0]) {
            return heroProduct.productId.images[0];
        }
        return "/images/placeholder.png";
    };

    const handleProductSelect = (product) => {
        setSelectedProduct(product);
        setFormData(prev => ({
            ...prev,
            productId: product._id
        }));
        setSearchTerm(product.title);
        setShowProductDropdown(false);
    };

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        setSelectedProduct(null);
        setFormData(prev => ({
            ...prev,
            productId: ''
        }));
        if (value.trim()) {
            setShowProductDropdown(true);
        } else {
            setShowProductDropdown(false);
        }
    };

    const handleImageUpload = (imageUrl) => {
        setFormData(prev => ({
            ...prev,
            customImage: imageUrl
        }));
    };

    const handleImageRemove = () => {
        setFormData(prev => ({
            ...prev,
            customImage: ''
        }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Hero Products Management</h1>
                    <p className="text-gray-600">Manage products displayed in hero section</p>
                </div>
                <button
                    onClick={handleAddNew}
                    disabled={heroProducts.length >= 3}
                    className={`px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 ${
                        heroProducts.length >= 3 
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                            : 'bg-pink-500 text-white hover:bg-pink-600'
                    }`}
                >
                    <Plus className="w-4 h-4" />
                    {heroProducts.length >= 3 ? 'Max Products (3)' : 'Add Product'}
                </button>
            </div>

            {/* Products List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                {heroProducts.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-20 h-20 mx-auto mb-6 bg-pink-100 rounded-full flex items-center justify-center">
                            <svg className="w-10 h-10 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">No Hero Products Yet</h3>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto">
                            Start building your hero section by adding featured products. These will be displayed prominently on your homepage.
                        </p>
                        <div className="space-y-3">
                            <button
                                onClick={handleAddNew}
                                className="bg-pink-500 text-white px-6 py-3 rounded-lg hover:bg-pink-600 transition-colors duration-200 font-medium flex items-center gap-2 mx-auto"
                            >
                                <Plus className="w-5 h-5" />
                                Add First Product
                            </button>
                            <p className="text-xs text-gray-400">
                                You can add up to 3 products: 1 large (top) and 2 small (bottom)
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preview</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Badge</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {heroProducts.map((heroProduct) => {
                                    // Check if productId is populated or just an ID
                                    const product = typeof heroProduct.productId === 'object' && heroProduct.productId !== null 
                                        ? heroProduct.productId 
                                        : null;
                                    const productId = typeof heroProduct.productId === 'string' 
                                        ? heroProduct.productId 
                                        : heroProduct.productId?._id;
                                    
                                    return (
                                        <tr key={heroProduct._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className={`w-16 h-10 rounded-lg ${heroProduct.size === 'large' ? 'bg-gray-200' : 'bg-gray-100'} flex items-center justify-center`}>
                                                        <span className="text-xs font-medium text-gray-700">
                                                            {heroProduct.size === 'large' ? 'Large' : 'Small'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {product?.title || product?.name || 'Product not found'}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {product?.category?.name || 'No category'}
                                                </div>
                                                {!product && (
                                                    <div className="text-xs text-red-500">
                                                        ID: {productId}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    heroProduct.size === 'large' 
                                                        ? 'bg-blue-100 text-blue-800' 
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {heroProduct.size === 'large' ? 'Large' : 'Small'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {heroProduct.badge?.text && (
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${heroProduct.badge.color}`}>
                                                        {heroProduct.badge.text}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {heroProduct.order}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => handleEdit(heroProduct)}
                                                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 border border-gray-300 hover:border-blue-300 rounded-full transition-all duration-200 cursor-pointer"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(heroProduct)}
                                                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 border border-gray-300 hover:border-red-300 rounded-full transition-all duration-200 cursor-pointer"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
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
                                {editingProduct ? 'Edit Hero Product' : 'Add Hero Product'}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setShowProductDropdown(false);
                                }}
                                className="text-gray-400 hover:text-gray-600 transition-colors duration-200 cursor-pointer"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Search & Select Product *
                                    </label>
                                    <div className="relative">
                                        {searching ? (
                                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-500"></div>
                                            </div>
                                        ) : (
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        )}
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={handleSearchChange}
                                            onFocus={() => setShowProductDropdown(true)}
                                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                                            placeholder="Type product name to search..."
                                            required
                                        />
                                        
                                        {/* Product Dropdown */}
                                        {showProductDropdown && allProducts.length > 0 && (
                                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                                {allProducts.map((product) => (
                                                    <div
                                                        key={product._id}
                                                        onClick={() => handleProductSelect(product)}
                                                        className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                                    >
                                                        <div className="flex-shrink-0 w-12 h-12 mr-3">
                                                            <img
                                                                src={product.featuredImage || "/images/placeholder.png"}
                                                                alt={product.title}
                                                                className="w-full h-full object-cover rounded-md"
                                                            />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                                {product.title}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {product.category?.name} • ৳{product.priceRange?.min || 'N/A'}
                                                            </p>
                                                            <p className="text-xs text-gray-400 truncate">
                                                                {product.shortDescription}
                                                            </p>
                                                        </div>
                                                        {selectedProduct?._id === product._id && (
                                                            <Check className="w-4 h-4 text-pink-500" />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {searchTerm && !selectedProduct && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            {allProducts.length} product(s) found - Click to select
                                        </p>
                                    )}
                                    {selectedProduct && (
                                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                                            <p className="text-xs text-green-700">
                                                ✓ Selected: {selectedProduct.title} - ৳{selectedProduct.priceRange?.min || 'N/A'}
                                            </p>
                                        </div>
                                    )}
                                </div>


                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Custom Image (Optional)
                                    </label>
                                    
                                    {/* Upload Mode Toggle */}
                                    <div className="flex space-x-2 mb-3">
                                        <button
                                            type="button"
                                            onClick={() => setImageUploadMode('url')}
                                            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                                imageUploadMode === 'url'
                                                    ? 'bg-pink-100 text-pink-700 border border-pink-300'
                                                    : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                                            }`}
                                        >
                                            <Link className="w-4 h-4 mr-2" />
                                            Manual URL
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setImageUploadMode('upload')}
                                            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                                imageUploadMode === 'upload'
                                                    ? 'bg-pink-100 text-pink-700 border border-pink-300'
                                                    : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                                            }`}
                                        >
                                            <Upload className="w-4 h-4 mr-2" />
                                            File Upload
                                        </button>
                                    </div>

                                    {/* URL Input Mode */}
                                    {imageUploadMode === 'url' && (
                                        <div>
                                            <input
                                                type="url"
                                                name="customImage"
                                                value={formData.customImage}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                                                placeholder="https://example.com/custom-image.jpg"
                                            />
                                        </div>
                                    )}

                                    {/* File Upload Mode */}
                                    {imageUploadMode === 'upload' && (
                                        <div>
                                            <ImageUpload
                                                onImageUpload={handleImageUpload}
                                                onImageRemove={handleImageRemove}
                                                currentImage={formData.customImage}
                                                label="Upload Custom Image"
                                                maxSize={5}
                                                className="w-full"
                                            />
                                        </div>
                                    )}

                                    <p className="text-xs text-gray-500 mt-1">
                                        Leave empty to use product's default image. <span className="text-pink-600 font-medium">Recommended: 16:9 aspect ratio (e.g., 1920x1080px)</span>
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Size <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="size"
                                        value={formData.size}
                                        onChange={handleInputChange}
                                        required
                                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 ${
                                            errors.size ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    >
                                        {sizeOptions.map((option) => {
                                            const existingCount = heroProducts.filter(p => p.size === option.value && p._id !== editingProduct?._id).length;
                                            const isDisabled = (option.value === 'large' && existingCount >= 1) || (option.value === 'small' && existingCount >= 2);
                                            
                                            return (
                                                <option 
                                                    key={option.value} 
                                                    value={option.value}
                                                    disabled={isDisabled}
                                                >
                                                    {option.label} {isDisabled ? `(Max reached: ${existingCount})` : `(${existingCount}/1)`}
                                                </option>
                                            );
                                        })}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Large: 1 max, Small: 2 max
                                    </p>
                                    {errors.size && (
                                        <p className="text-xs text-red-500 mt-1">
                                            {errors.size}
                                        </p>
                                    )}
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
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Badge Text <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="badge.text"
                                        value={formData.badge.text}
                                        onChange={handleInputChange}
                                        required
                                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 ${
                                            errors.badgeText ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        placeholder="e.g., Hot Product, 30% OFF"
                                    />
                                    {errors.badgeText && (
                                        <p className="text-xs text-red-500 mt-1">
                                            {errors.badgeText}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Badge Color <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="badge.color"
                                        value={formData.badge.color}
                                        onChange={handleInputChange}
                                        required
                                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 ${
                                            errors.badgeColor ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    >
                                        {badgeColors.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.badgeColor && (
                                        <p className="text-xs text-red-500 mt-1">
                                            {errors.badgeColor}
                                        </p>
                                    )}
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
                                    disabled={!isFormValid()}
                                    className={`px-4 py-2 text-sm font-medium border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-all duration-200 ${
                                        isFormValid() 
                                            ? 'text-white bg-pink-500 hover:bg-pink-600 cursor-pointer' 
                                            : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                                    }`}
                                >
                                    {editingProduct ? 'Update Product' : 'Add Product'}
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
                title="Remove Hero Product"
                message="Are you sure you want to remove this product from the hero section?"
                itemName={productToDelete?.productId?.title || productToDelete?.productId?.name}
                itemType="product"
                isLoading={deleting}
                dangerLevel="medium"
            />
        </div>
    );
}
