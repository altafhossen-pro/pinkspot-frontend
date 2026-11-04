'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
    Star,
    Minus,
    Plus,
    ShoppingCart,
    ChevronDown,
    ChevronUp,
    Check,
    AlertCircle,
    ZoomIn,
    X,
    Sparkles,
    Truck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { comboAPI } from '@/services/api';
import { useAppContext } from '@/context/AppContext';
import Footer from '@/components/Footer/Footer';

export default function ComboDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params?.slug;

    const { addMultipleToCart, setIsCartOpen } = useAppContext();

    const [combo, setCombo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Selected items map: { [itemKey]: boolean }
    const [selectedMap, setSelectedMap] = useState({});
    // Item quantities map: { [itemKey]: number }
    const [quantities, setQuantities] = useState({});
    // Master bundle multiplier
    const [bundleQty, setBundleQty] = useState(1);

    // Gallery state
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    // Zoom/popup modal image state: { url: string, title: string } | null
    const [zoomImage, setZoomImage] = useState(null);

    // Accordion state
    const [openAccordion, setOpenAccordion] = useState({
        description: true,
        items: true
    });

    // Adding states
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [isCheckingOut, setIsCheckingOut] = useState(false);

    useEffect(() => {
        if (!slug) return;

        const fetchCombo = async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await comboAPI.getComboBySlugPublic(slug);
                if (res.success && res.data) {
                    const data = res.data;
                    setCombo(data);

                    // Initialize selection (all selected by default)
                    const initialSelected = {};
                    const initialQty = {};

                    if (Array.isArray(data.products)) {
                        data.products.forEach((item, idx) => {
                            const p = item.product;
                            if (p && p._id) {
                                const itemKey = item._id || `${p._id}-${item.selectedVariantSku || idx}`;
                                initialSelected[itemKey] = true;
                                initialQty[itemKey] = item.defaultQuantity || 1;
                            }
                        });
                    }

                    setSelectedMap(initialSelected);
                    setQuantities(initialQty);
                    setSelectedImageIndex(0);
                } else {
                    setError(res.message || 'Combo not found');
                }
            } catch (err) {
                console.error('Error fetching combo:', err);
                setError('Failed to load combo details. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchCombo();
    }, [slug]);

    // Build gallery image list (Combo banner first, followed by each product image)
    const galleryImages = useMemo(() => {
        if (!combo) return [];
        const images = [];

        if (combo.featuredImage) {
            images.push({ url: combo.featuredImage, title: combo.title });
        }
        if (combo.mainProduct?.featuredImage && combo.mainProduct.featuredImage !== combo.featuredImage) {
            images.push({ url: combo.mainProduct.featuredImage, title: combo.mainProduct.title });
        }
        if (Array.isArray(combo.products)) {
            combo.products.forEach(item => {
                const p = item.product;
                if (p && p.featuredImage && !images.some(img => img.url === p.featuredImage)) {
                    images.push({ url: p.featuredImage, title: p.title });
                }
            });
        }
        if (images.length === 0) {
            images.push({ url: '/images/placeholder.png', title: combo.title });
        }
        return images;
    }, [combo]);

    // Helper to get consistent item key
    const getItemKey = (item, idx) => {
        return item._id || `${item.product?._id || 'prod'}-${item.selectedVariantSku || idx}`;
    };

    // Helper to resolve admin fixed variant
    const getItemVariant = (item) => {
        const p = item.product;
        if (!p) return null;
        if (item.selectedVariant) return item.selectedVariant;
        if (item.selectedVariantSku && Array.isArray(p.variants)) {
            return p.variants.find(v => v.sku === item.selectedVariantSku) || null;
        }
        if (Array.isArray(p.variants) && p.variants.length > 0) {
            return p.variants[0];
        }
        return null;
    };

    // Helper to extract real meaningful attributes (excludes placeholder "Default: Standard")
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

    // Helper for formatting variant label (Size: value / Color: value)
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

    // Toggle product selection by itemKey
    const toggleProduct = (itemKey) => {
        setSelectedMap(prev => ({
            ...prev,
            [itemKey]: !prev[itemKey]
        }));
    };

    // Update quantity for individual item by itemKey
    const updateItemQuantity = (itemKey, delta) => {
        setQuantities(prev => {
            const current = prev[itemKey] || 1;
            const updated = Math.max(1, current + delta);
            return { ...prev, [itemKey]: updated };
        });
    };

    // Calculation logic with strictly enforced rule:
    // ALL ITEMS MUST BE SELECTED TO UNLOCK COMBO DISCOUNT.
    // If any item is deselected/skipped -> NO DISCOUNT, regular price applies.
    const calculation = useMemo(() => {
        if (!combo || !combo.products) {
            return {
                selectedCount: 0,
                totalItemsCount: 0,
                regularTotal: 0,
                finalTotal: 0,
                savings: 0,
                discountPercent: 0,
                isAllSelected: false,
                baseComboRatio: 1,
                selectedItems: []
            };
        }

        let regularTotal = 0;
        let selectedCount = 0;
        const totalItemsCount = combo.products.filter(item => item.product).length;
        const selectedItems = [];

        combo.products.forEach((item, idx) => {
            const p = item.product;
            if (!p || !p._id) return;

            const itemKey = getItemKey(item, idx);
            if (selectedMap[itemKey]) {
                selectedCount++;
                const qty = (quantities[itemKey] || item.defaultQuantity || 1) * bundleQty;
                const variant = getItemVariant(item);
                const itemPrice = variant?.currentPrice || p.basePrice || 0;
                regularTotal += itemPrice * qty;

                selectedItems.push({
                    itemKey,
                    product: p,
                    selectedVariant: variant,
                    quantity: qty,
                    itemPrice
                });
            }
        });

        // Compute base combo discount ratio (what ratio items cost in this bundle)
        let baseComboRatio = 1;
        if (combo.pricingType === 'discount') {
            if (combo.discountType === 'percentage' && combo.discountValue > 0) {
                baseComboRatio = Math.max(0, 1 - (combo.discountValue / 100));
            } else if (combo.discountType === 'fixed' && combo.discountValue > 0 && combo.defaultTotalPrice > 0) {
                baseComboRatio = Math.max(0, (combo.defaultTotalPrice - combo.discountValue) / combo.defaultTotalPrice);
            }
        } else if (combo.pricingType === 'custom' && combo.defaultTotalPrice > 0) {
            const cp = combo.customPrice || combo.comboPrice || combo.defaultTotalPrice;
            baseComboRatio = Math.max(0, cp / combo.defaultTotalPrice);
        }

        const isAllSelected = selectedCount === totalItemsCount && totalItemsCount > 0;

        if (selectedCount === 0) {
            return {
                selectedCount: 0,
                totalItemsCount,
                regularTotal: 0,
                finalTotal: 0,
                savings: 0,
                discountPercent: 0,
                isAllSelected: false,
                baseComboRatio,
                selectedItems: []
            };
        }

        let finalTotal = Math.round(regularTotal);
        let savings = 0;

        // ONLY apply combo discount if ALL items are selected
        if (isAllSelected) {
            if (combo.pricingType === 'custom' && typeof combo.customPrice === 'number' && combo.customPrice > 0) {
                finalTotal = Math.round(combo.customPrice * bundleQty);
            } else if (combo.discountValue > 0) {
                if (combo.discountType === 'percentage') {
                    savings = Math.round((regularTotal * combo.discountValue) / 100);
                    finalTotal = Math.max(0, regularTotal - savings);
                } else {
                    savings = Math.round(combo.discountValue * bundleQty);
                    finalTotal = Math.max(0, regularTotal - savings);
                }
            }
            finalTotal = Math.round(finalTotal);
            savings = Math.max(0, regularTotal - finalTotal);
        } else {
            // Unselected items -> NO DISCOUNT. Customer pays regular price.
            finalTotal = Math.round(regularTotal);
            savings = 0;
        }

        const discountPercent = regularTotal > 0 && savings > 0 ? Math.round((savings / regularTotal) * 100) : 0;

        return {
            selectedCount,
            totalItemsCount,
            regularTotal: Math.round(regularTotal),
            finalTotal: Math.round(finalTotal),
            savings: Math.round(savings),
            discountPercent,
            isAllSelected,
            baseComboRatio,
            selectedItems
        };
    }, [combo, selectedMap, quantities, bundleQty]);

    // Prepare items for cart
    const prepareCartItems = () => {
        const { selectedItems, regularTotal, finalTotal, isAllSelected } = calculation;
        if (selectedItems.length === 0) return [];

        const discountRatio = isAllSelected && regularTotal > 0 ? finalTotal / regularTotal : 1;

        // All required items in this combo
        const allRequiredItemKeys = (combo?.products || [])
            .filter(item => item.product && item.product._id)
            .map((item, idx) => getItemKey(item, idx));

        return selectedItems.map(item => {
            const regularPrice = item.itemPrice;
            const discountedPrice = isAllSelected ? Math.round(regularPrice * discountRatio) : regularPrice;

            const variantObj = item.selectedVariant ? {
                ...item.selectedVariant,
                currentPrice: discountedPrice,
                originalPrice: regularPrice
            } : {
                currentPrice: discountedPrice,
                originalPrice: regularPrice
            };

            const productClone = {
                ...item.product,
                basePrice: discountedPrice,
                price: discountedPrice,
                regularPrice: regularPrice,
                originalPrice: regularPrice,
                customSubtitle: combo ? `[Combo: ${combo.title}]` : null,
                comboId: isAllSelected ? combo._id : null,
                comboSlug: isAllSelected ? combo.slug : null,
                comboTitle: isAllSelected ? combo.title : null,
                comboItemKey: item.itemKey,
                comboRequiredItems: isAllSelected ? allRequiredItemKeys : [],
                comboDiscountedPrice: discountedPrice,
                isComboActive: isAllSelected,
                comboDeliveryType: isAllSelected ? (combo?.deliveryChargeType || 'default') : 'default',
                comboCustomDeliveryCharge: isAllSelected ? (Number(combo?.customDeliveryCharge) || 0) : 0,
                originalComboDeliveryType: combo?.deliveryChargeType || 'default',
                originalComboCustomDeliveryCharge: Number(combo?.customDeliveryCharge) || 0,
            };

            return {
                product: productClone,
                selectedVariant: variantObj,
                quantity: item.quantity,
                comboId: isAllSelected ? combo._id : null,
                comboSlug: isAllSelected ? combo.slug : null,
                comboTitle: isAllSelected ? combo.title : null,
                comboItemKey: item.itemKey,
                comboRequiredItems: isAllSelected ? allRequiredItemKeys : [],
                comboDiscountedPrice: discountedPrice,
                regularPrice: regularPrice,
                isComboActive: isAllSelected,
                comboDeliveryType: isAllSelected ? (combo?.deliveryChargeType || 'default') : 'default',
                comboCustomDeliveryCharge: isAllSelected ? (Number(combo?.customDeliveryCharge) || 0) : 0,
                originalComboDeliveryType: combo?.deliveryChargeType || 'default',
                originalComboCustomDeliveryCharge: Number(combo?.customDeliveryCharge) || 0,
            };
        });
    };

    // Add selected items to cart
    const handleAddToCart = async () => {
        const items = prepareCartItems();
        if (items.length === 0) {
            toast.error('Please select at least one item from the combo');
            return;
        }

        try {
            setIsAddingToCart(true);
            await addMultipleToCart(items);
            toast.success(`Added ${items.length} items from "${combo.title}" to cart!`);
            setIsCartOpen(true);
        } catch (err) {
            console.error('Error adding combo to cart:', err);
            toast.error('Failed to add combo items to cart');
        } finally {
            setIsAddingToCart(false);
        }
    };

    // Direct checkout
    const handleBuyNow = async () => {
        const items = prepareCartItems();
        if (items.length === 0) {
            toast.error('Please select at least one item from the combo');
            return;
        }

        try {
            setIsCheckingOut(true);
            await addMultipleToCart(items);
            router.push('/checkout');
        } catch (err) {
            console.error('Error during combo checkout:', err);
            toast.error('Failed to proceed to checkout');
            setIsCheckingOut(false);
        }
    };

    // SKELETON LOADER (Exact match to ProductDetails layout)
    if (loading) {
        return (
            <div className="min-h-screen px-4 lg:px-4 py-4 bg-[#FDFCFB]">
                <div className="max-w-screen-2xl mx-auto">
                    {/* Breadcrumb Skeleton */}
                    <div className="h-4 bg-gray-200 rounded w-48 mb-6 animate-pulse" />

                    <div className="flex flex-col lg:flex-row lg:gap-12 gap-6 mb-12">
                        {/* Left Panel: Image Skeleton */}
                        <div className="space-y-4 lg:w-[45%]">
                            <div className="aspect-square bg-gray-200 rounded-2xl border border-[#E7E7E7] p-2 animate-pulse" />
                            <div className="flex gap-2">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="w-16 h-16 bg-gray-200 rounded-xl animate-pulse" />
                                ))}
                            </div>
                        </div>

                        {/* Right Panel: Content Skeleton */}
                        <div className="lg:w-[55%] space-y-4">
                            <div className="h-8 bg-gray-200 rounded w-4/5 animate-pulse" />
                            <div className="h-5 bg-gray-200 rounded w-1/3 animate-pulse" />
                            <div className="h-10 bg-gray-200 rounded w-1/2 animate-pulse" />
                            <div className="h-10 bg-gray-200 rounded w-36 animate-pulse" />

                            {/* Products Checklist Skeleton */}
                            <div className="space-y-3 pt-4 border-t border-gray-200">
                                <div className="h-5 bg-gray-200 rounded w-44 animate-pulse" />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    {[...Array(4)].map((_, i) => (
                                        <div key={i} className="p-3.5 bg-gray-100 rounded-2xl flex items-center gap-3 animate-pulse">
                                            <div className="w-5 h-5 bg-gray-300 rounded-md" />
                                            <div className="w-24 h-24 bg-gray-300 rounded-xl" />
                                            <div className="flex-1 space-y-2">
                                                <div className="h-4 bg-gray-300 rounded w-3/4" />
                                                <div className="h-3 bg-gray-200 rounded w-1/2" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Buttons Skeleton */}
                            <div className="flex gap-3 flex-col pt-4">
                                <div className="h-12 bg-gray-200 rounded-xl animate-pulse" />
                                <div className="h-12 bg-gray-200 rounded-xl animate-pulse" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !combo) {
        return (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
                <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-neutral-100 max-w-md mx-auto">
                    <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-7 h-7" />
                    </div>
                    <h2 className="text-xl font-bold text-neutral-900 mb-2">Combo Not Found</h2>
                    <p className="text-sm text-neutral-600 mb-6">{error || 'This combo is currently unavailable or has expired.'}</p>
                    <Link
                        href="/combos"
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-neutral-900 text-white rounded-xl font-medium hover:bg-neutral-800 transition cursor-pointer"
                    >
                        Browse All Combos
                    </Link>
                </div>
            </div>
        );
    }

    const currentImage = galleryImages[selectedImageIndex]?.url || combo.featuredImage || '/images/placeholder.png';
    const hasMultipleProducts = (combo.products?.length || 0) > 2;

    return (
        <div className="min-h-screen px-4 lg:px-4 py-4 bg-[#FDFCFB]">
            <div className="max-w-screen-2xl mx-auto">
                {/* Breadcrumb */}
                <div className="mb-4">
                    <nav className="flex items-center gap-2 text-xs sm:text-sm text-neutral-500">
                        <Link href="/" className="hover:text-pink-600 transition cursor-pointer">Home</Link>
                        <span className="text-neutral-400">/</span>
                        <Link href="/combos" className="hover:text-pink-600 transition cursor-pointer">Combos</Link>
                        <span className="text-neutral-400">/</span>
                        <span className="text-neutral-900 font-medium truncate max-w-xs">{combo.title}</span>
                    </nav>
                </div>

                {/* Main Product Details Layout */}
                <div className="flex flex-col lg:flex-row lg:gap-12 gap-6 mb-12">
                    {/* Left Panel: Images Showcase */}
                    <div className="space-y-4 lg:w-[45%]">
                        {/* Main Image Container */}
                        <div className="relative">
                            <div
                                role="button"
                                onClick={() => setZoomImage({ url: currentImage, title: combo.title })}
                                className="aspect-square bg-[#FEF2F4] rounded-2xl border border-[#E7E7E7] p-3 flex items-center justify-center overflow-hidden cursor-pointer group relative"
                                title="Click to enlarge"
                            >
                                <div className="relative w-full h-full">
                                    <Image
                                        src={currentImage}
                                        alt={combo.title}
                                        fill
                                        sizes="(max-width: 1024px) 100vw, 45vw"
                                        className="object-contain transition-transform duration-300 group-hover:scale-102"
                                        priority
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
                                        <div className="p-2.5 rounded-full bg-white/90 shadow-md text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ZoomIn className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Thumbnails Row */}
                        {galleryImages.length > 1 && (
                            <div className="flex flex-wrap gap-2.5 pt-1">
                                {galleryImages.map((img, idx) => {
                                    const isSelected = selectedImageIndex === idx;
                                    return (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setSelectedImageIndex(idx)}
                                            className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${isSelected ? 'border-pink-500 ring-2 ring-pink-200 shadow-xs' : 'border-gray-200 hover:border-gray-300'}`}
                                            title={img.title}
                                        >
                                            <Image
                                                src={img.url}
                                                alt={img.title || `Thumbnail ${idx + 1}`}
                                                fill
                                                sizes="80px"
                                                className="object-cover"
                                            />
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Right Panel: Combo Information */}
                    <div className="lg:w-[55%] space-y-4">
                        {/* Title & Brand */}
                        <div className="flex flex-col gap-1">
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                                {combo.title}
                            </h1>
                        </div>

                        {/* Ratings & Price */}
                        <div className="flex flex-col gap-2 pt-1">
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                    ))}
                                </div>
                                <span className="text-xs text-red-500 font-medium">18 Reviews</span>
                            </div>

                            <div className="flex flex-wrap items-baseline gap-3">
                                <span className="text-2xl sm:text-3xl font-bold text-pink-600">
                                    ৳{Math.round(calculation.finalTotal).toLocaleString()}
                                </span>
                                {calculation.isAllSelected && calculation.savings > 0 && calculation.regularTotal > calculation.finalTotal && (
                                    <span className="text-lg text-gray-400 line-through">
                                        ৳{Math.round(calculation.regularTotal).toLocaleString()}
                                    </span>
                                )}
                                {calculation.isAllSelected && calculation.savings > 0 ? (
                                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                                        Save ৳{Math.round(calculation.savings).toLocaleString()} ({Math.round(calculation.discountPercent)}%)
                                    </span>
                                ) : !calculation.isAllSelected && calculation.selectedCount > 0 ? (
                                    <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                                        Select all {calculation.totalItemsCount} items to get combo discount
                                    </span>
                                ) : null}
                                {combo?.deliveryChargeType === 'free' ? (
                                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                                        <Truck className="w-3.5 h-3.5 text-emerald-600" />
                                        Free Delivery
                                    </span>
                                ) : combo?.deliveryChargeType === 'custom' ? (
                                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200 flex items-center gap-1">
                                        <Truck className="w-3.5 h-3.5 text-indigo-600" />
                                        Delivery: ৳{combo.customDeliveryCharge}
                                    </span>
                                ) : null}
                            </div>
                        </div>

                        {/* Master Bundle Quantity Controls (Bigger buttons) */}
                        <div className="space-y-1.5 pt-1">
                            <label className="block text-sm font-medium text-gray-700">Bundle Quantity</label>
                            <div className="flex items-center border border-gray-300 rounded-xl w-fit bg-white overflow-hidden shadow-xs">
                                <button
                                    type="button"
                                    onClick={() => setBundleQty(prev => Math.max(1, prev - 1))}
                                    className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-black hover:bg-gray-100 transition cursor-pointer text-lg font-bold"
                                    aria-label="Decrease bundle quantity"
                                >
                                    <Minus className="w-4 h-4" />
                                </button>
                                <span className="w-12 text-center text-base font-bold text-gray-900 select-none">
                                    {bundleQty}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setBundleQty(prev => prev + 1)}
                                    className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-black hover:bg-gray-100 transition cursor-pointer text-lg font-bold"
                                    aria-label="Increase bundle quantity"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* WHERE VARIANTS NORMALLY SHOW: PRODUCTS IN THIS COMBO */}
                        <div className="space-y-3 pt-3 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                <label className="block text-sm font-semibold text-gray-900">
                                    Products in this Combo:
                                </label>
                                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${calculation.isAllSelected ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-pink-600 bg-pink-50 border-pink-100'}`}>
                                    {calculation.selectedCount} of {calculation.totalItemsCount} selected
                                </span>
                            </div>

                            {/* Products Grid: 2 columns in pairs if > 2 products, else single column */}
                            <div className={hasMultipleProducts ? "grid grid-cols-1 sm:grid-cols-2 gap-3.5" : "grid grid-cols-1 gap-3.5"}>
                                {combo.products?.map((item, idx) => {
                                    const p = item.product;
                                    if (!p || !p._id) return null;

                                    const itemKey = getItemKey(item, idx);
                                    const isSelected = !!selectedMap[itemKey];
                                    const currentVariant = getItemVariant(item);
                                    const variantLabel = getVariantLabel(currentVariant);
                                    const currentQty = quantities[itemKey] || item.defaultQuantity || 1;
                                    const regularPrice = currentVariant?.currentPrice || p.basePrice || 0;
                                    const originalPrice = currentVariant?.originalPrice || p.originalPrice || null;
                                    const itemImage = currentVariant?.image || p.featuredImage || '/images/placeholder.png';

                                    // Compute what this item costs in this combo
                                    const discountedComboPrice = Math.round(regularPrice * calculation.baseComboRatio);

                                    return (
                                        <div
                                            key={itemKey}
                                            onClick={() => toggleProduct(itemKey)}
                                            className={`p-3.5 rounded-2xl border-2 transition-all flex items-start gap-3 cursor-pointer select-none ${isSelected ? 'border-pink-500 bg-pink-50/20 shadow-xs' : 'border-gray-200 bg-gray-50/70 opacity-60 hover:opacity-85'}`}
                                        >
                                            {/* Checkbox (Clicking card also triggers this) */}
                                            <div
                                                className={`w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center transition border cursor-pointer mt-1 ${isSelected ? 'bg-pink-600 border-pink-600 text-white' : 'border-gray-300 bg-white hover:border-gray-400'}`}
                                            >
                                                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                            </div>

                                            {/* Product Thumbnail (Enlarged & Clickable to zoom popup) */}
                                            <div
                                                role="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setZoomImage({ url: itemImage, title: p.title });
                                                }}
                                                className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden border border-gray-200 bg-white shrink-0 cursor-pointer group shadow-2xs"
                                                title="Click to zoom image"
                                            >
                                                <Image
                                                    src={itemImage}
                                                    alt={p.title}
                                                    fill
                                                    sizes="112px"
                                                    className="object-cover group-hover:scale-105 transition-transform duration-200"
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors flex items-center justify-center">
                                                    <div className="p-1.5 rounded-full bg-white/90 text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                                                        <ZoomIn className="w-4 h-4" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Product Info & Quantity directly under Price */}
                                            <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
                                                <div>
                                                    <Link
                                                        href={`/product/${p.slug}`}
                                                        target="_blank"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="text-xs sm:text-sm font-semibold text-gray-900 hover:text-pink-600 transition line-clamp-2 leading-snug cursor-pointer"
                                                    >
                                                        {p.title}
                                                    </Link>

                                                    {/* Fixed Variant Display (Admin fixed - User cannot change) */}
                                                    {variantLabel && (
                                                        <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                                                            <span className="text-[11px] font-medium text-gray-500">Option:</span>
                                                            <span className="text-[11px] font-bold text-gray-800 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-md">
                                                                {variantLabel}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {/* Price: Shows actual discounted combo price when all selected */}
                                                    <div className="flex flex-wrap items-baseline gap-1.5 mt-1.5">
                                                        {calculation.isAllSelected && discountedComboPrice < regularPrice ? (
                                                            <>
                                                                <span className="text-sm sm:text-base font-bold text-pink-600">
                                                                    ৳{discountedComboPrice.toLocaleString()}
                                                                </span>
                                                                <span className="text-xs text-gray-400 line-through">
                                                                    ৳{regularPrice.toLocaleString()}
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <span className="text-sm sm:text-base font-bold text-gray-900">
                                                                    ৳{regularPrice.toLocaleString()}
                                                                </span>
                                                                {originalPrice && originalPrice > regularPrice && (
                                                                    <span className="text-xs text-gray-400 line-through">
                                                                        ৳{originalPrice.toLocaleString()}
                                                                    </span>
                                                                )}
                                                                {discountedComboPrice < regularPrice && (
                                                                    <span className="text-[10px] text-pink-600 font-semibold bg-pink-50 px-1.5 py-0.5 rounded">
                                                                        Combo: ৳{discountedComboPrice.toLocaleString()}
                                                                    </span>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Quantity Controller Directly Under Price (Bigger Buttons) */}
                                                <div className="mt-2 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                    <span className="text-xs text-gray-500 font-medium">Qty:</span>
                                                    <div className="flex items-center border border-gray-300 rounded-lg bg-white overflow-hidden shadow-2xs">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                updateItemQuantity(itemKey, -1);
                                                            }}
                                                            disabled={!isSelected || currentQty <= 1}
                                                            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-black hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer text-base font-bold"
                                                            aria-label="Decrease item quantity"
                                                        >
                                                            -
                                                        </button>
                                                        <span className="w-8 text-center text-xs sm:text-sm font-bold text-gray-900 select-none">
                                                            {currentQty}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                updateItemQuantity(itemKey, 1);
                                                            }}
                                                            disabled={!isSelected}
                                                            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-black hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer text-base font-bold"
                                                            aria-label="Increase item quantity"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Action Buttons (Matching ProductDetails Exactly with cursor-pointer) */}
                        <div className="flex gap-3 flex-col pt-3">
                            {/* Add to Cart Button */}
                            <button
                                type="button"
                                onClick={handleAddToCart}
                                disabled={calculation.selectedCount === 0 || isAddingToCart || isCheckingOut}
                                className="add-to-cart-btn flex-1 bg-white text-[#EF3D6A] py-3.5 px-6 rounded-xl font-semibold border-[1.5px] border-[#EF3D6A] hover:bg-pink-50 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ShoppingCart className="w-5 h-5" />
                                <span>{isAddingToCart ? 'Adding to cart...' : 'Add to cart'}</span>
                            </button>

                            {/* Buy Now / Direct Checkout Button */}
                            <button
                                type="button"
                                onClick={handleBuyNow}
                                disabled={calculation.selectedCount === 0 || isCheckingOut || isAddingToCart}
                                className="buy-now-btn flex-1 rounded-xl bg-[#EF3D6A] border-[1.5px] border-[#EF3D6A] text-white py-3.5 px-6 font-semibold hover:bg-[#e0345f] flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span>{isCheckingOut ? 'Proceeding to checkout...' : 'Buy Now'}</span>
                            </button>
                        </div>

                        {/* Short announcement note */}
                        {combo.shortDescription && (
                            <div className="border-t border-[#E7E7E7] mt-3 pt-3">
                                <p className="text-xs sm:text-sm font-medium text-pink-600 bg-pink-50 p-2.5 rounded-lg border border-pink-100">
                                    ✨ {combo.shortDescription}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Collapsible Accordion */}
                <div className="space-y-4 mb-12">
                    {/* Description Accordion */}
                    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                        <button
                            type="button"
                            onClick={() => setOpenAccordion(prev => ({ ...prev, description: !prev.description }))}
                            className="w-full flex items-center justify-between px-6 py-4 bg-white hover:bg-pink-50 transition-colors cursor-pointer"
                        >
                            <span className="text-base sm:text-lg font-semibold text-gray-900">Combo Description</span>
                            {openAccordion.description ? (
                                <ChevronUp className="w-5 h-5 text-gray-500" />
                            ) : (
                                <ChevronDown className="w-5 h-5 text-gray-500" />
                            )}
                        </button>
                        {openAccordion.description && (
                            <div className="px-6 py-4 bg-white border-t border-gray-200">
                                <div className="text-gray-700 leading-relaxed text-sm whitespace-pre-line">
                                    {combo.description || combo.shortDescription || 'Experience the complete collection of high quality essentials at an unbeatable combo discount price.'}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* What's in the Box Accordion */}
                    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                        <button
                            type="button"
                            onClick={() => setOpenAccordion(prev => ({ ...prev, items: !prev.items }))}
                            className="w-full flex items-center justify-between px-6 py-4 bg-white hover:bg-pink-50 transition-colors cursor-pointer"
                        >
                            <span className="text-base sm:text-lg font-semibold text-gray-900">What&apos;s Included in this Combo</span>
                            {openAccordion.items ? (
                                <ChevronUp className="w-5 h-5 text-gray-500" />
                            ) : (
                                <ChevronDown className="w-5 h-5 text-gray-500" />
                            )}
                        </button>
                        {openAccordion.items && (
                            <div className="px-6 py-4 bg-white border-t border-gray-200">
                                <ul className="space-y-2.5 text-sm text-gray-700">
                                    {combo.products?.map((item, idx) => (
                                        <li key={idx} className="flex items-center gap-2.5">
                                            <span className="w-2 h-2 rounded-full bg-pink-500 shrink-0" />
                                            <strong className="font-semibold text-gray-900">{item.product?.title}</strong>
                                            <span className="text-gray-400">— Qty: {item.defaultQuantity || 1}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Image Zoom / Lightbox Modal */}
            {zoomImage && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
                    onClick={() => setZoomImage(null)}
                >
                    <div
                        className="relative max-w-2xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl p-4 sm:p-6 cursor-default"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                            <h3 className="text-sm sm:text-base font-bold text-gray-900 truncate pr-4">
                                {zoomImage.title}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setZoomImage(null)}
                                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 transition cursor-pointer"
                                aria-label="Close modal"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="relative w-full aspect-square max-h-[70vh] rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center">
                            <Image
                                src={zoomImage.url}
                                alt={zoomImage.title}
                                fill
                                sizes="(max-width: 768px) 100vw, 672px"
                                className="object-contain"
                            />
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}
