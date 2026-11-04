'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Search, 
  Plus, 
  Trash2, 
  Layers, 
  Package, 
  Tag, 
  Sparkles, 
  Upload, 
  Check, 
  RefreshCw,
  Link2,
  ExternalLink,
  Truck
} from 'lucide-react';
import { comboAPI, productAPI, uploadAPI } from '@/services/api';
import toast from 'react-hot-toast';
import { getCookie } from 'cookies-next';

const getRealAttributes = (variant) => {
  if (!variant || !Array.isArray(variant.attributes)) return [];
  return variant.attributes.filter(a => {
    if (!a || !a.name || !a.value) return false;
    const nameLower = a.name.toString().trim().toLowerCase();
    const valLower = a.value.toString().trim().toLowerCase();
    if (nameLower === 'default' || valLower === 'standard' || valLower === 'default') {
      return false;
    }
    return true;
  });
};

const getVariantLabel = (variant) => {
  if (!variant) return '';
  const realAttrs = getRealAttributes(variant);
  if (realAttrs.length > 0) {
    return realAttrs.map(a => `${a.name}: ${a.value}`).join(' / ');
  }
  if (variant.size || variant.color) {
    const parts = [];
    if (variant.size) parts.push(`Size: ${variant.size}`);
    if (variant.color) parts.push(`Color: ${variant.color}`);
    return parts.join(' / ');
  }
  return '';
};

const getProductRealVariants = (prod) => {
  const variants = Array.isArray(prod?.variants) ? prod.variants : [];
  if (variants.length === 0) return [];
  const real = variants.filter(v => getRealAttributes(v).length > 0 || v.size || v.color);
  if (real.length > 0) return real;
  if (variants.length > 1) return variants;
  return [];
};

export default function EditComboPage() {
  const router = useRouter();
  const params = useParams();
  const comboId = params.id;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form fields
  const [comboType, setComboType] = useState('standalone');
  const [selectedMainProduct, setSelectedMainProduct] = useState(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [galleryImages, setGalleryImages] = useState([]);
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('published');
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  // Assigned products
  const [assignedProducts, setAssignedProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState([]);

  // Pricing
  const [pricingType, setPricingType] = useState('discount');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState(15);
  const [customPrice, setCustomPrice] = useState(0);
  const [oldPrice, setOldPrice] = useState(0);

  // Delivery charge settings: 'default', 'free', 'custom'
  const [deliveryChargeType, setDeliveryChargeType] = useState('default');
  const [customDeliveryCharge, setCustomDeliveryCharge] = useState(0);

  const getAdminToken = () => getCookie('token');

  // Load existing combo data
  useEffect(() => {
    if (!comboId) return;

    const fetchCombo = async () => {
      try {
        setLoading(true);
        const token = getAdminToken();
        const res = await comboAPI.getComboById(comboId, token);

        if (res.success && res.data) {
          const combo = res.data;
          setTitle(combo.title || '');
          setSlug(combo.slug || '');
          setComboType(combo.comboType || 'standalone');
          setSelectedMainProduct(combo.mainProduct || null);
          setFeaturedImage(combo.featuredImage || '');
          setGalleryImages(combo.gallery || []);
          setShortDescription(combo.shortDescription || '');
          setDescription(combo.description || '');
          setStatus(combo.status || 'published');
          setIsActive(combo.isActive !== undefined ? combo.isActive : true);
          setIsFeatured(Boolean(combo.isFeatured));

          setPricingType(combo.pricingType || 'discount');
          setDiscountType(combo.discountType || 'percentage');
          setDiscountValue(combo.discountValue || 0);
          setCustomPrice(combo.customPrice || 0);
          setOldPrice(combo.oldPrice || 0);
          setDeliveryChargeType(combo.deliveryChargeType || 'default');
          setCustomDeliveryCharge(combo.customDeliveryCharge || 0);

          if (combo.products && combo.products.length > 0) {
            setAssignedProducts(
              combo.products.map((item, idx) => {
                const prod = item.product || {};
                const variants = getProductRealVariants(prod);
                let selVariant = item.selectedVariant;
                if (!selVariant && item.selectedVariantSku && variants.length > 0) {
                  selVariant = variants.find(v => v.sku === item.selectedVariantSku);
                }
                if (!selVariant && variants.length > 0) {
                  selVariant = variants[0];
                }

                const currentPrice = selVariant?.currentPrice || prod.basePrice || prod.priceRange?.min || 0;
                const origPrice = selVariant?.originalPrice || prod.priceRange?.max || prod.basePrice || currentPrice;

                return {
                  clientUid: `item-${idx}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                  _id: prod._id || item.product,
                  title: prod.title || 'Product',
                  featuredImage: selVariant?.image || prod.featuredImage || '',
                  basePrice: currentPrice,
                  originalPrice: origPrice,
                  variants,
                  selectedVariantSku: selVariant?.sku || item.selectedVariantSku || (variants[0]?.sku) || null,
                  selectedVariant: selVariant || (variants[0] || null),
                  defaultQuantity: item.defaultQuantity || 1,
                  isMainProduct: Boolean(item.isMainProduct),
                };
              })
            );
          }
        } else {
          toast.error(res.message || 'Failed to fetch combo details');
        }
      } catch (err) {
        console.error('Error fetching combo:', err);
        toast.error('Failed to load combo details');
      } finally {
        setLoading(false);
      }
    };

    fetchCombo();
  }, [comboId]);

  // Search products
  useEffect(() => {
    if (!productSearch.trim()) {
      setProductResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const token = getAdminToken();
        const res = await productAPI.getProducts(`search=${encodeURIComponent(productSearch.trim())}&limit=8`, token);
        if (res.success) {
          setProductResults(res.data || []);
        }
      } catch (err) {
        console.error('Error searching products:', err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [productSearch]);

  const handleAddProduct = (prod) => {
    const variants = getProductRealVariants(prod);
    
    // If no variants, prevent adding duplicate product
    if (variants.length === 0) {
      const exists = assignedProducts.some(p => p._id === prod._id);
      if (exists) {
        toast.error('This product is already in the combo');
        return;
      }
    }

    // Pick first variant not already added, or default to first variant
    const alreadyChosenSkus = assignedProducts
      .filter(p => p._id === prod._id && p.selectedVariantSku)
      .map(p => p.selectedVariantSku);
    const availableVariant = variants.find(v => !alreadyChosenSkus.includes(v.sku)) || variants[0];

    const currentPrice = availableVariant?.currentPrice || prod.basePrice || prod.priceRange?.min || 0;
    const origPrice = availableVariant?.originalPrice || prod.priceRange?.max || prod.basePrice || currentPrice;

    const newItem = {
      clientUid: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      _id: prod._id,
      title: prod.title,
      featuredImage: availableVariant?.image || prod.featuredImage || '',
      basePrice: currentPrice,
      originalPrice: origPrice,
      variants,
      selectedVariantSku: availableVariant?.sku || null,
      selectedVariant: availableVariant || null,
      defaultQuantity: 1,
      isMainProduct: false,
    };

    setAssignedProducts(prev => [...prev, newItem]);
    toast.success(`Added "${prod.title}"${availableVariant ? ` (${getVariantLabel(availableVariant)})` : ''}`);
  };

  const handleAddAnotherVariant = (item) => {
    if (!item.variants || item.variants.length === 0) return;

    const alreadyChosenSkus = assignedProducts
      .filter(p => p._id === item._id && p.selectedVariantSku)
      .map(p => p.selectedVariantSku);
    const nextVariant = item.variants.find(v => !alreadyChosenSkus.includes(v.sku)) || item.variants[0];

    const currentPrice = nextVariant?.currentPrice || item.basePrice || 0;
    const origPrice = nextVariant?.originalPrice || item.originalPrice || currentPrice;

    const newItem = {
      clientUid: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      _id: item._id,
      title: item.title,
      featuredImage: nextVariant?.image || item.featuredImage,
      basePrice: currentPrice,
      originalPrice: origPrice,
      variants: item.variants,
      selectedVariantSku: nextVariant?.sku || null,
      selectedVariant: nextVariant || null,
      defaultQuantity: 1,
      isMainProduct: false,
    };

    setAssignedProducts(prev => [...prev, newItem]);
    toast.success(`Added variant "${getVariantLabel(nextVariant)}" of ${item.title}`);
  };

  const handleVariantChange = (clientUid, variantSku) => {
    setAssignedProducts(prev =>
      prev.map(item => {
        if (item.clientUid !== clientUid) return item;
        const v = item.variants?.find(va => va.sku === variantSku);
        if (!v) return item;

        return {
          ...item,
          selectedVariantSku: v.sku,
          selectedVariant: v,
          basePrice: v.currentPrice || item.basePrice,
          originalPrice: v.originalPrice || v.currentPrice || item.originalPrice,
          featuredImage: v.image || item.featuredImage,
        };
      })
    );
  };

  const handleRemoveProduct = (clientUid) => {
    setAssignedProducts(prev => prev.filter(p => (p.clientUid ? p.clientUid !== clientUid : p._id !== clientUid)));
  };

  const handleQuantityChange = (clientUid, qty) => {
    const validQty = Math.max(1, Number(qty) || 1);
    setAssignedProducts(prev =>
      prev.map(p => ((p.clientUid === clientUid || (!p.clientUid && p._id === clientUid)) ? { ...p, defaultQuantity: validQty } : p))
    );
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('image', file);

      const res = await uploadAPI.uploadSingle(formData);
      if (res.success && res.data?.url) {
        setFeaturedImage(res.data.url);
        toast.success('Image uploaded successfully');
      } else {
        toast.error(res.message || 'Image upload failed');
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  // Calculations
  const defaultTotalPrice = assignedProducts.reduce((sum, item) => {
    return sum + (Number(item.basePrice) || 0) * (Number(item.defaultQuantity) || 1);
  }, 0);

  const defaultOldPrice = assignedProducts.reduce((sum, item) => {
    const itemOld = item.originalPrice && item.originalPrice > item.basePrice ? item.originalPrice : item.basePrice;
    return sum + (Number(itemOld) || 0) * (Number(item.defaultQuantity) || 1);
  }, 0);

  let calculatedFinalPrice = defaultTotalPrice;
  if (pricingType === 'custom') {
    calculatedFinalPrice = Number(customPrice) > 0 ? Number(customPrice) : defaultTotalPrice;
  } else {
    const dVal = Number(discountValue) || 0;
    if (discountType === 'percentage') {
      const discountAmount = (defaultTotalPrice * Math.min(100, dVal)) / 100;
      calculatedFinalPrice = Math.max(0, Math.round(defaultTotalPrice - discountAmount));
    } else {
      calculatedFinalPrice = Math.max(0, Math.round(defaultTotalPrice - dVal));
    }
  }

  const calculatedSavings = Math.max(0, defaultTotalPrice - calculatedFinalPrice);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Please enter a combo title');
      return;
    }

    if (!featuredImage.trim()) {
      toast.error('Please provide a featured image');
      return;
    }

    if (assignedProducts.length === 0) {
      toast.error('Please assign at least one product');
      return;
    }

    try {
      setSubmitting(true);
      const token = getAdminToken();

      const payload = {
        title: title.trim(),
        slug: slug.trim(),
        comboType,
        mainProduct: selectedMainProduct?._id || selectedMainProduct || null,
        featuredImage: featuredImage.trim(),
        gallery: galleryImages,
        shortDescription: shortDescription.trim(),
        description: description.trim(),
        products: assignedProducts.map((p, idx) => ({
          product: p._id,
          defaultQuantity: Number(p.defaultQuantity) || 1,
          selectedVariantSku: p.selectedVariantSku || p.selectedVariant?.sku || null,
          selectedVariant: p.selectedVariant || null,
          isMainProduct: Boolean(p.isMainProduct),
          order: idx,
          isActive: true,
        })),
        pricingType,
        discountType,
        discountValue: Number(discountValue) || 0,
        customPrice: Number(customPrice) || 0,
        oldPrice: Number(oldPrice) > 0 ? Number(oldPrice) : defaultOldPrice,
        deliveryChargeType,
        customDeliveryCharge: deliveryChargeType === 'custom' ? Number(customDeliveryCharge) || 0 : 0,
        status,
        isActive,
        isFeatured,
      };

      const res = await comboAPI.updateCombo(comboId, payload, token);

      if (res.success) {
        toast.success('Combo updated successfully!');
        router.push('/admin/dashboard/upsells');
      } else {
        toast.error(res.message || 'Failed to update combo');
      }
    } catch (err) {
      console.error('Error updating combo:', err);
      toast.error(err?.response?.data?.message || 'Error updating combo');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-slate-500 gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-pink-600" />
        <p className="text-sm font-semibold">Loading combo details...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push('/admin/dashboard/upsells')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-sm cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Combos</span>
        </button>

        <a
          href={`/combo/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-pink-600 hover:text-pink-700 bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors"
        >
          <span>View Public Page</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-pink-100 rounded-xl">
          <Layers className="w-6 h-6 text-pink-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Edit Combo Product</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Update bundled products, pricing, discounts, and public page content
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Mode Details */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pink-600" />
              <span>Combo Type & Identity</span>
            </h3>
            <span className="px-3 py-1 bg-slate-100 text-slate-700 font-bold text-xs rounded-full capitalize">
              {comboType === 'standalone' ? 'Standalone Combo Group' : 'Main Product Based'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Combo Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-pink-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                URL Slug <span className="text-red-500">*</span>
              </label>
              <div className="flex rounded-xl shadow-xs">
                <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 bg-slate-100 text-slate-500 text-xs font-mono">
                  /combo/
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  required
                  className="flex-1 block w-full px-3 py-2.5 text-sm border border-slate-200 rounded-r-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-pink-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Featured Image */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Featured Image URL <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-col sm:flex-row gap-3 items-start">
              <div className="flex-1 w-full">
                <input
                  type="text"
                  value={featuredImage}
                  onChange={(e) => setFeaturedImage(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors shrink-0">
                <Upload className="w-3.5 h-3.5" />
                <span>{uploadingImage ? 'Uploading...' : 'Upload Image'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploadingImage}
                />
              </label>
            </div>

            {featuredImage && (
              <div className="mt-3 relative inline-block">
                <img
                  src={featuredImage}
                  alt="Featured preview"
                  className="w-24 h-24 object-cover rounded-xl border border-slate-200 shadow-xs"
                />
              </div>
            )}
          </div>

          {/* Descriptions */}
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Short Description
              </label>
              <input
                type="text"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                maxLength={500}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Detailed Description
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-pink-500"
              />
            </div>
          </div>
        </div>

        {/* Step 2: Assigned Products */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-pink-600" />
                <span>Assigned Products</span>
              </h3>
              <p className="text-xs text-slate-500">Manage the items bundled inside this combo</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-pink-100 text-pink-700 rounded-lg">
              {assignedProducts.length} Items
            </span>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Search products by title to add..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-pink-500"
            />

            {productResults.length > 0 && (
              <div className="absolute z-20 left-0 right-0 mt-1 max-h-64 overflow-y-auto bg-white rounded-2xl shadow-xl border border-slate-200 divide-y divide-slate-100">
                {productResults.map(prod => {
                  const variants = getProductRealVariants(prod);
                  const addedCount = assignedProducts.filter(p => p._id === prod._id).length;
                  const isFullyAdded = variants.length > 0 ? (addedCount >= variants.length) : (addedCount > 0);
                  const price = prod.basePrice || prod.priceRange?.min || (variants[0]?.currentPrice) || 0;

                  return (
                    <div key={prod._id} className="p-3 hover:bg-pink-50/50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={prod.featuredImage || '/images/placeholder.png'}
                          alt={prod.title}
                          className="w-10 h-10 object-cover rounded-lg border border-slate-200"
                        />
                        <div>
                          <p className="text-xs font-semibold text-slate-800 line-clamp-1">{prod.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-pink-600 font-bold">৳{price}</span>
                            {variants.length > 0 && (
                              <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                                {variants.length} variants
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {isFullyAdded ? (
                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
                          {variants.length > 0 ? 'All Variants Added' : 'Added'}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAddProduct(prod)}
                          className="px-3 py-1.5 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                        >
                          {addedCount > 0 ? '+ Add Variant' : 'Add'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* List */}
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
            {assignedProducts.map((prod, idx) => (
              <div key={prod.clientUid || prod._id || idx} className="p-3.5 bg-white hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-mono text-slate-500 font-bold shrink-0 mt-1 sm:mt-0">
                    {idx + 1}
                  </span>
                  <img
                    src={prod.featuredImage || '/images/placeholder.png'}
                    alt={prod.title}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-bold text-slate-900 line-clamp-1">{prod.title}</p>
                      {prod.isMainProduct && (
                        <span className="px-2 py-0.5 text-[10px] bg-indigo-100 text-indigo-700 font-bold rounded-full">
                          Main Product
                        </span>
                      )}
                    </div>

                    {/* Fixed variant selector if product has variants */}
                    {prod.variants && prod.variants.length > 0 ? (
                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Fixed Variant:</span>
                        <select
                          value={prod.selectedVariantSku || ''}
                          onChange={(e) => handleVariantChange(prod.clientUid, e.target.value)}
                          className="text-xs py-1 px-2 border border-slate-300 rounded-lg bg-white font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-pink-500 max-w-[200px] cursor-pointer"
                        >
                          {prod.variants.map((v) => (
                            <option key={v.sku} value={v.sku}>
                              {getVariantLabel(v)} (৳{v.currentPrice || prod.basePrice})
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => handleAddAnotherVariant(prod)}
                          title="Add another variant of this product"
                          className="text-[11px] font-semibold text-pink-600 hover:text-pink-700 hover:underline flex items-center gap-0.5 cursor-pointer ml-1"
                        >
                          <Plus className="w-3 h-3 inline" /> Add variant
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs font-bold text-slate-600 mt-0.5">৳{prod.basePrice || 0}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 ml-9 sm:ml-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-500">Qty:</span>
                    <input
                      type="number"
                      min="1"
                      value={prod.defaultQuantity || 1}
                      onChange={(e) => handleQuantityChange(prod.clientUid, e.target.value)}
                      className="w-14 px-2 py-1 text-xs border border-slate-200 rounded-lg text-center font-bold"
                    />
                  </div>

                  <span className="text-xs font-mono font-bold text-slate-800 w-16 text-right">
                    ৳{((Number(prod.basePrice) || 0) * (Number(prod.defaultQuantity) || 1)).toLocaleString()}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleRemoveProduct(prod.clientUid)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Step 3: Pricing */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Pricing Configuration</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase">
                  Pricing Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPricingType('discount')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      pricingType === 'discount'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    Bundle Discount (% / ৳)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPricingType('custom')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      pricingType === 'custom'
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-800 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    Manual Price
                  </button>
                </div>
              </div>

              {pricingType === 'discount' ? (
                <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-3">
                  <label className="block text-xs font-bold text-emerald-950 uppercase">
                    Discount Settings
                  </label>
                  <div className="flex gap-3">
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value)}
                      className="px-3 py-2 text-xs border border-emerald-200 rounded-xl bg-white font-semibold"
                    >
                      <option value="percentage">Percentage (% OFF)</option>
                      <option value="fixed">Fixed Amount (৳ OFF)</option>
                    </select>

                    <div className="flex-1 relative">
                      <input
                        type="number"
                        min="0"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm border border-emerald-200 rounded-xl bg-white font-bold"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-700">
                        {discountType === 'percentage' ? '%' : '৳'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-indigo-900 mb-1">
                        Custom Selling Price (৳)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={customPrice}
                        onChange={(e) => setCustomPrice(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm border border-indigo-200 rounded-xl bg-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-indigo-900 mb-1">
                        Old Price (৳)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={oldPrice}
                        onChange={(e) => setOldPrice(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm border border-indigo-200 rounded-xl bg-white font-medium text-slate-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Price Preview Card */}
            <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Customer Price Preview
              </h4>
              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex justify-between items-center">
                  <span>Regular Total:</span>
                  <span className="font-mono text-sm font-semibold">৳{defaultTotalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-emerald-400 font-semibold">
                  <span>Savings:</span>
                  <span>- ৳{calculatedSavings.toLocaleString()}</span>
                </div>
                <div className="pt-3 border-t border-slate-800 flex justify-between items-baseline">
                  <div>
                    <span className="text-slate-400 text-xs block">Combo Deal Price:</span>
                    <span className="text-2xl font-black text-white">৳{calculatedFinalPrice.toLocaleString()}</span>
                  </div>
                  {calculatedSavings > 0 && (
                    <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full font-bold text-xs">
                      Save ৳{calculatedSavings.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 4: Delivery Charge Configuration */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600" />
                <span>Delivery Charge Configuration</span>
              </h3>
              <p className="text-xs text-slate-500">
                Choose delivery charge rule for this combo package
              </p>
            </div>
            {deliveryChargeType === 'free' && (
              <span className="text-xs font-bold px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-lg">
                Free Delivery Enabled
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setDeliveryChargeType('default')}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                deliveryChargeType === 'default'
                  ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <p className="text-xs font-bold text-slate-900">Standard Delivery</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Use default website delivery charges (Inside/Outside Dhaka)</p>
            </button>

            <button
              type="button"
              onClick={() => setDeliveryChargeType('free')}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                deliveryChargeType === 'free'
                  ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <p className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <span>Free Delivery</span>
                <span className="text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.2 rounded font-bold">FREE</span>
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Customers get ৳0 delivery fee on this combo deal</p>
            </button>

            <button
              type="button"
              onClick={() => setDeliveryChargeType('custom')}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                deliveryChargeType === 'custom'
                  ? 'border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <p className="text-xs font-bold text-indigo-900">Custom Delivery Charge</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Set a fixed special delivery charge for this combo</p>
            </button>
          </div>

          {deliveryChargeType === 'custom' && (
            <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 max-w-sm space-y-2">
              <label className="block text-xs font-bold text-indigo-950 uppercase">
                Custom Delivery Fee (৳)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-500">৳</span>
                <input
                  type="number"
                  min="0"
                  value={customDeliveryCharge}
                  onChange={(e) => setCustomDeliveryCharge(Math.max(0, Number(e.target.value) || 0))}
                  placeholder="e.g. 50"
                  className="w-full px-3 py-2 text-sm border border-indigo-200 rounded-xl bg-white font-bold text-slate-900"
                />
              </div>
              <p className="text-[11px] text-indigo-700">Customers will be charged exactly ৳{customDeliveryCharge || 0} for delivery.</p>
            </div>
          )}
        </div>

        {/* Step 5: Status and Actions */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50 font-semibold text-slate-800 cursor-pointer"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-4">
              <input
                type="checkbox"
                id="editIsActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-pink-600 rounded-md border-slate-300 focus:ring-pink-500 cursor-pointer"
              />
              <label htmlFor="editIsActive" className="text-xs font-bold text-slate-700 cursor-pointer">
                Active in Store
              </label>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => router.push('/admin/dashboard/upsells')}
              className="flex-1 sm:flex-none px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

