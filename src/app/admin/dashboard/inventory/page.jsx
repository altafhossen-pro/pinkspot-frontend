'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
    Package, 
    Search, 
    Plus, 
    X,
    RefreshCw,
    ShoppingCart,
    DollarSign,
    Calendar,
    User,
    Eye
} from 'lucide-react';
import { inventoryAPI, productAPI } from '@/services/api';
import { getCookie } from 'cookies-next';
import { useAppContext } from '@/context/AppContext';
import PermissionDenied from '@/components/Common/PermissionDenied';

const InventoryPage = () => {
    const { hasPermission, contextLoading } = useAppContext();
    const [showPurchaseForm, setShowPurchaseForm] = useState(false);
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [purchasePage, setPurchasePage] = useState(1);
    const [purchaseTotalPages, setPurchaseTotalPages] = useState(1);
    
    // Purchase form states
    const [productSearchTerm, setProductSearchTerm] = useState('');
    const [productResults, setProductResults] = useState([]);
    const [searchingProducts, setSearchingProducts] = useState(false);
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [purchaseNotes, setPurchaseNotes] = useState('');
    const [submittingPurchase, setSubmittingPurchase] = useState(false);
    
    // Product selection states (like manual orders)
    const [currentProduct, setCurrentProduct] = useState(null);
    const [selectedSize, setSelectedSize] = useState("");
    const [selectedColor, setSelectedColor] = useState("");
    const [hasManuallySelectedVariant, setHasManuallySelectedVariant] = useState(false);
    const [selectedVariantSku, setSelectedVariantSku] = useState(null);
    
    const token = getCookie('token');
    const [checkingPermission, setCheckingPermission] = useState(true);
    const [hasReadPermission, setHasReadPermission] = useState(false);
    const [hasUpdatePermission, setHasUpdatePermission] = useState(false);
    const [permissionError, setPermissionError] = useState(null);
    const [showItemsModal, setShowItemsModal] = useState(false);
    const [selectedPurchase, setSelectedPurchase] = useState(null);

    // Fetch purchases
    const fetchPurchases = async () => {
        try {
            setLoading(true);
            const response = await inventoryAPI.getPurchases({
                page: purchasePage,
                limit: 20
            }, token);
            
            if (response.success) {
                setPurchases(response.data);
                setPurchaseTotalPages(response.pagination.totalPages);
            } else {
                toast.error('Failed to fetch purchases');
            }
        } catch (error) {
            console.error('Error fetching purchases:', error);
            toast.error('Error fetching purchases');
        } finally {
            setLoading(false);
        }
    };

    // Search products (like manual orders - SKU first, then products)
    const searchProducts = async (query) => {
        if (!query.trim()) {
            setProductResults([]);
            return;
        }

        try {
            setSearchingProducts(true);
            const response = await productAPI.searchProducts(query.trim());
            
            if (response.success) {
                const products = response.data || [];

                // Check if search term matches any variant SKU exactly
                let matchingVariant = null;
                let matchingProduct = null;

                for (const product of products) {
                    if (product.variants && product.variants.length > 0) {
                        for (const variant of product.variants) {
                            if (variant.sku && variant.sku.toLowerCase() === query.trim().toLowerCase()) {
                                matchingVariant = variant;
                                matchingProduct = product;
                                break;
                            }
                        }
                        if (matchingVariant) break;
                    }
                }

                // If SKU match found, auto-add the variant
                if (matchingVariant && matchingProduct) {
                    // Check if this SKU already exists in selected products
                    const existingItemIndex = selectedProducts.findIndex(item =>
                        item.variantSku && item.variantSku === matchingVariant.sku
                    );

                    if (existingItemIndex !== -1) {
                        toast.error('This variant is already in the purchase list');
                        setProductSearchTerm('');
                        return;
                    }

                    // Add variant directly
                    const newItem = {
                        productId: matchingProduct._id,
                        product: matchingProduct,
                        variantSku: matchingVariant.sku,
                        variant: {
                            ...matchingVariant,
                            size: matchingVariant.attributes?.find(attr => attr.name === 'Size')?.value || matchingVariant.size,
                            color: matchingVariant.attributes?.find(attr => attr.name === 'Color')?.value || matchingVariant.color,
                            colorHexCode: matchingVariant.attributes?.find(attr => attr.name === 'Color')?.hexCode
                        },
                        quantity: '',
                        unitCost: matchingVariant.costPrice || '',
                        previousUnitCost: matchingVariant.costPrice || null,
                        currentStock: matchingVariant.stockQuantity || 0
                    };

                    setSelectedProducts([...selectedProducts, newItem]);
                    toast.success(`Product "${matchingProduct.title}" (SKU: ${matchingVariant.sku}) added to purchase`);
                    setProductSearchTerm('');
                    return;
                }

                // If no SKU match, show regular search results
                setProductResults(products);
            }
        } catch (error) {
            console.error('Error searching products:', error);
            toast.error('Error searching products');
        } finally {
            setSearchingProducts(false);
        }
    };

    // Debounce product search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (productSearchTerm.trim()) {
                searchProducts(productSearchTerm);
            } else {
                setProductResults([]);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [productSearchTerm]);

    // Handle product selection (like manual orders)
    const handleProductSelect = (product) => {
        setCurrentProduct(product);
        setProductSearchTerm(product.title);
        setHasManuallySelectedVariant(false);
        setSelectedVariantSku(null);
        setShowProductDropdown(false);

        // If product has variants with size, auto-select first size
        if (product.variants && product.variants.length > 0) {
            // Get unique sizes from variants
            const sizes = product.variants
                .map(variant => variant.attributes?.find(attr => attr.name === 'Size'))
                .filter(size => size)
                .map(size => size.value);
            const uniqueSizes = [...new Set(sizes)];
            
            if (uniqueSizes.length > 0) {
                // Auto-select first size if sizes exist
                const firstSize = uniqueSizes[0];
                setSelectedSize(firstSize);
                
                // Auto-select first color for this size if available
                const variantsForSize = product.variants.filter(variant => {
                    const sizeAttr = variant.attributes?.find(attr => attr.name === 'Size');
                    return sizeAttr && sizeAttr.value === firstSize;
                });
                
                if (variantsForSize.length > 0) {
                    const firstVariant = variantsForSize[0];
                    const colorAttr = firstVariant.attributes?.find(attr => attr.name === 'Color');
                    if (colorAttr) {
                        setSelectedColor(colorAttr.value);
                    } else {
                        setSelectedColor("");
                    }
                } else {
                    setSelectedColor("");
                }
            } else {
                // No sizes, so no size selected
                setSelectedSize("");
                setSelectedColor("");
            }
        } else {
            // No variants, so no size/color
            setSelectedSize("");
            setSelectedColor("");
        }

        // Don't auto-select first variant - let user choose
        // This prevents the first variant from being auto-selected
    };

    // Get unique sizes from variants (optional)
    const getUniqueSizes = () => {
        if (!currentProduct?.variants) return [];
        const sizes = currentProduct.variants
            .map(variant => variant.attributes?.find(attr => attr.name === 'Size'))
            .filter(size => size)
            .map(size => size.value);
        return [...new Set(sizes)];
    };

    // Get unique colors from variants (optional)
    const getUniqueColors = () => {
        if (!currentProduct?.variants) return [];
        const colors = currentProduct.variants
            .map(variant => variant.attributes?.find(attr => attr.name === 'Color'))
            .filter(color => color) // Only include variants that have color
            .map(color => ({ value: color.value, hexCode: color.hexCode }));
        return colors.filter((color, index, self) =>
            index === self.findIndex(c => c.value === color.value)
        );
    };

    // Get available colors for selected size (size is optional now)
    const getAvailableColorsForSize = (size) => {
        if (!currentProduct?.variants) return [];
        
        // If size is provided, filter by size
        if (size) {
            return currentProduct.variants
                .filter(variant => {
                    const sizeAttr = variant.attributes?.find(attr => attr.name === 'Size');
                    return sizeAttr && sizeAttr.value === size;
                })
                .map(variant => {
                    const colorAttr = variant.attributes?.find(attr => attr.name === 'Color');
                    return colorAttr ? { value: colorAttr.value, hexCode: colorAttr.hexCode } : null;
                })
                .filter(color => color); // Only include variants that have color
        } else {
            // If no size selected, show all colors from variants that don't have size
            return currentProduct.variants
                .filter(variant => {
                    const sizeAttr = variant.attributes?.find(attr => attr.name === 'Size');
                    return !sizeAttr; // Only variants without size
                })
                .map(variant => {
                    const colorAttr = variant.attributes?.find(attr => attr.name === 'Color');
                    return colorAttr ? { value: colorAttr.value, hexCode: colorAttr.hexCode } : null;
                })
                .filter(color => color) // Only include variants that have color
                .filter((color, index, self) =>
                    index === self.findIndex(c => c.value === color.value)
                ); // Remove duplicates
        }
    };

    // Get available variants for selected size (to show variant images) - like product details page
    const getAvailableVariantsForSize = (size) => {
        if (!currentProduct?.variants) return [];
        
        if (size) {
            // Filter variants by selected size
            return currentProduct.variants.filter(variant => {
                const sizeAttr = variant.attributes?.find(attr => attr.name === 'Size');
                return sizeAttr && sizeAttr.value === size;
            });
        } else {
            // If no size selected, check if any variant has size
            const hasAnySize = currentProduct.variants.some(variant => {
                const sizeAttr = variant.attributes?.find(attr => attr.name === 'Size');
                return sizeAttr;
            });
            
            if (hasAnySize) {
                // If variants have size but no size is selected, show all variants
                // This allows user to see all variants and select one
                return currentProduct.variants;
            } else {
                // If no variant has size, show all variants (all are without size)
                return currentProduct.variants;
            }
        }
    };

    // Handle variant image selection (like product details page)
    const handleVariantImageChange = (variant) => {
        // Set size if variant has size, otherwise clear it
        const sizeAttr = variant.attributes?.find(attr => attr.name === 'Size');
        if (sizeAttr) {
            setSelectedSize(sizeAttr.value);
        } else {
            // If variant has no size, clear selectedSize to match variants without size
            setSelectedSize("");
        }
        
        // Set color if variant has color, otherwise clear it
        const colorAttr = variant.attributes?.find(attr => attr.name === 'Color');
        if (colorAttr) {
            setSelectedColor(colorAttr.value);
        } else {
            // If variant has no color, clear selectedColor to match variants without color
            setSelectedColor("");
        }
        
        // Store the selected variant SKU to uniquely identify it
        setSelectedVariantSku(variant.sku || variant._id);
        
        // Mark that user has manually selected a variant
        setHasManuallySelectedVariant(true);
    };

    // Get selected variant (size optional, color optional)
    const getSelectedVariant = () => {
        if (!currentProduct?.variants) return null;
        
        // Only return a variant if user has manually selected one
        // This prevents auto-selection of first variant
        if (!hasManuallySelectedVariant || !selectedVariantSku) return null;
        
        // First try to find by SKU (most reliable)
        const variantBySku = currentProduct.variants.find(variant => 
            (variant.sku || variant._id) === selectedVariantSku
        );
        
        if (variantBySku) return variantBySku;
        
        // Fallback to size/color matching if SKU not found
        return currentProduct.variants.find(variant => {
            const sizeAttr = variant.attributes?.find(attr => attr.name === 'Size');
            const colorAttr = variant.attributes?.find(attr => attr.name === 'Color');

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

            // Color matching logic (optional):
            // 1. If we have selectedColor and variant has color, both must match
            // 2. If we have no selectedColor and variant has no color, it matches
            // 3. If we have selectedColor but variant has no color, it doesn't match
            // 4. If we have no selectedColor but variant has color, it doesn't match
            let colorMatches = true;
            if (selectedColor && colorAttr) {
                colorMatches = colorAttr.value === selectedColor;
            } else if (selectedColor && !colorAttr) {
                colorMatches = false; // We have selected color but variant has no color
            } else if (!selectedColor && colorAttr) {
                colorMatches = false; // Variant has color but we don't have selected color
            }
            // If both selectedColor and variant color are null/empty, colorMatches remains true

            return sizeMatches && colorMatches;
        });
    };

    const selectedVariant = getSelectedVariant();
    const uniqueSizes = getUniqueSizes();
    const uniqueColors = getUniqueColors();
    const availableColors = getAvailableColorsForSize(selectedSize);

    const handleSizeChange = (size) => {
        setSelectedSize(size);
        // Clear variant SKU when size changes - user needs to select variant again
        setSelectedVariantSku(null);
        setHasManuallySelectedVariant(false);
        // Reset color when size changes
        const colorsForSize = getAvailableColorsForSize(size);
        if (colorsForSize.length > 0) {
            setSelectedColor(colorsForSize[0].value);
        } else {
            // If no colors available for this size, clear selected color
            setSelectedColor("");
        }
    };

    const handleColorChange = (color) => {
        setSelectedColor(color);
        // Clear variant SKU when color changes - user needs to select variant again
        setSelectedVariantSku(null);
        setHasManuallySelectedVariant(false);
    };

    // Add variant to purchase list (like manual orders)
    const addVariantToPurchase = () => {
        if (!currentProduct) {
            toast.error('Please select a product');
            return;
        }

        if (currentProduct.variants && currentProduct.variants.length > 0) {
            // Product with variants - need to select variant
            if (!selectedVariant) {
                toast.error('Please select a variant');
                return;
            }

            // Check if this variant already exists
            const existingItemIndex = selectedProducts.findIndex(item =>
                item.variantSku && item.variantSku === selectedVariant.sku
            );

            if (existingItemIndex !== -1) {
                toast.error('This variant is already in the purchase list');
                return;
            }

            const newItem = {
                productId: currentProduct._id,
                product: currentProduct,
                variantSku: selectedVariant.sku,
                variant: {
                    ...selectedVariant,
                    size: selectedSize,
                    color: selectedColor,
                    colorHexCode: selectedVariant.attributes?.find(attr => attr.name === 'Color')?.hexCode
                },
                quantity: '',
                unitCost: selectedVariant.costPrice || '',
                previousUnitCost: selectedVariant.costPrice || null,
                currentStock: selectedVariant.stockQuantity || 0
            };

            setSelectedProducts([...selectedProducts, newItem]);
            toast.success('Variant added to purchase list');
        } else {
            // Product without variants
            const existingItemIndex = selectedProducts.findIndex(item =>
                item.productId === currentProduct._id && !item.variantSku
            );

            if (existingItemIndex !== -1) {
                toast.error('This product is already in the purchase list');
                return;
            }

            const newItem = {
                productId: currentProduct._id,
                product: currentProduct,
                variantSku: null,
                variant: null,
                quantity: '',
                unitCost: currentProduct.costPrice || '',
                previousUnitCost: currentProduct.costPrice || null,
                currentStock: currentProduct.totalStock || 0
            };

            setSelectedProducts([...selectedProducts, newItem]);
            toast.success('Product added to purchase list');
        }

        // Reset selection
        setCurrentProduct(null);
        setSelectedSize("");
        setSelectedColor("");
        setHasManuallySelectedVariant(false);
        setSelectedVariantSku(null);
        setProductSearchTerm('');
    };

    // Remove product from purchase list
    const removeProductFromPurchase = (index) => {
        setSelectedProducts(selectedProducts.filter((_, i) => i !== index));
    };

    // Update purchase item
    const updatePurchaseItem = (index, field, value) => {
        const updated = [...selectedProducts];
        
        // Handle quantity - allow empty string, only numbers
        if (field === 'quantity') {
            // Allow empty string or only numbers
            if (value === '' || /^\d+$/.test(value.toString())) {
                updated[index] = {
                    ...updated[index],
                    [field]: value === '' ? '' : parseInt(value) || ''
                };
            } else {
                return; // Don't update if invalid
            }
        } else if (field === 'unitCost') {
            // Allow empty string or numbers with decimals
            if (value === '' || /^\d*\.?\d*$/.test(value.toString())) {
                updated[index] = {
                    ...updated[index],
                    [field]: value === '' ? '' : (value === '.' ? '0.' : value)
                };
            } else {
                return; // Don't update if invalid
            }
        } else {
            updated[index] = {
                ...updated[index],
                [field]: value
            };
        }
        
        // Recalculate total cost if quantity or unitCost changed
        if (field === 'quantity' || field === 'unitCost') {
            updated[index].totalCost = (parseInt(updated[index].quantity) || 0) * (parseFloat(updated[index].unitCost) || 0);
        }
        
        setSelectedProducts(updated);
    };

    // Submit purchase
    const submitPurchase = async () => {
        if (selectedProducts.length === 0) {
            toast.error('Please add at least one product');
            return;
        }

        // Validate all items
        for (const item of selectedProducts) {
            const quantity = item.quantity === '' || item.quantity === undefined ? 0 : parseInt(item.quantity);
            if (!quantity || quantity <= 0) {
                toast.error(`Please enter valid quantity for ${item.product.title}`);
                return;
            }
            const unitCost = item.unitCost === '' || item.unitCost === undefined ? 0 : parseFloat(item.unitCost);
            if (!unitCost || unitCost < 0) {
                toast.error(`Please enter valid unit cost for ${item.product.title}`);
                return;
            }
        }

        try {
            setSubmittingPurchase(true);
            const purchaseData = {
                items: selectedProducts.map(item => ({
                    productId: item.productId,
                    variantSku: item.variantSku,
                    quantity: parseInt(item.quantity === '' || item.quantity === undefined ? 0 : item.quantity),
                    unitCost: parseFloat(item.unitCost === '' || item.unitCost === undefined ? 0 : item.unitCost)
                })),
                notes: purchaseNotes
            };

            const response = await inventoryAPI.createPurchase(purchaseData, token);
            
            if (response.success) {
                toast.success('Purchase created successfully!');
                setShowPurchaseForm(false);
                setSelectedProducts([]);
                setPurchaseNotes('');
                setProductSearchTerm('');
                setProductResults([]);
                setCurrentProduct(null);
                setSelectedSize("");
                setSelectedColor("");
                setHasManuallySelectedVariant(false);
                setSelectedVariantSku(null);
                fetchPurchases();
            } else {
                toast.error(response.message || 'Failed to create purchase');
            }
        } catch (error) {
            console.error('Error creating purchase:', error);
            toast.error(error?.response?.data?.message || 'Error creating purchase');
        } finally {
            setSubmittingPurchase(false);
        }
    };

    // Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    useEffect(() => {
        if (contextLoading) return;
        const canRead = hasPermission('inventory', 'read');
        const canUpdate = hasPermission('inventory', 'update');
        setHasReadPermission(canRead);
        setHasUpdatePermission(!!canUpdate);
        setCheckingPermission(false);
        if (canRead) {
            fetchPurchases();
        } else {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [contextLoading, purchasePage]);

    if (checkingPermission || contextLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!hasReadPermission || permissionError) {
        return (
            <PermissionDenied
                title="Access Denied"
                message={permissionError || "You don't have permission to access inventory"}
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
                    <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
                    <p className="text-gray-600">Manage stock purchases and track inventory</p>
                </div>
                {hasUpdatePermission && (
                    <button
                        onClick={() => setShowPurchaseForm(!showPurchaseForm)}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 cursor-pointer"
                    >
                        <Plus className="w-5 h-5" />
                        <span>{showPurchaseForm ? 'Cancel Purchase' : 'Add New Purchase'}</span>
                    </button>
                )}
            </div>

            {/* Purchase Form */}
            {showPurchaseForm && hasUpdatePermission && (
                <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Purchase</h2>
                    
                    {/* Product Search */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Search Products or SKU
                        </label>
                        <div className="relative">
                            <div className="relative">
                                {searchingProducts ? (
                                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                                    </div>
                                ) : (
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                )}
                                <input
                                    type="text"
                                    value={productSearchTerm}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setProductSearchTerm(value);
                                        if (value.length >= 3 && /^[a-zA-Z0-9]+$/.test(value)) {
                                            setShowProductDropdown(true);
                                        }
                                    }}
                                    onFocus={() => setShowProductDropdown(true)}
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Search products by name or SKU..."
                                />
                            </div>

                            {showProductDropdown && productResults.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                    {productResults.map((product) => (
                                        <div
                                            key={product._id}
                                            onClick={() => handleProductSelect(product)}
                                            className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <img
                                                    src={product.featuredImage || '/images/placeholder.png'}
                                                    alt={product.title}
                                                    className="w-10 h-10 rounded object-cover"
                                                    onError={(e) => {
                                                        e.target.src = '/images/placeholder.png';
                                                    }}
                                                />
                                                <div className="flex-1">
                                                    <h4 className="text-sm font-medium text-gray-900">{product.title}</h4>
                                                    <p className="text-xs text-gray-500">
                                                        {product.variants?.length || 0} variants available
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Product Selection Details (like manual orders) */}
                    {currentProduct && (
                        <div className="mb-6 border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-start space-x-3">
                                    <img
                                        src={currentProduct.featuredImage || '/images/placeholder.png'}
                                        alt={currentProduct.title}
                                        className="w-16 h-16 rounded object-cover"
                                        onError={(e) => {
                                            e.target.src = '/images/placeholder.png';
                                        }}
                                    />
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{currentProduct.title}</h3>
                                        <p className="text-sm text-gray-600">Select variant and confirm</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setCurrentProduct(null);
                                        setSelectedSize("");
                                        setSelectedColor("");
                                        setHasManuallySelectedVariant(false);
                                        setSelectedVariantSku(null);
                                    }}
                                    className="text-gray-400 hover:text-gray-600 cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Size Selection */}
                            {uniqueSizes.length > 0 && (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Size
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {uniqueSizes.map((size) => (
                                            <button
                                                key={size}
                                                onClick={() => handleSizeChange(size)}
                                                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                                                    selectedSize === size
                                                        ? 'bg-blue-500 text-white'
                                                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                                }`}
                                            >
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Variant Image Selector - Show variant images (like product details page) */}
                            {(() => {
                                const variantsToShow = getAvailableVariantsForSize(selectedSize);
                                
                                return variantsToShow.length > 0 && (
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Select Variant {selectedVariant && <span className="text-green-600 text-xs">(Selected)</span>}
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {variantsToShow.map((variant) => {
                                                const colorAttr = variant.attributes?.find(attr => attr.name === 'Color');
                                                const sizeAttr = variant.attributes?.find(attr => attr.name === 'Size');
                                                
                                                // Check if this variant is selected by comparing SKU (most reliable)
                                                const variantSku = variant.sku || variant._id;
                                                const isSelected = hasManuallySelectedVariant && selectedVariantSku && variantSku === selectedVariantSku;
                                                
                                                // Get variant image from images array (first image) or fallback to featured image
                                                const variantImage = variant.images && variant.images.length > 0 
                                                    ? (variant.images[0]?.url || variant.images[0]) 
                                                    : (variant.image || currentProduct?.featuredImage);
                                                
                                                // Build title with variant info
                                                const variantTitle = [
                                                    sizeAttr?.value,
                                                    colorAttr?.value
                                                ].filter(Boolean).join(' - ') || 'Variant';
                                                
                                                return (
                                                    <button
                                                        key={variant.sku || variant._id}
                                                        onClick={() => handleVariantImageChange(variant)}
                                                        className={`w-14 h-14 rounded-md border-2 transition-all duration-200 flex items-center justify-center cursor-pointer overflow-hidden relative ${
                                                            isSelected
                                                                ? 'border-blue-600 ring-4 ring-blue-300 shadow-lg scale-105 bg-blue-50'
                                                                : 'border-gray-300 hover:border-blue-400 hover:shadow-md hover:scale-105'
                                                        }`}
                                                        title={variantTitle}
                                                    >
                                                        {variantImage ? (
                                                            <img
                                                                src={variantImage}
                                                                alt={variantTitle}
                                                                className={`w-full h-full object-cover ${isSelected ? 'opacity-90' : 'opacity-100'}`}
                                                                onError={(e) => {
                                                                    e.target.src = currentProduct?.featuredImage || '/images/placeholder.png';
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className={`w-full h-full flex items-center justify-center text-xs font-medium ${
                                                                isSelected 
                                                                    ? 'bg-blue-100 text-blue-700' 
                                                                    : 'bg-gray-200 text-gray-500'
                                                            }`}>
                                                                {colorAttr?.value || sizeAttr?.value || 'V'}
                                                            </div>
                                                        )}
                                                        {isSelected && (
                                                            <div className="absolute top-0 right-0 bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                                                                ✓
                                                            </div>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Color Selection - Fallback if variant images are not available */}
                            {(() => {
                                const variantsToShow = getAvailableVariantsForSize(selectedSize);
                                // Only show color selector if no variant images are available
                                return availableColors.length > 0 && variantsToShow.length === 0 && (
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Color
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {availableColors.map((color) => (
                                                <button
                                                    key={color.value}
                                                    onClick={() => handleColorChange(color.value)}
                                                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                                                        selectedColor === color.value
                                                            ? 'bg-blue-500 text-white'
                                                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    {color.value}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Confirm Button */}
                            <button
                                onClick={addVariantToPurchase}
                                disabled={!selectedVariant && (currentProduct.variants?.length > 0)}
                                className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {currentProduct.variants?.length > 0 ? 'Confirm Variant' : 'Add Product'}
                            </button>
                        </div>
                    )}

                    {/* Selected Products */}
                    {selectedProducts.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-md font-medium text-gray-900 mb-3">Selected Products</h3>
                            <div className="space-y-4">
                                {selectedProducts.map((item, index) => (
                                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-start space-x-3 flex-1">
                                                <img
                                                    src={
                                                        item.variant 
                                                            ? (
                                                                // Variant image priority: images array > image property > product featured image
                                                                (item.variant.images && item.variant.images.length > 0 
                                                                    ? (item.variant.images[0]?.url || item.variant.images[0])
                                                                    : (item.variant.image || item.product.featuredImage)
                                                                )
                                                            )
                                                            : (item.product.featuredImage || '/images/placeholder.png')
                                                    }
                                                    alt={item.product.title}
                                                    className="w-12 h-12 rounded object-cover"
                                                    onError={(e) => {
                                                        e.target.src = item.product.featuredImage || '/images/placeholder.png';
                                                    }}
                                                />
                                                <div className="flex-1">
                                                    <h4 className="text-sm font-medium text-gray-900">{item.product.title}</h4>
                                                    {item.variant && (
                                                        <p className="text-xs text-gray-500">
                                                            SKU: {item.variant.sku}
                                                            {item.variant.attributes?.find(a => a.name === 'Size') && (
                                                                <span className="ml-2">Size: {item.variant.attributes.find(a => a.name === 'Size').value}</span>
                                                            )}
                                                            {item.variant.attributes?.find(a => a.name === 'Color') && (
                                                                <span className="ml-2">Color: {item.variant.attributes.find(a => a.name === 'Color').value}</span>
                                                            )}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => removeProductFromPurchase(index)}
                                                className="text-red-600 hover:text-red-800 cursor-pointer"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                                    Purchase Quantity
                                                </label>
                                                <input
                                                    type="text"
                                                    value={item.quantity === '' || item.quantity === undefined ? '' : item.quantity}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        // Allow empty string or only numbers
                                                        if (value === '' || /^\d+$/.test(value)) {
                                                            updatePurchaseItem(index, 'quantity', value);
                                                        }
                                                    }}
                                                    onKeyDown={(e) => {
                                                        // Allow: backspace, delete, tab, escape, enter, and numbers
                                                        if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                                                            e.preventDefault();
                                                        }
                                                    }}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                                    placeholder="Enter quantity"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                                    Current Stock
                                                </label>
                                                <input
                                                    type="text"
                                                    value={item.currentStock}
                                                    disabled
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                                    Total Stock (After Purchase)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={(item.currentStock || 0) + (parseInt(item.quantity) || 0)}
                                                    disabled
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                                    Previous Unit Cost
                                                </label>
                                                <input
                                                    type="text"
                                                    value={item.previousUnitCost ? `৳${item.previousUnitCost}` : 'N/A'}
                                                    disabled
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                                    Unit Cost (৳)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={item.unitCost === '' || item.unitCost === undefined ? '' : item.unitCost}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        // Allow empty string or numbers with decimals
                                                        if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                                            updatePurchaseItem(index, 'unitCost', value);
                                                        }
                                                    }}
                                                    onKeyDown={(e) => {
                                                        // Allow: backspace, delete, tab, escape, enter, numbers, decimal point, and arrow keys
                                                        if (!/[0-9.]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                                                            e.preventDefault();
                                                        }
                                                    }}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                                    placeholder="Enter unit cost"
                                                />
                                            </div>
                                        </div>
                                        <div className="mt-2 text-sm text-gray-600">
                                            Total Cost: ৳{((item.quantity || 0) * (item.unitCost || 0)).toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Purchase Notes */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Notes (Optional)
                        </label>
                        <textarea
                            value={purchaseNotes}
                            onChange={(e) => setPurchaseNotes(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            rows={3}
                            placeholder="Add any notes about this purchase..."
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end">
                        <button
                            onClick={submitPurchase}
                            disabled={submittingPurchase || selectedProducts.length === 0}
                            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed cursor-pointer flex items-center space-x-2"
                        >
                            {submittingPurchase ? (
                                <>
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                    <span>Submitting...</span>
                                </>
                            ) : (
                                <>
                                    <ShoppingCart className="w-5 h-5" />
                                    <span>Submit Purchase</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Purchases List */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Purchase History</h2>
                </div>
                
                {loading ? (
                    <div className="p-12 text-center">
                        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                        <p className="text-gray-600">Loading purchases...</p>
                    </div>
                ) : purchases.length === 0 ? (
                    <div className="p-12 text-center">
                        <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500">No purchases found</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Purchase #
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Items
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Total Quantity
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Total Cost
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Purchased By
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {purchases.map((purchase) => (
                                        <tr key={purchase._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {purchase.purchaseNumber}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatDate(purchase.createdAt)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                <span className="font-medium">
                                                    {purchase.items?.length || 0} {purchase.items?.length === 1 ? 'item' : 'items'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {purchase.totalQuantity}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                ৳{purchase.totalCost?.toFixed(2) || '0.00'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {purchase.performedBy?.name || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <button
                                                    onClick={() => {
                                                        setSelectedPurchase(purchase);
                                                        setShowItemsModal(true);
                                                    }}
                                                    className="text-blue-600 hover:text-blue-800 cursor-pointer flex items-center space-x-1"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    <span>View</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {purchaseTotalPages > 1 && (
                            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
                                <div className="flex-1 flex justify-between sm:hidden">
                                    <button
                                        onClick={() => setPurchasePage(prev => Math.max(1, prev - 1))}
                                        disabled={purchasePage === 1}
                                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setPurchasePage(prev => Math.min(purchaseTotalPages, prev + 1))}
                                        disabled={purchasePage === purchaseTotalPages}
                                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
                                </div>
                                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-gray-700">
                                            Page <span className="font-medium">{purchasePage}</span> of{' '}
                                            <span className="font-medium">{purchaseTotalPages}</span>
                                        </p>
                                    </div>
                                    <div>
                                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                            <button
                                                onClick={() => setPurchasePage(prev => Math.max(1, prev - 1))}
                                                disabled={purchasePage === 1}
                                                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Previous
                                            </button>
                                            <button
                                                onClick={() => setPurchasePage(prev => Math.min(purchaseTotalPages, prev + 1))}
                                                disabled={purchasePage === purchaseTotalPages}
                                                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Next
                                            </button>
                                        </nav>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Items Modal */}
            {showItemsModal && selectedPurchase && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900">
                                    Purchase Items - {selectedPurchase.purchaseNumber}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    {formatDate(selectedPurchase.createdAt)} • {selectedPurchase.items?.length || 0} items
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowItemsModal(false);
                                    setSelectedPurchase(null);
                                }}
                                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                #
                                            </th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Product
                                            </th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                SKU
                                            </th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Variant
                                            </th>
                                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Qty
                                            </th>
                                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Unit Cost
                                            </th>
                                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Total
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {selectedPurchase.items?.map((item, index) => (
                                            <tr key={index} className="hover:bg-gray-50">
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                                    {index + 1}
                                                </td>
                                                <td className="px-4 py-2 text-sm text-gray-900 max-w-xs">
                                                    <div className="truncate" title={item.product?.title || 'N/A'}>
                                                        {item.product?.title || 'N/A'}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">
                                                    {item.variant?.sku ? (
                                                        <span className="font-mono text-xs">{item.variant.sku}</span>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2 text-sm text-gray-600">
                                                    {item.variant?.attributes && item.variant.attributes.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {item.variant.attributes.map((attr, attrIdx) => (
                                                                <span
                                                                    key={attrIdx}
                                                                    className="inline-block px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-700"
                                                                >
                                                                    {attr.value}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                                                    {item.quantity || 0}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                                                    ৳{item.unitCost?.toFixed(2) || '0.00'}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                                                    ৳{item.totalCost?.toFixed(2) || '0.00'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="border-t border-gray-200 p-6 bg-gray-50">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-600">
                                    <span className="font-medium">Total Items:</span> {selectedPurchase.items?.length || 0} • 
                                    <span className="font-medium ml-2">Total Quantity:</span> {selectedPurchase.totalQuantity || 0} • 
                                    <span className="font-medium ml-2">Total Cost:</span> ৳{selectedPurchase.totalCost?.toFixed(2) || '0.00'}
                                </div>
                                <button
                                    onClick={() => {
                                        setShowItemsModal(false);
                                        setSelectedPurchase(null);
                                    }}
                                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryPage;
