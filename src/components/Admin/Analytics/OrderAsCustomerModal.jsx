'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, ShoppingBag, Plus, Minus, Trash2, Search, User, Phone, MapPin, 
  FileText, Check, AlertCircle, Loader2, Tag, ShieldCheck, ArrowRight,
  Layers, ChevronDown, CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getCookie } from 'cookies-next';
import { orderAPI, productAPI, settingsAPI } from '@/services/api';

export default function OrderAsCustomerModal({ shopper, isOpen, onClose, onOrderCreated }) {
  const [loading, setLoading] = useState(false);
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState('');

  // Customer identity
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [orderSource, setOrderSource] = useState('website');
  const [orderStatus, setOrderStatus] = useState('confirmed');

  // Order Items
  const [items, setItems] = useState([]);

  // Product Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSearchProduct, setSelectedSearchProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const searchContainerRef = useRef(null);

  // Financials
  const [deliveryCharge, setDeliveryCharge] = useState(80);
  const [customDelivery, setCustomDelivery] = useState('');
  const [discount, setDiscount] = useState(0);
  const [manualTotalOverride, setManualTotalOverride] = useState(null);

  // Pre-fill state when modal opens or shopper changes
  useEffect(() => {
    if (!isOpen || !shopper) return;

    setCustomerName(shopper.customerName || '');
    setCustomerPhone(shopper.customerPhone || '');
    setCustomerAddress(shopper.customerAddress || '');
    setCustomerNotes(shopper.customerNotes || shopper.notes || '');

    const initialDelivery = Number(shopper.deliveryCharge) > 0 ? Number(shopper.deliveryCharge) : 80;
    setDeliveryCharge(initialDelivery);
    setDiscount(0);
    setManualTotalOverride(null);
    setOrderSource('website');
    setOrderStatus('confirmed');

    // Pre-fill items from live cart
    const cartItems = (shopper.cartItems || []).map((ci, idx) => ({
      key: `cart_${idx}_${Date.now()}`,
      productId: ci.productId || ci._id,
      title: ci.title || ci.name || 'Product',
      image: ci.image || '/images/placeholder.png',
      variant: ci.variant || 'Standard',
      size: ci.size || '',
      color: ci.color || '',
      sku: ci.sku || '',
      price: Number(ci.price || ci.currentPrice || 0),
      quantity: Number(ci.quantity || 1)
    }));
    setItems(cartItems);

    // Fetch system brands
    const token = getCookie('token');
    settingsAPI.getSettings(token).then(res => {
      if (res?.success && res?.data) {
        const s = res.data;
        const bList = s.systemBrands || [];
        setBrands(bList);
        const defaultB = s.defaultBrand || bList.find(b => b.isDefault)?.name || (bList[0]?.name || '');
        setSelectedBrand(defaultB);
      }
    }).catch(() => {});

  }, [isOpen, shopper]);

  // Handle outside click for product search dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setSearchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced product search with instant SKU auto-match
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const term = searchQuery.trim().toLowerCase();
        const res = await productAPI.getProducts({ search: term, page: 1, limit: 15 });
        if (res?.success && res?.data) {
          const fetchedProducts = res.data;

          // 1. Direct SKU Auto-match check (just like manual order)
          let matchedSkuProduct = null;
          let matchedSkuVariant = null;

          for (const prod of fetchedProducts) {
            if (prod.variants && prod.variants.length > 0) {
              for (const v of prod.variants) {
                if (v.sku && v.sku.toLowerCase() === term) {
                  matchedSkuProduct = prod;
                  matchedSkuVariant = v;
                  break;
                }
              }
              if (matchedSkuVariant) break;
            }
          }

          if (matchedSkuProduct && matchedSkuVariant) {
            handleAutoAddSkuVariant(matchedSkuProduct, matchedSkuVariant);
            setSearchQuery('');
            setSearchResults([]);
            setSearchDropdownOpen(false);
            return;
          }

          setSearchResults(fetchedProducts);
          setSearchDropdownOpen(true);
        }
      } catch (err) {
        console.error('Search products error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (!isOpen || !shopper) return null;

  // Add Item automatically by SKU
  const handleAutoAddSkuVariant = (product, variant) => {
    const vSize = variant.attributes?.find(a => a.name === 'Size')?.value || variant.size || '';
    const vColor = variant.attributes?.find(a => a.name === 'Color')?.value || variant.color || '';
    const variantDisplay = [
      vSize ? `Size: ${vSize}` : '',
      vColor ? `Color: ${vColor}` : ''
    ].filter(Boolean).join(', ') || 'Standard';

    const price = Number(variant.currentPrice || variant.price || product.currentPrice || product.priceRange?.min || product.basePrice || 0);

    const newItem = {
      key: `prod_${product._id}_${variant.sku || Date.now()}_${Math.random()}`,
      productId: product._id,
      title: product.title,
      image: variant.image || product.featuredImage || '/images/placeholder.png',
      variant: variantDisplay,
      size: vSize,
      color: vColor,
      sku: variant.sku || product.slug || '',
      price,
      quantity: 1
    };

    setItems(prev => {
      const existingIdx = prev.findIndex(i => i.productId === product._id && i.sku === newItem.sku);
      if (existingIdx !== -1) {
        const copy = [...prev];
        copy[existingIdx].quantity += 1;
        return copy;
      }
      return [...prev, newItem];
    });

    toast.success(`Auto-added SKU: ${variant.sku || product.title}`);
  };

  // Add Product from Search Click
  const handleSelectProduct = (product) => {
    if (!product.variants || product.variants.length === 0) {
      // Direct add product with no variants
      const price = Number(product.currentPrice || product.salePrice || product.basePrice || (product.priceRange?.min) || 0);
      const newItem = {
        key: `prod_${product._id}_${Date.now()}_${Math.random()}`,
        productId: product._id,
        title: product.title,
        image: product.featuredImage || '/images/placeholder.png',
        variant: 'Standard',
        size: '',
        color: '',
        sku: product.slug || '',
        price,
        quantity: 1
      };
      setItems(prev => [...prev, newItem]);
      setSearchQuery('');
      setSearchDropdownOpen(false);
      setSelectedSearchProduct(null);
      toast.success(`Added ${product.title}`);
      return;
    }

    // If only 1 default variant exists, add directly
    if (product.variants.length === 1 && (!product.variants[0].attributes || product.variants[0].attributes.length === 0 || product.variants[0].attributes.every(a => a.name === 'Default'))) {
      handleAutoAddSkuVariant(product, product.variants[0]);
      setSearchQuery('');
      setSearchDropdownOpen(false);
      setSelectedSearchProduct(null);
      return;
    }

    // Multiple variants - open variant selection box
    setSelectedSearchProduct(product);
    setSearchDropdownOpen(false);
    const firstVariant = product.variants[0];
    const firstSize = firstVariant?.attributes?.find(a => a.name === 'Size')?.value || '';
    const firstColor = firstVariant?.attributes?.find(a => a.name === 'Color')?.value || '';
    setSelectedSize(firstSize);
    setSelectedColor(firstColor);
    setSelectedVariant(firstVariant);
  };

  const handleConfirmAddVariant = () => {
    if (!selectedSearchProduct) return;
    const variant = selectedVariant || selectedSearchProduct.variants?.[0];
    const vSize = selectedSize || variant?.attributes?.find(a => a.name === 'Size')?.value || '';
    const vColor = selectedColor || variant?.attributes?.find(a => a.name === 'Color')?.value || '';
    const price = Number(variant?.currentPrice || variant?.price || selectedSearchProduct.currentPrice || selectedSearchProduct.priceRange?.min || 0);
    const variantDisplay = [
      vSize ? `Size: ${vSize}` : '',
      vColor ? `Color: ${vColor}` : ''
    ].filter(Boolean).join(', ') || 'Standard';

    const newItem = {
      key: `variant_${variant?.sku || selectedSearchProduct._id}_${Date.now()}_${Math.random()}`,
      productId: selectedSearchProduct._id,
      title: selectedSearchProduct.title,
      image: variant?.image || selectedSearchProduct.featuredImage || '/images/placeholder.png',
      variant: variantDisplay,
      size: vSize,
      color: vColor,
      sku: variant?.sku || selectedSearchProduct.slug || '',
      price,
      quantity: 1
    };

    setItems(prev => {
      const existingIdx = prev.findIndex(i => i.productId === selectedSearchProduct._id && i.sku === newItem.sku);
      if (existingIdx !== -1) {
        const copy = [...prev];
        copy[existingIdx].quantity += 1;
        return copy;
      }
      return [...prev, newItem];
    });

    setSelectedSearchProduct(null);
    setSelectedVariant(null);
    setSearchQuery('');
    setSearchDropdownOpen(false);
    toast.success(`Added ${selectedSearchProduct.title} (${variantDisplay})`);
  };

  // Items manipulation
  const handleUpdateItemPrice = (index, newPrice) => {
    const val = Math.max(0, Number(newPrice) || 0);
    setItems(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], price: val };
      return copy;
    });
    setManualTotalOverride(null);
  };

  const handleUpdateItemQty = (index, delta) => {
    setItems(prev => {
      const copy = [...prev];
      const cur = copy[index].quantity;
      const next = Math.max(1, cur + delta);
      copy[index] = { ...copy[index], quantity: next };
      return copy;
    });
    setManualTotalOverride(null);
  };

  const handleRemoveItem = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
    setManualTotalOverride(null);
  };

  // Financial Calculations
  const calculatedSubtotal = items.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 1)), 0);
  const activeDeliveryCharge = customDelivery !== '' ? Number(customDelivery) : Number(deliveryCharge);
  const activeDiscount = Number(discount) || 0;
  const autoCalculatedTotal = Math.max(0, calculatedSubtotal + activeDeliveryCharge - activeDiscount);
  const finalTotalAmount = manualTotalOverride !== null ? Number(manualTotalOverride) : autoCalculatedTotal;

  // Submit Order
  const handleSubmitOrder = async (e) => {
    e.preventDefault();

    if (items.length === 0) {
      toast.error('Please add at least one product to the order.');
      return;
    }

    const cleanPhone = String(customerPhone || '').replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 11) {
      toast.error('Please provide a valid 11-digit mobile phone number.');
      return;
    }

    if (!customerAddress || customerAddress.trim().length < 5) {
      toast.error('Please provide a complete shipping address.');
      return;
    }

    const token = getCookie('token');
    setLoading(true);

    try {
      const payload = {
        orderType: 'guest',
        orderSource: orderSource || 'website',
        brand: selectedBrand,
        guestInfo: {
          name: customerName.trim() || 'Valued Customer',
          phone: cleanPhone,
          email: ''
        },
        deliveryAddress: customerAddress.trim(),
        notes: customerNotes.trim(),
        items: items.map(it => ({
          productId: it.productId,
          price: Number(it.price),
          quantity: Number(it.quantity),
          size: it.size || '',
          color: it.color || '',
          sku: it.sku || ''
        })),
        subtotal: calculatedSubtotal,
        shippingCost: activeDeliveryCharge,
        discount: activeDiscount,
        totalAmount: finalTotalAmount,
        status: orderStatus || 'confirmed',
        visitorId: shopper.visitorId
      };

      const res = await orderAPI.createManualOrder(payload, token);

      if (res?.success) {
        const orderDoc = res.data || {};
        const placedId = orderDoc.orderId || orderDoc._id;
        toast.success(`Order #${placedId} placed successfully!`, { duration: 4000 });
        if (onOrderCreated) {
          onOrderCreated(orderDoc);
        }
        onClose();
      } else {
        toast.error(res?.message || 'Failed to place order.');
      }
    } catch (err) {
      console.error('Order creation error:', err);
      toast.error(err.message || 'Something went wrong while creating order.');
    } finally {
      setLoading(false);
    }
  };

  const history = (shopper.checkoutInfoHistory || []).filter(h => h.phone || h.address);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col my-auto max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-pink-50/70 via-white to-pink-50/40 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-500 text-white flex items-center justify-center shadow-md shadow-pink-200">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Order as Customer
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-pink-100 text-pink-700">
                  Visitor #{shopper.dailySerial || (shopper.visitorId ? shopper.visitorId.slice(-6) : '')}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Create a verified store order pre-filled with this visitor's cart and typed checkout details.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmitOrder} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Customer Profile & Shipping Information */}
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                <User className="w-4 h-4 text-pink-600" />
                <span>Customer Shipping Details</span>
              </div>

              {/* Revision Picker if multiple exist */}
              {history.length > 0 && (
                <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <span className="font-medium">Previous typed entries:</span>
                  <div className="flex items-center gap-1">
                    {history.map((rev, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (rev.name) setCustomerName(rev.name);
                          if (rev.phone) setCustomerPhone(rev.phone);
                          if (rev.address) setCustomerAddress(rev.address);
                          if (rev.notes) setCustomerNotes(rev.notes);
                          toast.success(`Filled from Revision #${idx + 1}`);
                        }}
                        className="px-2 py-0.5 rounded bg-white hover:bg-pink-100 border border-slate-200 hover:border-pink-300 text-slate-700 hover:text-pink-700 font-semibold text-[10px] transition-colors"
                      >
                        #{idx + 1}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Customer Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter customer name"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all font-medium text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Customer Mobile Phone <span className="text-pink-600">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. 017XXXXXXXX"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all font-medium text-slate-800"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Full Delivery Address <span className="text-pink-600">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <textarea
                    required
                    rows={2}
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="House, Road, Area, Thana, District"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all font-medium text-slate-800 resize-none"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Order / Delivery Notes (Optional)
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    placeholder="Customer instructions or delivery notes"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all text-slate-700"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Product Items List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                <Tag className="w-4 h-4 text-pink-600" />
                <span>Order Items ({items.length})</span>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                Items Subtotal: <strong className="text-slate-900 font-bold">৳{calculatedSubtotal.toLocaleString()}</strong>
              </span>
            </div>

            {items.length === 0 ? (
              <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-6 text-center text-xs text-slate-500">
                No items in this order yet. Search and add products below.
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {items.map((item, idx) => (
                  <div 
                    key={item.key || idx}
                    className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200/90 shadow-sm gap-3 hover:border-pink-200 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <img
                        src={item.image || '/images/placeholder.png'}
                        alt={item.title}
                        className="w-11 h-11 rounded-xl object-cover border border-slate-100 flex-shrink-0 bg-slate-50"
                        onError={(e) => { e.target.src = '/images/placeholder.png'; }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs sm:text-sm font-semibold text-slate-800 truncate" title={item.title}>
                          {item.title}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                          {item.variant && <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-medium">{item.variant}</span>}
                          {item.sku && <span>SKU: {item.sku}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Price, Quantity & Total */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {/* Editable Unit Price */}
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-slate-400 font-medium">৳</span>
                        <input
                          type="number"
                          min="0"
                          value={item.price}
                          onChange={(e) => handleUpdateItemPrice(idx, e.target.value)}
                          className="w-16 px-1.5 py-1 text-xs text-right font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-pink-500 focus:bg-white"
                          title="Unit price (editable)"
                        />
                      </div>

                      {/* Qty increment/decrement */}
                      <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => handleUpdateItemQty(idx, -1)}
                          disabled={item.quantity <= 1}
                          className="p-1 hover:bg-slate-200 text-slate-600 disabled:opacity-30 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-bold text-slate-800 min-w-[20px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateItemQty(idx, 1)}
                          className="p-1 hover:bg-slate-200 text-slate-600 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Line Subtotal */}
                      <div className="text-xs sm:text-sm font-bold text-slate-900 w-16 text-right">
                        ৳{(item.price * item.quantity).toLocaleString()}
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Remove product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Live Search & Auto SKU Scanning */}
            <div className="relative mt-2" ref={searchContainerRef}>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (searchResults.length > 0) setSearchDropdownOpen(true);
                  }}
                  placeholder="Search product by title, or scan/enter exact SKU to auto-add..."
                  className="w-full pl-9 pr-10 py-2.5 text-xs sm:text-sm bg-slate-50 hover:bg-white focus:bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all font-medium text-slate-800"
                />
                {isSearching && (
                  <Loader2 className="w-4 h-4 text-pink-500 animate-spin absolute right-3 top-3" />
                )}
              </div>

              {/* Search Results Dropdown */}
              {searchDropdownOpen && searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-100 max-h-64 overflow-y-auto z-20 divide-y divide-slate-100">
                  {searchResults.map((p) => {
                    const price = p.currentPrice || p.salePrice || p.basePrice || (p.priceRange?.min) || 0;
                    return (
                      <button
                        key={p._id}
                        type="button"
                        onClick={() => handleSelectProduct(p)}
                        className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-pink-50/60 transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <img
                            src={p.featuredImage || '/images/placeholder.png'}
                            alt={p.title}
                            className="w-9 h-9 rounded-lg object-cover bg-slate-100 flex-shrink-0"
                            onError={(e) => { e.target.src = '/images/placeholder.png'; }}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold text-slate-800 truncate group-hover:text-pink-700">
                              {p.title}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2">
                              {p.variants?.length > 1 ? (
                                <span className="text-pink-600 font-semibold">{p.variants.length} Variants</span>
                              ) : (
                                <span>SKU: {p.variants?.[0]?.sku || p.slug}</span>
                              )}
                              <span>Stock: {p.totalStock ?? p.variants?.[0]?.stockQuantity ?? 'In Stock'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 pl-2">
                          <span className="text-xs font-bold text-slate-900">৳{price}</span>
                          <span className="block text-[10px] text-pink-600 font-bold group-hover:underline">
                            {p.variants?.length > 1 ? 'Choose Variant →' : '+ Add to Order'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Variant Selector Popup if product selected has multiple variants */}
            {selectedSearchProduct && selectedSearchProduct.variants?.length > 0 && (
              <div className="p-4 bg-gradient-to-br from-pink-50/80 via-white to-pink-50/40 border border-pink-200 rounded-2xl space-y-3.5 shadow-sm animate-in fade-in duration-150">
                <div className="flex items-center justify-between border-b border-pink-100 pb-2">
                  <div>
                    <span className="text-[11px] font-bold text-pink-600 uppercase tracking-wider block">Select Variant</span>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-md">{selectedSearchProduct.title}</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedSearchProduct(null)}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedSearchProduct.variants.map((v, i) => {
                    const vSize = v.attributes?.find(a => a.name === 'Size')?.value || v.size || '';
                    const vColor = v.attributes?.find(a => a.name === 'Color')?.value || v.color || '';
                    const isSelected = selectedVariant?.sku ? selectedVariant.sku === v.sku : selectedVariant === v;

                    return (
                      <div
                        key={v.sku || i}
                        onClick={() => {
                          setSelectedVariant(v);
                          setSelectedSize(vSize);
                          setSelectedColor(vColor);
                        }}
                        className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-pink-600 text-white border-pink-600 shadow-md shadow-pink-200' 
                            : 'bg-white text-slate-700 border-slate-200 hover:border-pink-300 hover:bg-pink-50/30'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-white bg-white text-pink-600' : 'border-slate-300'}`}>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <div>
                            <span className="font-bold text-xs">
                              {[vSize && `Size: ${vSize}`, vColor && `Color: ${vColor}`].filter(Boolean).join(', ') || `Variant #${i + 1}`}
                            </span>
                            {v.sku && <span className={`text-[10px] ml-2 font-mono ${isSelected ? 'text-pink-100' : 'text-slate-400'}`}>SKU: {v.sku}</span>}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-extrabold text-xs">৳{v.currentPrice || v.price}</span>
                          <span className={`block text-[10px] ${isSelected ? 'text-pink-100' : 'text-slate-400'}`}>
                            Stock: {v.stockQuantity ?? 'Available'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end gap-2 pt-1 border-t border-pink-100">
                  <button
                    type="button"
                    onClick={() => setSelectedSearchProduct(null)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold bg-white hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmAddVariant}
                    className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white text-xs font-bold shadow-md shadow-pink-200 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Selected Variant</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Settings & Configuration: Brand, Delivery, Discount, Source */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
            
            {/* Delivery Charge Presets */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Delivery Charge
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { label: 'Inside Dhaka', val: 80 },
                  { label: 'Sub Area', val: 120 },
                  { label: 'Outside', val: 150 },
                  { label: 'Free', val: 0 },
                ].map((preset) => (
                  <button
                    key={preset.val}
                    type="button"
                    onClick={() => {
                      setDeliveryCharge(preset.val);
                      setCustomDelivery('');
                      setManualTotalOverride(null);
                    }}
                    className={`py-1.5 px-1 rounded-xl text-xs font-bold border transition-all text-center ${
                      customDelivery === '' && deliveryCharge === preset.val
                        ? 'bg-pink-600 text-white border-pink-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-pink-50'
                    }`}
                  >
                    ৳{preset.val}
                    <span className="block text-[10px] font-normal opacity-85 truncate">{preset.label}</span>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] text-slate-500">Or custom delivery ৳:</span>
                <input
                  type="number"
                  min="0"
                  placeholder="Custom"
                  value={customDelivery}
                  onChange={(e) => {
                    setCustomDelivery(e.target.value);
                    setManualTotalOverride(null);
                  }}
                  className="w-24 px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>

            {/* Discount */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Discount (৳)
              </label>
              <input
                type="number"
                min="0"
                value={discount}
                onChange={(e) => {
                  setDiscount(Math.max(0, Number(e.target.value) || 0));
                  setManualTotalOverride(null);
                }}
                placeholder="0"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-pink-500 font-bold text-slate-800"
              />
            </div>

            {/* Brand Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Order Brand
              </label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-pink-500 font-medium text-slate-800"
              >
                {brands.length > 0 ? (
                  brands.map((b) => (
                    <option key={b._id || b.name} value={b.name}>
                      {b.name} {b.isDefault ? '(Default)' : ''}
                    </option>
                  ))
                ) : (
                  <option value="ForPink">ForPink (Default)</option>
                )}
              </select>
            </div>

            {/* Order Source */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Order Source
              </label>
              <select
                value={orderSource}
                onChange={(e) => setOrderSource(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-pink-500 font-medium text-slate-800"
              >
                <option value="website">Website (Customer View)</option>
                <option value="manual">Manual Admin</option>
                <option value="facebook">Facebook</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="phone">Phone Call</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Initial Status
              </label>
              <select
                value={orderStatus}
                onChange={(e) => setOrderStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-pink-500 font-medium text-slate-800"
              >
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          {/* Grand Total Summary Box */}
          <div className="bg-gradient-to-br from-emerald-50 via-emerald-50/60 to-teal-50 border border-emerald-200/80 rounded-2xl p-4.5 space-y-2">
            <div className="flex items-center justify-between text-xs text-emerald-800">
              <span>Items Subtotal:</span>
              <span className="font-semibold">৳{calculatedSubtotal.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-emerald-800">
              <span>Delivery Charge:</span>
              <span className="font-semibold">+৳{activeDeliveryCharge}</span>
            </div>
            {activeDiscount > 0 && (
              <div className="flex items-center justify-between text-xs text-rose-700 font-medium">
                <span>Discount Applied:</span>
                <span className="font-semibold">-৳{activeDiscount}</span>
              </div>
            )}
            <div className="border-t border-emerald-200/80 pt-2 flex items-center justify-between">
              <div>
                <span className="text-sm sm:text-base font-extrabold text-emerald-950 block">
                  Grand Total Payable:
                </span>
                <span className="text-[11px] text-emerald-700">
                  {manualTotalOverride !== null ? '(Manually customized total)' : '(Calculated from items + delivery - discount)'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black text-emerald-900">
                  ৳{finalTotalAmount.toLocaleString()}
                </span>
                
                {/* Manual override button */}
                {manualTotalOverride === null ? (
                  <button
                    type="button"
                    onClick={() => setManualTotalOverride(autoCalculatedTotal)}
                    className="text-[10px] text-emerald-700 hover:text-emerald-900 underline font-medium"
                  >
                    Edit Total
                  </button>
                ) : (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      value={manualTotalOverride}
                      onChange={(e) => setManualTotalOverride(Number(e.target.value) || 0)}
                      className="w-20 px-2 py-1 text-xs border border-emerald-400 rounded bg-white text-emerald-950 font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => setManualTotalOverride(null)}
                      className="text-[10px] text-rose-600 hover:underline"
                    >
                      Reset
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || items.length === 0}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-pink-200 hover:shadow-lg disabled:opacity-50 flex items-center gap-2 transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Placing Order...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Place Order as Customer (৳{finalTotalAmount.toLocaleString()})
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
