'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { 
    Search, 
    X,
    RefreshCw,
    TrendingDown,
    ArrowLeft,
    Package
} from 'lucide-react';
import { inventoryAPI, productAPI } from '@/services/api';
import { getCookie } from 'cookies-next';
import { useAppContext } from '@/context/AppContext';
import PermissionDenied from '@/components/Common/PermissionDenied';

const REASONS = [
    { value: 'damaged', label: 'Damaged' },
    { value: 'expired', label: 'Expired' },
    { value: 'lost', label: 'Lost' },
    { value: 'theft', label: 'Theft' },
    { value: 'returned', label: 'Returned' },
    { value: 'defective', label: 'Defective' },
    { value: 'waste', label: 'Waste' },
    { value: 'other', label: 'Other' }
];

const CreateStockAdjustmentPage = () => {
    const router = useRouter();
    const { hasPermission, contextLoading } = useAppContext();
    const [productSearchTerm, setProductSearchTerm] = useState('');
    const [productResults, setProductResults] = useState([]);
    const [searchingProducts, setSearchingProducts] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]);
    const [adjustmentNotes, setAdjustmentNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    
    const [currentProduct, setCurrentProduct] = useState(null);
    const [selectedSize, setSelectedSize] = useState("");
    const [selectedColor, setSelectedColor] = useState("");
    
    const token = getCookie('token');
    const [checkingPermission, setCheckingPermission] = useState(true);
    const [hasUpdatePermission, setHasUpdatePermission] = useState(false);
    const [permissionError, setPermissionError] = useState(null);

    useEffect(() => {
        if (!contextLoading) {
            const updatePerm = hasPermission('inventory', 'update');
            setHasUpdatePermission(updatePerm);
            setCheckingPermission(false);
            if (!updatePerm) {
                setPermissionError('You do not have permission to create stock adjustments');
            }
        }
    }, [contextLoading, hasPermission]);

    // Debounce product search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (productSearchTerm.trim()) {
                searchProducts(productSearchTerm.trim());
            } else {
                setProductResults([]);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [productSearchTerm]);

    const searchProducts = async (query) => {
        try {
            setSearchingProducts(true);
            const response = await productAPI.searchProducts(query);
            
            if (response.success) {
                const products = response.data || [];

                // Check if search term matches any variant SKU exactly
                let matchingVariant = null;
                let matchingProduct = null;

                for (const product of products) {
                    if (product.variants && product.variants.length > 0) {
                        for (const variant of product.variants) {
                            if (variant.sku && variant.sku.toLowerCase() === query.toLowerCase()) {
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
                    const stockQuantity = matchingVariant.stockQuantity || 0;
                    if (stockQuantity <= 0) {
                        toast.error(`Stock out! "${matchingProduct.title}" (SKU: ${matchingVariant.sku}) is out of stock.`);
                        setProductSearchTerm('');
                        return;
                    }

                    const existingItemIndex = selectedItems.findIndex(item =>
                        item.variantSku && item.variantSku === matchingVariant.sku
                    );

                    if (existingItemIndex !== -1) {
                        toast.error('This variant is already in the adjustment list');
                        setProductSearchTerm('');
                        return;
                    }

                    const newItem = {
                        productId: matchingProduct._id,
                        product: matchingProduct,
                        variantSku: matchingVariant.sku,
                        variant: {
                            ...matchingVariant,
                            size: matchingVariant.attributes?.find(attr => attr.name === 'Size')?.value || matchingVariant.size,
                            color: matchingVariant.attributes?.find(attr => attr.name === 'Color')?.value || matchingVariant.color,
                        },
                        quantity: '',
                        reason: '',
                        currentStock: matchingVariant.stockQuantity || 0
                    };

                    setSelectedItems([...selectedItems, newItem]);
                    toast.success(`Product "${matchingProduct.title}" (SKU: ${matchingVariant.sku}) added`);
                    setProductSearchTerm('');
                    return;
                }

                setProductResults(products);
            }
        } catch (error) {
            console.error('Error searching products:', error);
        } finally {
            setSearchingProducts(false);
        }
    };

    // Handle product selection (like manual orders)
    const handleProductSelect = (product) => {
        setCurrentProduct(product);
        setProductSearchTerm(product.title);
        setSelectedSize("");
        setSelectedColor("");
        setProductResults([]);

        // Set default size and color if available
        if (product.variants && product.variants.length > 0) {
            const firstVariant = product.variants[0];
            const sizeAttr = firstVariant.attributes?.find(attr => attr.name === 'Size');
            const colorAttr = firstVariant.attributes?.find(attr => attr.name === 'Color');

            // Size is mandatory - set it if available
            if (sizeAttr) {
                setSelectedSize(sizeAttr.value);
            }

            // Color is optional - only set if variant has color
            if (colorAttr) {
                setSelectedColor(colorAttr.value);
            } else {
                setSelectedColor(""); // No color for this variant
            }
        } else {
            // If no variants, set default values
            setSelectedSize("");
            setSelectedColor(""); // No color by default
        }
    };

    const getUniqueSizes = () => {
        if (!currentProduct?.variants) return [];
        const sizes = currentProduct.variants
            .map(variant => variant.attributes?.find(attr => attr.name === 'Size'))
            .filter(size => size)
            .map(size => size.value);
        return [...new Set(sizes)];
    };

    const getAvailableColorsForSize = (size) => {
        if (!currentProduct?.variants) return [];
        return currentProduct.variants
            .filter(variant => {
                const sizeAttr = variant.attributes?.find(attr => attr.name === 'Size');
                return sizeAttr && sizeAttr.value === size;
            })
            .map(variant => {
                const colorAttr = variant.attributes?.find(attr => attr.name === 'Color');
                return colorAttr ? { value: colorAttr.value, hexCode: colorAttr.hexCode } : null;
            })
            .filter(color => color);
    };

    const getSelectedVariant = () => {
        if (!currentProduct?.variants) return null;
        return currentProduct.variants.find(variant => {
            const sizeAttr = variant.attributes?.find(attr => attr.name === 'Size');
            const colorAttr = variant.attributes?.find(attr => attr.name === 'Color');
            const sizeMatches = sizeAttr?.value === selectedSize;
            let colorMatches = true;
            if (colorAttr && selectedColor) {
                colorMatches = colorAttr.value === selectedColor;
            } else if (colorAttr && !selectedColor) {
                colorMatches = false;
            } else if (!colorAttr && selectedColor) {
                colorMatches = false;
            }
            return sizeMatches && colorMatches;
        });
    };

    const handleSizeChange = (size) => {
        setSelectedSize(size);
        const colorsForSize = getAvailableColorsForSize(size);
        if (colorsForSize.length > 0) {
            setSelectedColor(colorsForSize[0].value);
        } else {
            setSelectedColor("");
        }
    };

    const addVariantToAdjustment = () => {
        if (!currentProduct) {
            toast.error('Please select a product');
            return;
        }

        if (currentProduct.variants && currentProduct.variants.length > 0) {
            const selectedVariant = getSelectedVariant();
            if (!selectedVariant) {
                toast.error('Please select a variant');
                return;
            }

            const stockQuantity = selectedVariant.stockQuantity || 0;
            if (stockQuantity <= 0) {
                toast.error('This variant is out of stock');
                return;
            }

            const existingItemIndex = selectedItems.findIndex(item =>
                item.variantSku && item.variantSku === selectedVariant.sku
            );

            if (existingItemIndex !== -1) {
                toast.error('This variant is already in the adjustment list');
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
                },
                quantity: '',
                reason: '',
                currentStock: stockQuantity
            };

            setSelectedItems([...selectedItems, newItem]);
            toast.success('Variant added');
        } else {
            const stockQuantity = currentProduct.totalStock || 0;
            if (stockQuantity <= 0) {
                toast.error('This product is out of stock');
                return;
            }

            const existingItemIndex = selectedItems.findIndex(item =>
                item.productId === currentProduct._id && !item.variantSku
            );

            if (existingItemIndex !== -1) {
                toast.error('This product is already in the adjustment list');
                return;
            }

            const newItem = {
                productId: currentProduct._id,
                product: currentProduct,
                variantSku: null,
                variant: null,
                quantity: '',
                reason: '',
                currentStock: stockQuantity
            };

            setSelectedItems([...selectedItems, newItem]);
            toast.success('Product added');
        }

        setCurrentProduct(null);
        setSelectedSize("");
        setSelectedColor("");
        setProductSearchTerm('');
        setProductResults([]);
    };

    const updateItem = (index, field, value) => {
        const updated = [...selectedItems];
        updated[index] = { ...updated[index], [field]: value };
        setSelectedItems(updated);
    };

    const removeItem = (index) => {
        setSelectedItems(selectedItems.filter((_, i) => i !== index));
    };

    const submitAdjustment = async () => {
        if (selectedItems.length === 0) {
            toast.error('Please add at least one item');
            return;
        }

        // Validate all items
        for (const item of selectedItems) {
            if (!item.quantity || parseInt(item.quantity) <= 0) {
                toast.error('Please enter valid quantity for all items');
                return;
            }
            if (parseInt(item.quantity) > item.currentStock) {
                toast.error(`Adjustment quantity cannot exceed current stock (${item.currentStock})`);
                return;
            }
            if (!item.reason) {
                toast.error('Please select reason for all items');
                return;
            }
        }

        try {
            setSubmitting(true);
            const adjustmentData = {
                items: selectedItems.map(item => ({
                    productId: item.productId,
                    variantSku: item.variantSku,
                    quantity: parseInt(item.quantity),
                    reason: item.reason,
                    notes: ''
                })),
                notes: adjustmentNotes
            };

            const response = await inventoryAPI.createStockAdjustment(adjustmentData, token);
            
            if (response.success) {
                toast.success('Stock adjustment created successfully!');
                router.push('/admin/dashboard/inventory/stock-adjustment');
            } else {
                toast.error(response.message || 'Failed to create stock adjustment');
            }
        } catch (error) {
            console.error('Error creating stock adjustment:', error);
            toast.error(error?.response?.data?.message || 'Error creating stock adjustment');
        } finally {
            setSubmitting(false);
        }
    };

    if (checkingPermission || contextLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (permissionError || !hasUpdatePermission) {
        return <PermissionDenied message={permissionError} />;
    }

    const uniqueSizes = getUniqueSizes();
    const availableColors = getAvailableColorsForSize(selectedSize);
    const selectedVariant = getSelectedVariant();

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center space-x-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Create Stock Adjustment</h1>
                    <p className="text-sm text-gray-500 mt-1">Reduce stock quantities with reasons</p>
                </div>
            </div>

            {/* Product Search */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Search Product / Variant / SKU</h2>
                
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        value={productSearchTerm}
                        onChange={(e) => setProductSearchTerm(e.target.value)}
                        placeholder="Search by product name, SKU, or variant..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {searchingProducts && (
                        <RefreshCw className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 animate-spin text-gray-400" />
                    )}
                </div>

                {/* Search Results */}
                {productResults.length > 0 && !currentProduct && (
                    <div className="mt-4 border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                        {productResults.map((product) => {
                            const hasStock = product.variants?.some(v => (v.stockQuantity || 0) > 0) || (product.totalStock || 0) > 0;
                            return (
                                <div
                                    key={product._id}
                                    onClick={() => handleProductSelect(product)}
                                    className={`p-3 border-b border-gray-200 last:border-b-0 cursor-pointer hover:bg-gray-50 ${!hasStock ? 'opacity-50' : ''}`}
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
                                            <p className="font-medium text-gray-900">{product.title}</p>
                                            <p className="text-sm text-gray-500">{product.brand}</p>
                                            <p className="text-xs text-gray-400">
                                                {product.variants?.length || 0} variants available
                                            </p>
                                        </div>
                                        {!hasStock && (
                                            <span className="text-xs text-red-600 font-medium">Stock Out</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Product Selection Details (like manual orders) */}
                {currentProduct && (
                    <div className="mt-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
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

                        {/* Color Selection */}
                        {availableColors.length > 0 && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Color
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {availableColors.map((color) => (
                                        <button
                                            key={color.value}
                                            onClick={() => setSelectedColor(color.value)}
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
                        )}

                        {/* Selected Variant Info */}
                        {selectedVariant && (
                            <div className="mb-4 p-3 bg-white rounded border border-gray-200">
                                <p className="text-sm text-gray-600">
                                    Current Stock: <span className="font-medium">{selectedVariant.stockQuantity || 0}</span>
                                </p>
                                {selectedVariant.stockQuantity <= 0 && (
                                    <p className="text-sm text-red-600 mt-1 font-medium">Stock Out!</p>
                                )}
                            </div>
                        )}

                        {/* Add Button */}
                        <div className="flex space-x-2">
                            <button
                                onClick={addVariantToAdjustment}
                                disabled={!selectedVariant || (selectedVariant.stockQuantity || 0) <= 0}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed cursor-pointer"
                            >
                                Add to Adjustment
                            </button>
                            <button
                                onClick={() => {
                                    setCurrentProduct(null);
                                    setSelectedSize("");
                                    setSelectedColor("");
                                }}
                                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 cursor-pointer"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Selected Items */}
            {selectedItems.length > 0 && (
                <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Items to Adjust</h2>
                    
                    <div className="space-y-4">
                        {selectedItems.map((item, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <p className="font-medium text-gray-900">{item.product.title}</p>
                                        {item.variant && (
                                            <p className="text-sm text-gray-500">
                                                SKU: {item.variantSku} | 
                                                {item.variant.size && ` Size: ${item.variant.size}`}
                                                {item.variant.color && ` | Color: ${item.variant.color}`}
                                            </p>
                                        )}
                                        <p className="text-sm text-gray-600 mt-1">Current Stock: <span className="font-medium">{item.currentStock}</span></p>
                                    </div>
                                    <button
                                        onClick={() => removeItem(index)}
                                        className="text-red-600 hover:text-red-800 cursor-pointer"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity to Adjust *</label>
                                        <input
                                            type="text"
                                            value={item.quantity === '' || item.quantity === undefined ? '' : item.quantity}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                if (value === '' || /^\d+$/.test(value)) {
                                                    updateItem(index, 'quantity', value);
                                                }
                                            }}
                                            onKeyDown={(e) => {
                                                if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                                                    e.preventDefault();
                                                }
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                            placeholder="Enter quantity"
                                            max={item.currentStock}
                                        />
                                        {item.quantity && parseInt(item.quantity) > item.currentStock && (
                                            <p className="text-xs text-red-600 mt-1">Cannot exceed current stock ({item.currentStock})</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
                                        <select
                                            value={item.reason}
                                            onChange={(e) => updateItem(index, 'reason', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                        >
                                            <option value="">Select Reason</option>
                                            {REASONS.map(reason => (
                                                <option key={reason.value} value={reason.value}>{reason.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Notes */}
                    <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                        <textarea
                            value={adjustmentNotes}
                            onChange={(e) => setAdjustmentNotes(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            rows={3}
                            placeholder="Add any notes about this adjustment..."
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end mt-6">
                        <button
                            onClick={submitAdjustment}
                            disabled={submitting}
                            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed cursor-pointer flex items-center space-x-2"
                        >
                            {submitting ? (
                                <>
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                    <span>Submitting...</span>
                                </>
                            ) : (
                                <>
                                    <TrendingDown className="w-5 h-5" />
                                    <span>Submit Adjustment</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreateStockAdjustmentPage;

