'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Search, Package, X } from 'lucide-react';
import ImageUpload from '@/components/Common/ImageUpload';
import toast from 'react-hot-toast';
import { adsAPI, productAPI } from '@/services/api';
import { useAppContext } from '@/context/AppContext';
import { getCookie } from 'cookies-next';
import PermissionDenied from '@/components/Common/PermissionDenied';

export default function CreateAdPage() {
  const router = useRouter();
  const { hasPermission, contextLoading } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: '',
    product: '',
    expireDate: '',
    position: 'homepage-banner',
    priority: 1,
    isActive: true
  });
  const [checkingPermission, setCheckingPermission] = useState(true);
  const [hasCreatePermission, setHasCreatePermission] = useState(false);
  const [permissionError, setPermissionError] = useState(null);
  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState([]);
  const [searchingProducts, setSearchingProducts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  useEffect(() => {
    if (contextLoading) return;
    const canCreate = hasPermission('ads', 'create');
    setHasCreatePermission(canCreate);
    setCheckingPermission(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextLoading]);

  // Search products
  useEffect(() => {
    const searchProducts = async () => {
      if (!productSearch.trim()) {
        setProductResults([]);
        return;
      }

      try {
        setSearchingProducts(true);
        const response = await productAPI.searchProducts(productSearch.trim(), { limit: 10 });
        if (response.success) {
          setProductResults(response.data.products || response.data || []);
        }
      } catch (error) {
        console.error('Error searching products:', error);
      } finally {
        setSearchingProducts(false);
      }
    };

    const timeoutId = setTimeout(() => {
      searchProducts();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [productSearch]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setFormData(prev => ({ ...prev, product: product._id }));
    setProductSearch(product.title);
    setShowProductDropdown(false);
  };

  const handleRemoveProduct = () => {
    setSelectedProduct(null);
    setFormData(prev => ({ ...prev, product: '' }));
    setProductSearch('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title.trim()) {
      toast.error('Please enter ad title');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Please enter ad description');
      return;
    }
    if (!formData.image) {
      toast.error('Please upload ad image');
      return;
    }
    if (!formData.product) {
      toast.error('Please select a product');
      return;
    }
    if (!formData.expireDate) {
      toast.error('Please select expire date');
      return;
    }
    if (new Date(formData.expireDate) <= new Date()) {
      toast.error('Expire date must be in the future');
      return;
    }

    setLoading(true);

    try {
      const token = getCookie('token');
      const response = await adsAPI.createAd(formData, token);

      if (response.success) {
        toast.success('Ad created successfully!');
        router.push('/admin/dashboard/own-ads');
      } else {
        if (response.status === 403) {
          setPermissionError(response.message || "You don't have permission to create ads");
        } else {
          toast.error('Failed to create ad: ' + response.message);
        }
      }
    } catch (error) {
      console.error('Error creating ad:', error);
      if (error?.status === 403) {
        setPermissionError(error?.data?.message || "You don't have permission to create ads");
      } else {
        toast.error('Error creating ad');
      }
    } finally {
      setLoading(false);
    }
  };

  if (checkingPermission || contextLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!hasCreatePermission || permissionError) {
    return (
      <PermissionDenied
        title="Access Denied"
        message={permissionError || "You don't have permission to create ads"}
        action="Contact your administrator for access"
        showBackButton={true}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <Link
              href="/admin/dashboard/own-ads"
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-gray-50 rounded-lg hover:bg-gray-100 hover:text-gray-700 transition-colors duration-200"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Ads
            </Link>
            <div className="border-l border-gray-300 pl-4">
              <h1 className="text-2xl font-bold text-gray-900">Create Ad</h1>
              <p className="mt-1 text-sm text-gray-500">
                Create a new product advertisement
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Basic Information</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                maxLength={100}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter ad title"
              />
              <p className="mt-1 text-xs text-gray-500">{formData.title.length}/100 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                maxLength={500}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter ad description"
              />
              <p className="mt-1 text-xs text-gray-500">{formData.description.length}/500 characters</p>
            </div>
          </div>
        </div>

        {/* Image Upload */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Ad Image</h2>
          
          <ImageUpload
            onImageUpload={(url) => setFormData(prev => ({ ...prev, image: url }))}
            onImageRemove={() => setFormData(prev => ({ ...prev, image: '' }))}
            currentImage={formData.image}
            label="Ad Image"
          />
        </div>

        {/* Product Selection */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Product</h2>
          
          <div className="space-y-4">
            {selectedProduct ? (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-4">
                  <img
                    src={selectedProduct.featuredImage || '/images/placeholder.png'}
                    alt={selectedProduct.title}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div>
                    <h3 className="font-medium text-gray-900">{selectedProduct.title}</h3>
                    <p className="text-sm text-gray-500">SKU: {selectedProduct.variants?.[0]?.sku || 'N/A'}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveProduct}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    onFocus={() => setShowProductDropdown(true)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Search products..."
                  />
                </div>

                {showProductDropdown && productResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {productResults.map((product) => (
                      <div
                        key={product._id}
                        onClick={() => handleProductSelect(product)}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 flex items-center gap-3"
                      >
                        <img
                          src={product.featuredImage || '/images/placeholder.png'}
                          alt={product.title}
                          className="w-10 h-10 object-cover rounded"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{product.title}</div>
                          <div className="text-sm text-gray-500">৳{product.variants?.[0]?.currentPrice || product.basePrice || 0}</div>
                        </div>
                        <Package className="w-5 h-5 text-gray-400" />
                      </div>
                    ))}
                  </div>
                )}

                {searchingProducts && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Ad Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Ad Settings</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Position <span className="text-red-500">*</span>
              </label>
              <select
                name="position"
                value={formData.position}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="homepage-banner">Homepage Banner</option>
                <option value="product-page">Product Page</option>
                <option value="category-page">Category Page</option>
                <option value="search-page">Search Page</option>
                <option value="shop-page">Shop Page</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                required
                min="1"
                max="10"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="1-10"
              />
              <p className="mt-1 text-xs text-gray-500">Higher priority ads appear first (1-10)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expire Date <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="expireDate"
                value={formData.expireDate}
                onChange={handleInputChange}
                required
                min={new Date().toISOString().slice(0, 16)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Active (Ad will be visible immediately)
              </label>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-end gap-4">
            <Link
              href="/admin/dashboard/own-ads"
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Create Ad
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

