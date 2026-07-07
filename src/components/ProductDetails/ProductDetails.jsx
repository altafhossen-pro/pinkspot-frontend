'use client';

import React, { useState, useEffect } from 'react';
import { Star, Heart, Minus, Plus, ShoppingCart, Package, ChevronDown, ChevronUp } from 'lucide-react';
import CountdownTimer from '@/components/Common/CountdownTimer';
import UpsellProducts from './UpsellProducts';
import SimilarProducts from './SimilarProducts';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { productAPI, transformProductData } from '@/services/api';
import { useAppContext } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import { addProductToWishlist } from '@/utils/wishlistUtils';
import ProductNotFound from '@/components/Common/ProductNotFound';



export default function ProductDetails({ productSlug }) {
    const { addToCart, addToWishlist, removeFromWishlist, wishlist, deliveryChargeSettings, deliverySettingsLoading } = useAppContext();
    const router = useRouter();
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [selectedSize, setSelectedSize] = useState("");
    const [selectedColor, setSelectedColor] = useState("");
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [openAccordion, setOpenAccordion] = useState({
        description: true, // Open by default
        additional: false,
        delivery: false
    });
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showMagnify, setShowMagnify] = useState(false);
    const [magnifyPosition, setMagnifyPosition] = useState({ x: 0, y: 0 });
    const [isManualImageSelection, setIsManualImageSelection] = useState(false);
    const [hasManuallySelectedVariant, setHasManuallySelectedVariant] = useState(false);
    const [selectedVariantSku, setSelectedVariantSku] = useState(null);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

    // Fetch product data
    useEffect(() => {
        if (productSlug) {
            fetchProduct();
        }
    }, [productSlug]);

    // Check if product is in wishlist
    useEffect(() => {
        if (product && wishlist) {
            const isInWishlist = wishlist.some(item => item.productId === product._id);
            setIsWishlisted(isInWishlist);
        }
    }, [product, wishlist]);

    // Reset selected image to 0 (featured image) when product changes
    useEffect(() => {
        if (product) {
            setSelectedImage(0);
            setHasManuallySelectedVariant(false); // Reset on new product load
            setIsManualImageSelection(false); // Reset manual image selection
        }
    }, [product]);

    // Reset selected image to 0 when variant changes (size or color)
    useEffect(() => {
        setSelectedImage(0);
        setIsManualImageSelection(false); // Reset manual selection when variant changes
    }, [selectedSize, selectedColor]);

    const fetchProduct = async () => {
        try {
            setLoading(true);
            const data = await productAPI.getProductBySlug(productSlug);

            if (data.success) {
                setProduct(data.data);
                // Set default size and color if available
                if (data.data.variants && data.data.variants.length > 0) {
                    // Find first stock in variant (stockQuantity > 0 and stockStatus !== 'out_of_stock')
                    const stockInVariant = data.data.variants.find(variant =>
                        variant.stockQuantity > 0 && variant.stockStatus !== 'out_of_stock'
                    );

                    // Use stock in variant if available, otherwise use first variant
                    const defaultVariant = stockInVariant || data.data.variants[0];

                    const sizeAttr = defaultVariant.attributes.find(attr => attr.name === 'Size');
                    const colorAttr = defaultVariant.attributes.find(attr => attr.name === 'Color');

                    // Size is optional - set it if available
                    if (sizeAttr) {
                        setSelectedSize(sizeAttr.value);
                    } else {
                        setSelectedSize(""); // No size for this variant
                    }

                    // Color is optional - set if variant has color
                    if (colorAttr) {
                        setSelectedColor(colorAttr.value);
                    } else {
                        setSelectedColor(""); // No color for this variant
                    }

                    // Auto-select default variant (stock in if available, otherwise first variant)
                    setSelectedVariantSku(defaultVariant.sku || defaultVariant._id);
                    setHasManuallySelectedVariant(true);
                } else {
                    // If no variants, set default values
                    setSelectedSize("");
                    setSelectedColor(""); // No color by default
                    setHasManuallySelectedVariant(false);
                }
            } else {
                setProduct(null);
            }
        } catch (error) {
            // console.error('Error fetching product:', error);
            setProduct(null);
        } finally {
            setLoading(false);
        }
    };



    // Get unique sizes from variants (mandatory)
    const getUniqueSizes = () => {
        if (!product?.variants) return [];
        const sizes = product.variants
            .map(variant => variant.attributes.find(attr => attr.name === 'Size'))
            .filter(size => size)
            .map(size => size.value);
        return [...new Set(sizes)];
    };

    // Get unique colors from variants (optional - only if variants have color)
    const getUniqueColors = () => {
        if (!product?.variants) return [];
        const colors = product.variants
            .map(variant => variant.attributes.find(attr => attr.name === 'Color'))
            .filter(color => color) // Only include variants that have color
            .map(color => ({ value: color.value, hexCode: color.hexCode }));
        return colors.filter((color, index, self) =>
            index === self.findIndex(c => c.value === color.value)
        );
    };

    // Get available colors for selected size (size is optional now)
    const getAvailableColorsForSize = (size) => {
        if (!product?.variants) return [];

        // If size is provided, filter by size
        if (size) {
            return product.variants
                .filter(variant => {
                    const sizeAttr = variant.attributes.find(attr => attr.name === 'Size');
                    return sizeAttr && sizeAttr.value === size;
                })
                .map(variant => {
                    const colorAttr = variant.attributes.find(attr => attr.name === 'Color');
                    return colorAttr ? { value: colorAttr.value, hexCode: colorAttr.hexCode } : null;
                })
                .filter(color => color); // Only include variants that have color
        } else {
            // If no size selected, show all colors from variants that don't have size
            return product.variants
                .filter(variant => {
                    const sizeAttr = variant.attributes.find(attr => attr.name === 'Size');
                    return !sizeAttr; // Only variants without size
                })
                .map(variant => {
                    const colorAttr = variant.attributes.find(attr => attr.name === 'Color');
                    return colorAttr ? { value: colorAttr.value, hexCode: colorAttr.hexCode } : null;
                })
                .filter(color => color) // Only include variants that have color
                .filter((color, index, self) =>
                    index === self.findIndex(c => c.value === color.value)
                ); // Remove duplicates
        }
    };

    // Get selected variant (size optional, color optional)
    const getSelectedVariant = () => {
        if (!product?.variants) return null;

        // First try to find by SKU (most reliable)
        if (selectedVariantSku) {
            const variantBySku = product.variants.find(variant =>
                (variant.sku || variant._id) === selectedVariantSku
            );

            if (variantBySku) return variantBySku;
        }

        // Fallback to size/color matching if SKU not found
        return product.variants.find(variant => {
            const sizeAttr = variant.attributes.find(attr => attr.name === 'Size');
            const colorAttr = variant.attributes.find(attr => attr.name === 'Color');

            // Size matching logic (optional):
            // 1. If we have selectedSize and variant has size, both must match
            // 2. If we have no selectedSize and variant has no size, it matches
            // 3. If we have selectedSize but variant has no size, it doesn't match
            // 4. If we have no selectedSize but variant has size, it doesn't match
            let sizeMatches = true;
            if (selectedSize && sizeAttr) {
                sizeMatches = sizeAttr.value === selectedSize;
            } else if (selectedSize && !sizeAttr) {
                sizeMatches = false; // We have selected size but variant has no size
            } else if (!selectedSize && sizeAttr) {
                sizeMatches = false; // Variant has size but we don't have selected size
            }
            // If both selectedSize and variant size are null/empty, sizeMatches remains true

            // Color matching logic:
            // 1. If variant has color and we have selectedColor, both must match
            // 2. If variant has no color and we have no selectedColor, it matches
            // 3. If variant has color but we have no selectedColor, it doesn't match
            // 4. If variant has no color but we have selectedColor, it doesn't match
            let colorMatches = true;
            if (colorAttr && selectedColor) {
                colorMatches = colorAttr.value === selectedColor;
            } else if (colorAttr && !selectedColor) {
                colorMatches = false; // Variant has color but we don't have selected color
            } else if (!colorAttr && selectedColor) {
                colorMatches = false; // We have selected color but variant has no color
            }
            // If both variant and selectedColor are null/empty, colorMatches remains true

            return sizeMatches && colorMatches;
        });
    };

    const selectedVariant = getSelectedVariant();
    const uniqueSizes = getUniqueSizes();
    const uniqueColors = getUniqueColors();
    const availableColors = getAvailableColorsForSize(selectedSize);

    const handleQuantityChange = (type) => {
        if (type === 'increase') {
            setQuantity(prev => prev + 1);
        } else if (type === 'decrease' && quantity > 1) {
            setQuantity(prev => prev - 1);
        }
    };

    const handleSizeChange = (size) => {
        setSelectedSize(size);
        setHasManuallySelectedVariant(true); // User manually selected variant
        // Reset color when size changes - get available variants for new size
        const variantsForSize = getAvailableVariantsForSize(size);
        if (variantsForSize.length > 0) {
            // Find first stock in variant for this size
            const stockInVariant = variantsForSize.find(variant =>
                variant.stockQuantity > 0 && variant.stockStatus !== 'out_of_stock'
            );

            // Use stock in variant if available, otherwise use first variant
            const defaultVariant = stockInVariant || variantsForSize[0];

            const colorAttr = defaultVariant.attributes.find(attr => attr.name === 'Color');
            if (colorAttr) {
                setSelectedColor(colorAttr.value);
            } else {
                setSelectedColor("");
            }
            // Set SKU for default variant (stock in if available, otherwise first variant)
            setSelectedVariantSku(defaultVariant.sku || defaultVariant._id);
        } else {
            // If no variants available for this size, clear selected color and SKU
            setSelectedColor("");
            setSelectedVariantSku(null);
        }
    };

    // Commented out - now using variant image selection instead
    // const handleColorChange = (color) => {
    //     setSelectedColor(color);
    //     setHasManuallySelectedVariant(true); // User manually selected variant
    // };

    // Handle variant image selection (replaces color selection)
    const handleVariantImageChange = (variant) => {
        // Set size if variant has size, otherwise clear it
        const sizeAttr = variant.attributes.find(attr => attr.name === 'Size');
        if (sizeAttr) {
            setSelectedSize(sizeAttr.value);
        } else {
            // If variant has no size, clear selectedSize to match variants without size
            setSelectedSize("");
        }

        // Set color if variant has color, otherwise clear it
        const colorAttr = variant.attributes.find(attr => attr.name === 'Color');
        if (colorAttr) {
            setSelectedColor(colorAttr.value);
        } else {
            // If variant has no color, clear selectedColor to match variants without color
            setSelectedColor("");
        }

        // Store the selected variant SKU to uniquely identify it
        setSelectedVariantSku(variant.sku || variant._id);

        setHasManuallySelectedVariant(true);
    };

    // Get available variants for selected size (to show variant images)
    const getAvailableVariantsForSize = (size) => {
        if (!product?.variants) return [];

        if (size) {
            // Filter variants by selected size
            return product.variants.filter(variant => {
                const sizeAttr = variant.attributes.find(attr => attr.name === 'Size');
                return sizeAttr && sizeAttr.value === size;
            });
        } else {
            // If no size selected, show all variants (both with and without size)
            // This allows user to choose variant even when size is not available
            return product.variants;
        }
    };

    const handleAddToCart = () => {
        if (!product) {
            toast.error('Product not available');
            return;
        }

        // Create selected variant object
        const selectedVariantData = selectedVariant ? {
            size: selectedSize,
            color: selectedColor,
            currentPrice: selectedVariant.currentPrice,
            originalPrice: selectedVariant.originalPrice,
            hexCode: selectedVariant.attributes.find(attr => attr.name === 'Color')?.hexCode,
            sku: selectedVariant.sku,
            stockQuantity: selectedVariant.stockQuantity,
            stockStatus: selectedVariant.stockStatus
        } : null;

        // Add to cart using context
        addToCart(product, selectedVariantData, quantity);
    };

    const handleBuyNow = () => {
        if (!product) {
            toast.error('Product not available');
            return;
        }

        // Create selected variant object
        const selectedVariantData = selectedVariant ? {
            size: selectedSize,
            color: selectedColor,
            currentPrice: selectedVariant.currentPrice,
            originalPrice: selectedVariant.originalPrice,
            hexCode: selectedVariant.attributes.find(attr => attr.name === 'Color')?.hexCode,
            sku: selectedVariant.sku,
            stockQuantity: selectedVariant.stockQuantity,
            stockStatus: selectedVariant.stockStatus
        } : null;

        // Add to cart using context
        addToCart(product, selectedVariantData, quantity);

        // Navigate to checkout page
        router.push('/checkout');
    };

    const handleWishlistToggle = () => {
        if (!product) return;

        if (isWishlisted) {
            removeFromWishlist(product._id);
            setIsWishlisted(false);
        } else {
            // Ensure product has the required fields for wishlist
            const productForWishlist = {
                ...product,
                price: product.variants?.[0]?.currentPrice || product.basePrice || 0,
                category: product.category?.name || product.category || 'Other'
            };
            addProductToWishlist(productForWishlist, addToWishlist);
            setIsWishlisted(true);
        }
    };

    // Custom magnify functions
    const handleMouseEnter = () => {
        setShowMagnify(true);
    };

    const handleMouseLeave = () => {
        setShowMagnify(false);
    };

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Calculate percentage position
        const xPercent = (x / rect.width) * 100;
        const yPercent = (y / rect.height) * 100;

        setMagnifyPosition({ x: xPercent, y: yPercent });
    };

    // Calculate price from selected variant
    const getCurrentPrice = () => {
        if (selectedVariant) {
            return selectedVariant.currentPrice;
        }
        return product?.variants?.[0]?.currentPrice || product?.basePrice || 0;
    };

    const getOriginalPrice = () => {
        if (selectedVariant) {
            return selectedVariant.originalPrice;
        }
        return product?.variants?.[0]?.originalPrice || null;
    };

    const currentPrice = getCurrentPrice();
    const originalPrice = getOriginalPrice();
    const discount = originalPrice ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0;

    // Get default product images (featured + gallery) - always used for gallery slider
    const getDefaultImages = () => {
        if (!product) return [];

        const images = [];

        // Add featured image first (if exists)
        if (product.featuredImage) {
            images.push({
                url: product.featuredImage,
                altText: product.title,
                isFeatured: true
            });
        }

        // Add gallery images
        if (product.gallery && product.gallery.length > 0) {
            images.push(...product.gallery);
        }

        return images;
    };

    // Get preview images - variant images only if user manually selected variant, else default
    const getPreviewImages = () => {
        if (!product) return [];

        // If user manually selected an image from gallery, use default images
        if (isManualImageSelection) {
            return getDefaultImages();
        }

        // Only show variant images if user has manually selected a variant
        // On page load, even if variant is auto-selected, show default images
        if (hasManuallySelectedVariant && selectedVariant && selectedVariant.images && selectedVariant.images.length > 0) {
            // Return variant images
            return selectedVariant.images.map(img => ({
                url: img.url,
                altText: img.altText || product.title,
                isFeatured: img.isPrimary || false
            }));
        }

        // Fallback to default product images (featured + gallery)
        return getDefaultImages();
    };

    // Get display image based on selected index (for preview)
    const getDisplayImage = (index) => {
        if (!product) return '/images/placeholder.png';

        const previewImages = getPreviewImages();
        if (previewImages.length > 0 && index < previewImages.length) {
            return previewImages[index].url;
        }
        return '/images/placeholder.png';
    };

    // Get total number of images for gallery slider (always default images)
    const totalImages = product ? getDefaultImages().length : 0;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
            </div>
        );
    }

    if (!product) {
        return <ProductNotFound />;
    }

    return (
        <div className="min-h-screen px-4 lg:px-4 py-4">
            <div className="max-w-screen-2xl  mx-auto">
                {/* Breadcrumb */}
                <div className="mb-6">
                    <nav className="flex text-sm text-gray-500">
                        <a href="#" className="hover:text-pink-500">Home</a>
                        <span className="mx-2">/</span>
                        <a href="#" className="hover:text-pink-500">Products</a>
                        <span className="mx-2">/</span>
                        <span className="text-gray-900">{product.title}</span>
                    </nav>
                </div>

                <div className="flex flex-col lg:flex-row gap-12 mb-12">
                    {/* Product Images - Left Panel */}
                    <div className="space-y-4 lg:w-[45%]">
                        {/* Main Image Container with space for magnify */}
                        <div className="relative">
                            <div className="aspect-square bg-[#FEF2F4] rounded border border-[#E7E7E7] p-2">
                                <div
                                    className="relative w-full h-full cursor-crosshair"
                                    onMouseEnter={handleMouseEnter}
                                    onMouseLeave={handleMouseLeave}
                                    onMouseMove={handleMouseMove}
                                >
                                    <img
                                        src={getDisplayImage(selectedImage)}
                                        alt={product.title}
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                            </div>

                            {/* Magnified Preview - Positioned outside on right */}
                            {showMagnify && (
                                <div
                                    className="hidden lg:block absolute bg-white border-2 border-gray-300 rounded-lg overflow-hidden shadow-2xl pointer-events-none"
                                    style={{
                                        left: 'calc(100% + 20px)',
                                        top: '0',
                                        width: '100%',
                                        height: '100%',
                                        zIndex: 40
                                    }}
                                >
                                    <div
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            backgroundImage: `url(${getDisplayImage(selectedImage)})`,
                                            backgroundSize: '200%',
                                            backgroundPosition: `${magnifyPosition.x}% ${magnifyPosition.y}%`,
                                            backgroundRepeat: 'no-repeat',
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Thumbnail Images Slider */}
                        <div className="relative">
                            <Swiper
                                modules={[Navigation, Pagination]}
                                spaceBetween={12}
                                slidesPerView={4}
                                loop={totalImages > 4}
                                navigation={totalImages > 4 ? {
                                    nextEl: '.swiper-button-next-custom',
                                    prevEl: '.swiper-button-prev-custom',
                                } : false}
                                pagination={totalImages > 1 ? {
                                    clickable: true,
                                    el: '.swiper-pagination-custom',
                                } : false}
                                className="thumbnail-swiper"
                            >
                                {product && totalImages > 0 ? (
                                    getDefaultImages()?.map((image, index) => {
                                        // Highlight if: manually selected and index matches, OR showing default images and index matches
                                        const isShowingDefaultImages = isManualImageSelection ||
                                            !selectedVariant ||
                                            !selectedVariant.images ||
                                            selectedVariant.images.length === 0;
                                        const isCurrentlyShown = isShowingDefaultImages && selectedImage === index;

                                        return (
                                            <SwiperSlide key={index}>
                                                <button
                                                    onClick={() => {
                                                        setIsManualImageSelection(true);
                                                        setSelectedImage(index);
                                                    }}
                                                    className={`aspect-square bg-white rounded-lg overflow-hidden border-2 transition-all cursor-pointer w-full ${isCurrentlyShown
                                                        ? 'border-pink-500'
                                                        : 'border-gray-200 hover:border-pink-300'
                                                        }`}
                                                >
                                                    <img
                                                        src={image.url}
                                                        alt={image.altText || `${product.title} ${index + 1}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </button>
                                            </SwiperSlide>
                                        );
                                    })
                                ) : (
                                    <SwiperSlide>
                                        <div className="aspect-square bg-white rounded-lg overflow-hidden border-2 border-gray-200">
                                            <img
                                                src="/images/placeholder.png"
                                                alt={product?.title || 'Product'}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    </SwiperSlide>
                                )}
                            </Swiper>

                            {/* Custom Navigation Buttons */}
                            {totalImages > 4 && (
                                <>
                                    <button
                                        className="swiper-button-prev-custom absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors border border-gray-200"
                                        aria-label="Previous image"
                                    >
                                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <button
                                        className="swiper-button-next-custom absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors border border-gray-200"
                                        aria-label="Next image"
                                    >
                                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </>
                            )}

                            {/* Pagination Dots */}
                            {totalImages > 1 && (
                                <div className="swiper-pagination-custom flex justify-center items-center mt-4 gap-1.5"></div>
                            )}
                        </div>
                    </div>

                    {/* Product Info - Right Panel */}
                    <div className="lg:w-[55%]  flex flex-col lg:flex-row justify-between gap-8">
                        {/* Left Part - Product Details */}
                        <div className="space-y-3 lg:flex-1">
                            {/* Product Title */}
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                                {product.title}
                            </h1>

                            {/* Reviews Count - Above Price */}
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className="w-5 h-5 fill-yellow-400 text-yellow-400"
                                        />
                                    ))}
                                </div>
                                <span className="text-red-500 font-medium">{product.totalReviews || 0} Reviews</span>
                            </div>

                            {/* Price */}
                            <div className="flex items-center gap-3 ">
                                <span className="text-3xl font-bold text-pink-600">
                                    ৳{currentPrice}
                                </span>
                                {originalPrice && (
                                    <span className="text-xl text-gray-500 line-through">
                                        ৳{originalPrice}
                                    </span>
                                )}
                            </div>

                            {/* Quantity */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">Quantity</label>
                                <div className="flex items-center border border-gray-300 rounded-lg w-fit">
                                    <button
                                        onClick={() => handleQuantityChange('decrease')}
                                        className="p-3 cursor-pointer transition-colors"
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>
                                    <span className="px-4 py-2 font-semibold">{quantity}</span>
                                    <button
                                        onClick={() => handleQuantityChange('increase')}
                                        className="p-3 cursor-pointer transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Size and Variant Image Selectors */}
                            <div className="flex flex-col gap-4">
                                {/* Size Selector */}
                                {uniqueSizes.length > 0 && (
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">Select Size</label>
                                        <div className="flex gap-2">
                                            {uniqueSizes.map((size) => {
                                                const isSingleChar = size.length === 1;

                                                return (
                                                    <button
                                                        key={size}
                                                        onClick={() => handleSizeChange(size)}
                                                        className={`rounded-md border-2 transition-all duration-200 flex items-center justify-center font-medium cursor-pointer
        ${selectedSize === size
                                                                ? 'bg-pink-500 text-white border-pink-500 shadow-sm'
                                                                : 'border-gray-300 text-gray-700 hover:border-pink-400 hover:bg-pink-50'
                                                            }
        ${isSingleChar ? 'w-10 h-10 text-base md:text-lg' : 'px-3 py-2 text-sm'}
      `}
                                                    >
                                                        {size}
                                                    </button>
                                                );
                                            })}

                                        </div>
                                    </div>
                                )}

                                {/* Variant Image Selector - Show variant images instead of color selector */}
                                {(() => {
                                    const variantsToShow = getAvailableVariantsForSize(selectedSize);

                                    return variantsToShow.length > 0 && (
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700">Select Variant</label>
                                            <div className="flex flex-wrap gap-2">
                                                {variantsToShow.map((variant) => {
                                                    const sizeAttr = variant.attributes.find(attr => attr.name === 'Size');
                                                    const colorAttr = variant.attributes.find(attr => attr.name === 'Color');

                                                    // Check if this exact variant is selected by comparing SKU
                                                    const variantSku = variant.sku || variant._id;
                                                    const isSelected = selectedVariantSku && variantSku === selectedVariantSku;

                                                    // Get variant image from images array (first image) or fallback to featured image
                                                    const variantImage = variant.images && variant.images.length > 0
                                                        ? (variant.images[0]?.url || variant.images[0])
                                                        : (variant.image || product?.featuredImage);

                                                    // Build title with variant info
                                                    const variantTitle = [
                                                        sizeAttr?.value,
                                                        colorAttr?.value
                                                    ].filter(Boolean).join(' - ') || 'Variant';

                                                    return (
                                                        <button
                                                            key={variant.sku || variant._id}
                                                            onClick={() => handleVariantImageChange(variant)}
                                                            className={`w-12 h-12 rounded-md border-2 transition-all duration-200 flex items-center justify-center cursor-pointer overflow-hidden ${isSelected
                                                                ? 'border-pink-500 ring-2 ring-pink-200 shadow-sm'
                                                                : 'border-gray-300 hover:border-pink-400 hover:shadow-sm'
                                                                }`}
                                                            title={variantTitle}
                                                        >
                                                            {variantImage ? (
                                                                <img
                                                                    src={variantImage}
                                                                    alt={variantTitle}
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => {
                                                                        e.target.src = product?.featuredImage || '/images/placeholder.png';
                                                                    }}
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                                                                    {sizeAttr?.value || colorAttr?.value || 'V'}
                                                                </div>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Color Selector - Commented out, now using variant images instead */}
                                {/* {(() => {
                                    // Use availableColors if we have a selected size, otherwise show all unique colors (for variants without size)
                                    const colorsToShow = availableColors.length > 0
                                        ? availableColors
                                        : (!selectedSize && uniqueColors.length > 0 ? uniqueColors : []);

                                    return colorsToShow.length > 0 && (
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700">Select Color</label>
                                            <div className="flex gap-2">
                                                {colorsToShow.map((color) => (
                                                    <button
                                                        key={color.value}
                                                        onClick={() => handleColorChange(color.value)}
                                                        className={`w-8 h-8 rounded-full border-2 transition-all duration-200 flex items-center justify-center cursor-pointer ${selectedColor === color.value
                                                            ? 'border-pink-500 ring-2 ring-pink-200 shadow-sm'
                                                            : 'border-gray-300 hover:border-pink-400 hover:shadow-sm'
                                                            }`}
                                                        title={color.value}
                                                    >
                                                        <div
                                                            className="w-6 h-6 rounded-full"
                                                            style={{
                                                                backgroundColor: color.hexCode,
                                                                border: color.hexCode?.toLowerCase() === '#ffffff' || color.hexCode?.toLowerCase() === '#fff'
                                                                    ? '1px solid #d1d5db'
                                                                    : 'none'
                                                            }}
                                                        ></div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })()} */}
                            </div>

                            {/* <div className='mb-2'>
                            <label className="block text-sm font-medium text-gray-700">Offer time</label>
                        </div>
                        <div className='flex items-center justify-between gap-4'>
                            <div className="space-y-2">
                                <CountdownTimer endDate={new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000 + 45 * 60 * 1000 + 5 * 1000)} />
                            </div>
                            <button
                                onClick={handleWishlistToggle}
                                className={`p-3 rounded-lg border transition-colors ${isWishlisted
                                    ? 'bg-pink-500 text-white border-pink-500'
                                    : 'border-gray-300 text-gray-600 hover:border-pink-300 hover:text-pink-500'
                                    }`}
                                aria-label={isWishlisted ? `Remove ${product?.title} from wishlist` : `Add ${product?.title} to wishlist`}
                            >
                                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                            </button>
                        </div> */}

                            {/* Action Buttons */}
                            <div className="flex gap-3 flex-col">
                                {/* Check if variant is out of stock */}
                                {selectedVariant && selectedVariant.stockQuantity <= 0 ? (
                                    <button
                                        disabled
                                        className="flex-1 bg-gray-300 text-gray-500 py-3 px-1 lg:px-6 rounded-lg cursor-not-allowed font-semibold border-[1.5px] border-gray-300 flex items-center justify-center gap-2"
                                    >
                                        <ShoppingCart className="w-5 h-5" />
                                        Out of Stock
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleAddToCart}
                                        className="add-to-cart-btn flex-1 bg-white text-[#EF3D6A] py-3 px-1 lg:px-6 rounded-lg cursor-pointer font-semibold border-[1.5px] border-[#EF3D6A] flex items-center justify-center gap-2 relative overflow-hidden"
                                        aria-label={`Add ${product?.title} to cart`}
                                    >
                                        <ShoppingCart className="w-5 h-5 relative z-10" />
                                        <span className="relative z-10">Add to cart</span>
                                    </button>
                                )}

                                {/* Check if variant is out of stock for Buy Now */}
                                {selectedVariant && selectedVariant.stockQuantity <= 0 ? (
                                    <button
                                        disabled
                                        className="flex-1 rounded-lg bg-gray-300 text-gray-500 py-3 px-1 lg:px-6 cursor-not-allowed font-semibold"
                                    >
                                        Out of Stock
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleBuyNow}
                                        className="buy-now-btn flex-1 rounded-lg bg-[#EF3D6A] border-[1.5px] border-[#EF3D6A] text-white py-3 px-1 lg:px-6 cursor-pointer font-semibold relative overflow-hidden"
                                        aria-label={`Buy ${product?.title} now`}
                                    >
                                        <span className="relative z-10">Buy Now</span>
                                    </button>
                                )}
                            </div>
                            {product?.announcementText && (
                                <div className='border-t border-[#E7E7E7] mt-4 pt-4'>
                                    <p className="text-base font-semibold text-pink-600 bg-pink-50 p-3 rounded-lg border border-pink-100">
                                        {product.announcementText}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Right Part - Delivery Options */}
                        <div className="">
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-6">Delivery Options</h3>

                                <div className="space-y-4">
                                    {/* Inside Dhaka */}
                                    <div className="flex items-center gap-4">
                                        <div className="">
                                            <Package className="w-5 h-5 text-pink-600" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-medium text-gray-900">Inside Dhaka</h4>
                                            <p className="text-sm text-gray-500 mt-1">Delivery within 1 days</p>
                                        </div>
                                    </div>

                                    {/* Outside Dhaka */}
                                    <div className="flex items-center gap-4">
                                        <div className="">
                                            <Package className="w-5 h-5 text-pink-600" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-medium text-gray-900">Outside Dhaka</h4>
                                            <p className="text-sm text-gray-500 mt-1">Delivery within 2-3 days</p>
                                        </div>
                                    </div>

                                    {/* Express */}
                                    <div className="flex items-center gap-4">
                                        <div className="">
                                            <Package className="w-5 h-5 text-pink-600" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-medium text-gray-900">Express</h4>
                                            <p className="text-sm text-gray-500 mt-1">Delivery within 24 hours</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
                <div>
                    {/* Collapsible Accordion */}
                    <div className="space-y-4">
                        {/* Description Accordion */}
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <button
                                onClick={() => setOpenAccordion(prev => ({ ...prev, description: !prev.description }))}
                                className="w-full flex items-center justify-between px-6 py-4 bg-white hover:bg-pink-100 transition-colors cursor-pointer"
                            >
                                <span className="text-lg font-semibold text-gray-900">Description</span>
                                {openAccordion.description ? (
                                    <ChevronUp className="w-5 h-5 text-gray-500" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-gray-500" />
                                )}
                            </button>
                            {openAccordion.description && (
                                <div className="px-6 py-4 bg-white border-t border-gray-200">
                                    <div className="prose max-w-none">
                                        <div className="text-gray-600 leading-relaxed">
                                            {product.description ? (
                                                <>
                                                    <div
                                                        className="transition-all duration-300"
                                                        dangerouslySetInnerHTML={{ __html: product.description.replace(/\n/g, '<br/>') }}
                                                    />
                                                    {/* Show More/Less functionality commented out */}
                                                    {/* <button
                                                        onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                                        className="mt-4 flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors text-sm font-semibold cursor-pointer"
                                                    >
                                                        {isDescriptionExpanded ? (
                                                            <>
                                                                Show Less
                                                                <ChevronUp className="w-4 h-4" />
                                                            </>
                                                        ) : (
                                                            <>
                                                                Show More
                                                                <ChevronDown className="w-4 h-4" />
                                                            </>
                                                        )}
                                                    </button> */}
                                                </>
                                            ) : (
                                                <p>{product.shortDescription || 'No detailed description available for this product.'}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Additional Information Accordion */}
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <button
                                onClick={() => setOpenAccordion(prev => ({ ...prev, additional: !prev.additional }))}
                                className="w-full flex items-center justify-between px-6 py-4 bg-white hover:bg-pink-100 transition-colors cursor-pointer"
                            >
                                <span className="text-lg font-semibold text-gray-900">Additional Information</span>
                                {openAccordion.additional ? (
                                    <ChevronUp className="w-5 h-5 text-gray-500" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-gray-500" />
                                )}
                            </button>
                            {openAccordion.additional && (
                                <div className="px-6 py-6 bg-white border-t border-gray-200">
                                    <div className="space-y-8">
                                        {/* Product Information Cards */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {/* Brand Card */}
                                            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                                                        <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                                        </svg>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Brand</p>
                                                        <p className="text-sm font-semibold text-gray-900 truncate">{product.brand || 'ForPink'}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* SKU Card */}
                                            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                                        </svg>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">SKU</p>
                                                        <p className="text-sm font-semibold text-gray-900 truncate font-mono">{selectedVariant?.sku || product.slug || 'FP-RING-001'}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Stock Status Card */}
                                            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${selectedVariant?.stockStatus === 'in_stock' ? 'bg-green-100' :
                                                        selectedVariant?.stockStatus === 'out_of_stock' ? 'bg-red-100' :
                                                            selectedVariant?.stockStatus === 'low_stock' ? 'bg-yellow-100' :
                                                                'bg-blue-100'
                                                        }`}>
                                                        <svg className={`w-5 h-5 ${selectedVariant?.stockStatus === 'in_stock' ? 'text-green-600' :
                                                            selectedVariant?.stockStatus === 'out_of_stock' ? 'text-red-600' :
                                                                selectedVariant?.stockStatus === 'low_stock' ? 'text-yellow-600' :
                                                                    'text-blue-600'
                                                            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                        </svg>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Stock Status</p>
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${selectedVariant?.stockStatus === 'in_stock' ? 'bg-green-100 text-green-800' :
                                                            selectedVariant?.stockStatus === 'out_of_stock' ? 'bg-red-100 text-red-800' :
                                                                selectedVariant?.stockStatus === 'low_stock' ? 'bg-yellow-100 text-yellow-800' :
                                                                    'bg-blue-100 text-blue-800'
                                                            }`}>
                                                            {selectedVariant?.stockStatus === 'in_stock' ? 'In Stock' :
                                                                selectedVariant?.stockStatus === 'out_of_stock' ? 'Out of Stock' :
                                                                    selectedVariant?.stockStatus === 'low_stock' ? 'Low Stock' :
                                                                        selectedVariant?.stockStatus === 'pre_order' ? 'Pre Order' : 'In Stock'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Stock Quantity Card */}
                                            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                                        <Package className="w-5 h-5 text-purple-600" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Stock Quantity</p>
                                                        <p className="text-sm font-semibold text-gray-900">{selectedVariant?.stockQuantity || product.totalStock || 0} units</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Specifications Section */}
                                        {product.specifications && product.specifications.length > 0 && (
                                            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                                                <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                    <svg className="w-4 h-4 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    Specifications
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {product.specifications.map((spec, index) => (
                                                        <div key={index} className="bg-white rounded-lg p-3 border border-gray-200 hover:border-pink-300 transition-colors">
                                                            <div className="flex items-start justify-between gap-3">
                                                                <span className="text-sm font-medium text-gray-600 flex-1">{spec.key}</span>
                                                                <span className="text-sm font-semibold text-gray-900 text-right flex-1">{spec.value}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Delivery & Return Accordion */}
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <button
                                onClick={() => setOpenAccordion(prev => ({ ...prev, delivery: !prev.delivery }))}
                                className="w-full flex items-center justify-between px-6 py-4 bg-white hover:bg-pink-100 transition-colors cursor-pointer"
                            >
                                <span className="text-lg font-semibold text-gray-900">Delivery & Return</span>
                                {openAccordion.delivery ? (
                                    <ChevronUp className="w-5 h-5 text-gray-500" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-gray-500" />
                                )}
                            </button>
                            {openAccordion.delivery && (
                                <div className="px-6 py-6 bg-white border-t border-gray-200">
                                    <div className="space-y-8">
                                        {/* Delivery Information Card */}
                                        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                                            <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                <svg className="w-4 h-4 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                                </svg>
                                                Delivery Information
                                            </h4>
                                            <div className="space-y-4">
                                                <div className="bg-white rounded-lg p-4 border border-gray-200">
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Delivery Time</p>
                                                            <p className="text-sm text-gray-900">3-5 business days from order confirmation</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Dynamic Delivery Charges */}
                                                <div className="bg-white rounded-lg p-4 border border-gray-200">
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Delivery Charges</p>
                                                            {deliverySettingsLoading ? (
                                                                <p className="text-sm text-gray-600">Loading...</p>
                                                            ) : deliveryChargeSettings ? (
                                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                                    <div className="flex flex-col items-center justify-center py-3 px-3 bg-gray-50 rounded-lg border border-gray-200">
                                                                        <span className="text-xs font-medium text-gray-500 mb-1">Inside Dhaka</span>
                                                                        <span className="text-base font-semibold text-gray-900">৳{deliveryChargeSettings.insideDhaka}</span>
                                                                    </div>
                                                                    <div className="flex flex-col items-center justify-center py-3 px-3 bg-gray-50 rounded-lg border border-gray-200">
                                                                        <span className="text-xs font-medium text-gray-500 mb-1">Sub Dhaka</span>
                                                                        <span className="text-base font-semibold text-gray-900">৳{deliveryChargeSettings.subDhaka}</span>
                                                                    </div>
                                                                    <div className="flex flex-col items-center justify-center py-3 px-3 bg-gray-50 rounded-lg border border-gray-200">
                                                                        <span className="text-xs font-medium text-gray-500 mb-1">Outside Dhaka</span>
                                                                        <span className="text-base font-semibold text-gray-900">৳{deliveryChargeSettings.outsideDhaka}</span>
                                                                    </div>
                                                                    <div className="flex flex-col items-center justify-center py-3 px-3 bg-pink-50 rounded-lg border border-pink-200">
                                                                        <span className="text-xs font-medium text-pink-700 mb-1">Free Delivery</span>
                                                                        <span className="text-sm font-semibold text-pink-900 text-center">Above ৳{deliveryChargeSettings.shippingFreeRequiredAmount}</span>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <p className="text-sm text-gray-900">Must be paid upfront with order</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-white rounded-lg p-4 border border-gray-200">
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Tracking</p>
                                                            <p className="text-sm text-gray-900">You will receive tracking information via SMS/Email</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-white rounded-lg p-4 border border-gray-200">
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                            <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Delivery Areas</p>
                                                            <p className="text-sm text-gray-900">We deliver across Bangladesh</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {(product.shippingInfo?.weight || product.shippingInfo?.dimensions) && (
                                                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                                                        <div className="flex items-start gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                                <Package className="w-4 h-4 text-gray-600" />
                                                            </div>
                                                            <div className="flex-1 space-y-2">
                                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Product Details</p>
                                                                {product.shippingInfo?.weight && (
                                                                    <div className="flex items-center justify-between py-1">
                                                                        <span className="text-sm text-gray-600">Weight</span>
                                                                        <span className="text-sm font-semibold text-gray-900">{product.shippingInfo.weight}g</span>
                                                                    </div>
                                                                )}
                                                                {product.shippingInfo?.dimensions && (
                                                                    <div className="flex items-center justify-between py-1">
                                                                        <span className="text-sm text-gray-600">Dimensions</span>
                                                                        <span className="text-sm font-semibold text-gray-900">{product.shippingInfo.dimensions.length}cm × {product.shippingInfo.dimensions.width}cm × {product.shippingInfo.dimensions.height}cm</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Return Policy */}
                                        {(product.returnPolicy || product.additionalInfo) && (
                                            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                                                <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                    <svg className="w-4 h-4 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                    </svg>
                                                    Return Policy
                                                </h4>
                                                <div className="bg-white rounded-lg p-4 border border-gray-200">
                                                    <div className="text-sm text-gray-600">
                                                        {product.returnPolicy ? (
                                                            <div dangerouslySetInnerHTML={{ __html: product.returnPolicy.replace(/\n/g, '<br/>') }} />
                                                        ) : (
                                                            <p>We accept returns within 7 days of delivery. Items must be unused and in original packaging.</p>
                                                        )}
                                                        {product.additionalInfo && (
                                                            <div className="mt-3 pt-3 border-t border-gray-200">
                                                                <div dangerouslySetInnerHTML={{ __html: product.additionalInfo.replace(/\n/g, '<br/>') }} />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Warranty Information */}
                                        {product.warrantyInfo && (
                                            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                                                <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                    <svg className="w-4 h-4 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                                    </svg>
                                                    Warranty Information
                                                </h4>
                                                <div className="bg-white rounded-lg p-4 border border-gray-200">
                                                    <div className="text-sm text-gray-600">
                                                        <div dangerouslySetInnerHTML={{ __html: product.warrantyInfo.replace(/\n/g, '<br/>') }} />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>



                {/* Upsell Products */}
                <UpsellProducts
                    currentProductId={product?._id}
                />

                {/* Similar Products */}
                <SimilarProducts
                    currentProductId={product?._id}
                    currentProductCategory={product?.category?._id}
                />
            </div>

            <style jsx global>{`
                .thumbnail-swiper {
                    padding: 0;
                }
                .swiper-button-next-custom,
                .swiper-button-prev-custom {
                    display: flex !important;
                    cursor: pointer !important;
                    transition: all 0.1s ease !important;
                }
                .swiper-button-next-custom:hover:not(.swiper-button-disabled),
                .swiper-button-prev-custom:hover:not(.swiper-button-disabled) {
                    border-color: #ef3d6a !important;
                    border-width: 2px !important;
                }
                .swiper-button-next-custom.swiper-button-disabled,
                .swiper-button-prev-custom.swiper-button-disabled {
                    opacity: 0.35;
                    cursor: not-allowed !important;
                    pointer-events: none;
                }
                .swiper-pagination-custom {
                    position: relative;
                    margin-top: 16px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                .swiper-pagination-custom .swiper-pagination-bullet,
                .swiper-pagination-custom.swiper-pagination-bullet {
                    width: 8px !important;
                    height: 8px !important;
                    background: #9ca3af !important;
                    opacity: 1 !important;
                    margin: 0 4px !important;
                    border-radius: 50% !important;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    border: 1px solid #e5e7eb !important;
                }
                .swiper-pagination-custom .swiper-pagination-bullet:hover,
                .swiper-pagination-custom.swiper-pagination-bullet:hover {
                    background: #6b7280 !important;
                    border-color: #d1d5db !important;
                }
                .swiper-pagination-custom .swiper-pagination-bullet-active,
                .swiper-pagination-custom .swiper-pagination-bullet.swiper-pagination-bullet-active,
                .swiper-pagination-custom.swiper-pagination-bullet-active {
                    background: #ef3d6a !important;
                    width: 24px !important;
                    height: 8px !important;
                    border-radius: 4px !important;
                    border: 1px solid #ef3d6a !important;
                    opacity: 1 !important;
                }

                /* Add to Cart Button Animation */
                .add-to-cart-btn {
                    transition: all 0.3s ease;
                }
                .add-to-cart-btn::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: #EF3D6A;
                    transform: translateX(-100%);
                    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    z-index: 0;
                }
                .add-to-cart-btn:hover::before {
                    transform: translateX(0);
                }
                .add-to-cart-btn:hover {
                    color: white;
                    border-color: #EF3D6A;
                }
                .add-to-cart-btn:hover svg {
                    color: white;
                }

                /* Buy Now Button Animation */
                .buy-now-btn {
                    transition: all 0.3s ease;
                }
                .buy-now-btn::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: white;
                    transform: translateX(-100%);
                    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    z-index: 0;
                }
                .buy-now-btn:hover::before {
                    transform: translateX(0);
                }
                .buy-now-btn:hover {
                    color: #EF3D6A;
                    border: 1.5px solid #EF3D6A;
                }
            `}</style>
        </div>
    );
}