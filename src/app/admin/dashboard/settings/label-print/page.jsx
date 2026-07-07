'use client'

import React, { useState, useEffect } from 'react';
import { Search, Package, Check, X, Plus, Minus, Printer } from 'lucide-react';
import { productAPI } from '@/services/api';
import { toast } from 'react-hot-toast';
import { useAppContext } from '@/context/AppContext';
import PermissionDenied from '@/components/Common/PermissionDenied';
import { getCookie } from 'cookies-next';

export default function LabelPrintPage() {
    const { hasPermission, contextLoading } = useAppContext();
    const [checkingPermission, setCheckingPermission] = useState(true);
    const [hasReadPermission, setHasReadPermission] = useState(false);
    
    // Products state
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredProducts, setFilteredProducts] = useState([]);
    
    // Selected product and variants
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedVariants, setSelectedVariants] = useState([]);
    const [autoSelectedSkus, setAutoSelectedSkus] = useState(new Set()); // Track auto-selected SKUs
    
    // Page size settings
    const [pageSettings, setPageSettings] = useState({
        width: 50, // mm
        height: 25, // mm
        unit: 'mm'
    });
    
    // Print functionality
    const [showPrintPreview, setShowPrintPreview] = useState(false);
    
    // Check permission on mount
    useEffect(() => {
        if (!contextLoading) {
            const canRead = hasPermission('product', 'read');
            setHasReadPermission(canRead);
            setCheckingPermission(false);
        }
    }, [contextLoading, hasPermission]);

    // Fetch products
    useEffect(() => {
        if (hasReadPermission) {
            fetchProducts();
        }
    }, [hasReadPermission]);

    // Filter products based on search and handle SKU auto-select
    useEffect(() => {
        if (!Array.isArray(products)) {
            setFilteredProducts([]);
            return;
        }
        
        const searchValue = searchTerm.trim().toLowerCase();
        
        if (searchValue) {
            // First check if search term matches a variant SKU exactly
            let matchedVariant = null;
            let matchedProduct = null;
            
            for (const product of products) {
                if (product.variants && Array.isArray(product.variants)) {
                    const variant = product.variants.find(v => 
                        v.sku && v.sku.toLowerCase() === searchValue
                    );
                    if (variant) {
                        matchedVariant = variant;
                        matchedProduct = product;
                        break;
                    }
                }
            }
            
            // If exact SKU match found, auto-select product and variant
            if (matchedVariant && matchedProduct) {
                setSelectedProduct(matchedProduct);
                // Check if variant is already selected - if not, add it and mark as auto-selected
                const variantKey = `${matchedProduct._id}-${matchedVariant._id}`;
                const sku = matchedVariant.sku.toLowerCase();
                const isAlreadySelected = selectedVariants.some(v => v.key === variantKey);
                if (!isAlreadySelected && !autoSelectedSkus.has(sku)) {
                    const newVariant = {
                        key: variantKey,
                        productId: matchedProduct._id,
                        productTitle: matchedProduct.title,
                        variantId: matchedVariant._id,
                        sku: matchedVariant.sku,
                        size: matchedVariant.size,
                        color: matchedVariant.color,
                        colorHexCode: matchedVariant.hexCode,
                        image: matchedVariant.image || matchedProduct.featuredImage,
                        quantity: 1
                    };
                    setSelectedVariants(prev => [...prev, newVariant]);
                    setAutoSelectedSkus(prev => new Set([...prev, sku]));
                }
            }
            
            // Filter products for display
            const filtered = products.filter(product =>
                product && (
                    (product.title && product.title.toLowerCase().includes(searchValue)) ||
                    (product.slug && product.slug.toLowerCase().includes(searchValue)) ||
                    (product.variants && product.variants.some(v => 
                        v.sku && v.sku.toLowerCase().includes(searchValue)
                    ))
                )
            );
            setFilteredProducts(filtered);
        } else {
            setFilteredProducts(products);
        }
    }, [searchTerm, products]); // Removed selectedVariants from dependencies to prevent infinite loop

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const token = getCookie('token');
            
            // Remove status filter to get all products
            const response = await productAPI.getAdminProducts({
                page: 1,
                limit: 1000, // Get all products for selection
                search: ''
                // Removed status filter - get all products
            }, token);
            
            console.log('API Response:', response); // Debug log
            
            if (response.success && response.data) {
                // Backend returns data as array directly (same as admin products page)
                const productsArray = Array.isArray(response.data) 
                    ? response.data 
                    : [];
                    
                console.log('Products Array:', productsArray.length, productsArray); // Debug log
                
                setProducts(productsArray);
                setFilteredProducts(productsArray);
                
                if (productsArray.length === 0) {
                    toast.error('No products found');
                }
            } else {
                console.error('API Response Error:', response);
                toast.error(response.message || 'Failed to fetch products');
                setProducts([]);
                setFilteredProducts([]);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            toast.error('Error fetching products');
            setProducts([]);
            setFilteredProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleProductSelect = (product) => {
        setSelectedProduct(product);
        setSelectedVariants([]);
    };

    const handleVariantSelect = (variant, product) => {
        const variantKey = `${product._id}-${variant._id}`;
        const sku = variant.sku?.toLowerCase();
        const existingVariant = selectedVariants.find(v => v.key === variantKey);
        
        if (existingVariant) {
            // Remove variant if already selected (works for all variants including auto-selected)
            setSelectedVariants(prev => prev.filter(v => v.key !== variantKey));
            // Remove from auto-selected SKUs set if it was auto-selected
            if (sku && autoSelectedSkus.has(sku)) {
                setAutoSelectedSkus(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(sku);
                    return newSet;
                });
            }
        } else {
            // Add variant with default quantity 1
            const newVariant = {
                key: variantKey,
                productId: product._id,
                productTitle: product.title,
                variantId: variant._id,
                sku: variant.sku,
                size: variant.size,
                color: variant.color,
                colorHexCode: variant.hexCode,
                image: variant.image || product.featuredImage || '/images/placeholder.png',
                quantity: 1
            };
            setSelectedVariants(prev => [...prev, newVariant]);
        }
    };

    const updateVariantQuantity = (variantKey, quantity) => {
        if (quantity < 1) return;
        
        setSelectedVariants(prev => 
            prev.map(v => 
                v.key === variantKey 
                    ? { ...v, quantity: parseInt(quantity) }
                    : v
            )
        );
    };

    const removeVariant = (variantKey) => {
        setSelectedVariants(prev => prev.filter(v => v.key !== variantKey));
    };

    const handlePageSettingsChange = (field, value) => {
        setPageSettings(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleProceedToPrint = () => {
        if (selectedVariants.length === 0) {
            toast.error('Please select at least one variant');
            return;
        }

        // Prepare data for barcode generation
        const printData = {
            variants: selectedVariants,
            pageSettings: pageSettings
        };

        // Open new tab with barcode generation page
        const newWindow = window.open('', '_blank');
        newWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Barcode Labels - Print Preview</title>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { 
                        font-family: Arial, sans-serif; 
                        background: #f5f5f5; 
                        padding: 20px;
                    }
                    .print-container { 
                        max-width: 1200px; 
                        margin: 0 auto; 
                        background: white; 
                        border-radius: 8px; 
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                        overflow: hidden;
                    }
                    .header { 
                        background: #3b82f6; 
                        color: white; 
                        padding: 20px; 
                        text-align: center;
                    }
                    .controls { 
                        padding: 20px; 
                        background: #f8fafc; 
                        border-bottom: 1px solid #e2e8f0;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        flex-wrap: wrap;
                        gap: 10px;
                    }
                    .print-btn { 
                        background: #10b981; 
                        color: white; 
                        border: none; 
                        padding: 12px 24px; 
                        border-radius: 6px; 
                        cursor: pointer;
                        font-size: 16px;
                        font-weight: 500;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        transition: background 0.2s;
                    }
                    .print-btn:hover { background: #059669; }
                    .close-btn { 
                        background: #6b7280; 
                        color: white; 
                        border: none; 
                        padding: 12px 24px; 
                        border-radius: 6px; 
                        cursor: pointer;
                        font-size: 16px;
                        font-weight: 500;
                        transition: background 0.2s;
                    }
                    .close-btn:hover { background: #4b5563; }
                    .label-container { 
                        display: grid; 
                        grid-template-columns: repeat(auto-fit, minmax(${pageSettings.width}mm, 1fr)); 
                        gap: 10px; 
                        padding: 20px;
                        justify-items: center;
                    }
                    .label { 
                        border: 1px solid #d1d5db; 
                        padding: 8px; 
                        text-align: center;
                        background: white;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                        border-radius: 4px;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                        width: ${pageSettings.width}mm;
                        height: ${pageSettings.height}mm;
                        min-height: ${pageSettings.height}mm;
                    }
                    .label canvas { 
                        max-width: 100%; 
                        height: auto; 
                        margin-bottom: 8px;
                    }
                    .label-info { 
                        font-size: 12px; 
                        line-height: 1.3;
                        color: #374151;
                        text-align: center;
                        margin-top: 5px;
                    }
                    .label-info .sku { 
                        font-weight: bold; 
                        color: #1f2937;
                        font-size: 11px;
                    }
                    .stats { 
                        background: #f1f5f9; 
                        padding: 15px; 
                        border-radius: 6px; 
                        margin-left: 20px;
                        min-width: 200px;
                    }
                    .stats h3 { 
                        margin-bottom: 10px; 
                        color: #1e293b; 
                        font-size: 14px;
                    }
                    .stats div { 
                        margin-bottom: 5px; 
                        font-size: 13px; 
                        color: #64748b;
                    }
                    @media print {
                        body { background: white; padding: 0; }
                        .print-container { box-shadow: none; border-radius: 0; }
                        .header, .controls, .stats { display: none; }
                        .label-container { 
                            grid-template-columns: repeat(auto-fit, minmax(${pageSettings.width}mm, 1fr)); 
                            gap: 0;
                            padding: 0;
                        }
                        .label { 
                            page-break-inside: avoid;
                            margin: 0;
                            border: 1px solid #000;
                            box-shadow: none;
                        }
                    }
                    @page {
                        size: ${pageSettings.width}mm ${pageSettings.height}mm;
                        margin: 0;
                    }
                </style>
            </head>
            <body>
                <div class="print-container">
                    <div class="header">
                        <h1>Barcode Labels - Print Preview</h1>
                        <p>Page Size: ${pageSettings.width}mm × ${pageSettings.height}mm</p>
                    </div>
                    
                    <div class="controls">
                        <div class="stats">
                            <h3>Print Summary</h3>
                            <div>Total Labels: ${printData.variants.reduce((sum, v) => sum + v.quantity, 0)}</div>
                            <div>Unique SKUs: ${printData.variants.length}</div>
                            <div>Page Size: ${printData.pageSettings.width}mm × ${printData.pageSettings.height}mm</div>
                        </div>
                        <div>
                            <button class="print-btn" onclick="window.print()">
                                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M11 2H5a1 1 0 0 0-1 1v2H3V3a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2h-1V3a1 1 0 0 0-1-1zM3 7h10a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z"/>
                                </svg>
                                Print Labels
                            </button>
                            <button class="close-btn" onclick="window.close()">Close</button>
                        </div>
                    </div>
                    
                    <div class="label-container" id="labels-container">
                        <!-- Labels will be generated here -->
                    </div>
                </div>
                
                <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
                <script>
                    const printData = ${JSON.stringify(printData)};
                    const container = document.getElementById('labels-container');
                    
                    printData.variants.forEach(variant => {
                        for (let i = 0; i < variant.quantity; i++) {
                            const labelDiv = document.createElement('div');
                            labelDiv.className = 'label';
                            
                            const canvas = document.createElement('canvas');
                            const infoDiv = document.createElement('div');
                            infoDiv.className = 'label-info';
                            
                            // Create SKU only
                            const skuDiv = document.createElement('div');
                            skuDiv.className = 'sku';
                            skuDiv.textContent = variant.sku;
                            
                            infoDiv.appendChild(skuDiv);
                            
                            labelDiv.appendChild(canvas);
                            labelDiv.appendChild(infoDiv);
                            container.appendChild(labelDiv);
                            
                            // Generate barcode
                            try {
                                JsBarcode(canvas, variant.sku, {
                                    format: "CODE128",
                                    width: 1.5,
                                    height: 30,
                                    displayValue: false,
                                    margin: 0,
                                    background: "transparent",
                                    lineColor: "#000000"
                                });
                            } catch (error) {
                                console.error('Barcode generation error:', error);
                                canvas.textContent = 'Barcode Error';
                            }
                        }
                    });
                </script>
            </body>
            </html>
        `);
        newWindow.document.close();
    };

    const isVariantSelected = (variant, product) => {
        const variantKey = `${product._id}-${variant._id}`;
        return selectedVariants.some(v => v.key === variantKey);
    };

    if (checkingPermission || contextLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!hasReadPermission) {
        return (
            <PermissionDenied
                title="Access Denied"
                message="You don't have permission to access label printing"
                action="Contact your administrator for access"
                showBackButton={true}
            />
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Label Print</h1>
                        <p className="text-gray-600 mt-1">Select products and variants to generate barcode labels</p>
                    </div>
                    <div className="text-sm text-gray-500">
                        {selectedVariants.length} variant{selectedVariants.length !== 1 ? 's' : ''} selected
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Product Selection */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">Select Products</h2>
                        <p className="text-sm text-gray-600 mt-1">Choose products to view their variants</p>
                    </div>
                    
                    <div className="p-6">
                        {/* Search */}
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        {/* Products List */}
                        <div className="max-h-96 overflow-y-auto">
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                </div>
                            ) : !Array.isArray(filteredProducts) || filteredProducts.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <Package className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                                    <p>No products found</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {filteredProducts.map((product) => (
                                        <div
                                            key={product._id}
                                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                                selectedProduct?._id === product._id
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                            onClick={() => handleProductSelect(product)}
                                        >
                                            <div className="flex items-start space-x-3">
                                                {/* Product Image */}
                                                <div className="flex-shrink-0">
                                                    <img 
                                                        src={product.featuredImage || '/images/placeholder.png'} 
                                                        alt={product.title}
                                                        className="w-16 h-16 object-cover rounded-md border border-gray-200"
                                                        onError={(e) => {
                                                            e.target.src = '/images/placeholder.png';
                                                        }}
                                                    />
                                                </div>
                                                
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-medium text-gray-900 truncate">{product.title}</h3>
                                                    <p className="text-xs text-gray-400">
                                                        {product.variants?.length || 0} variant{(product.variants?.length || 0) !== 1 ? 's' : ''}
                                                    </p>
                                                </div>
                                                
                                                {selectedProduct?._id === product._id && (
                                                    <Check className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Variant Selection */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">Select Variants</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            {selectedProduct ? `Variants for ${selectedProduct.title}` : 'Select a product first'}
                        </p>
                    </div>
                    
                    <div className="p-6">
                        {!selectedProduct ? (
                            <div className="text-center py-8 text-gray-500">
                                <Package className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                                <p>Select a product to view variants</p>
                            </div>
                        ) : !selectedProduct.variants || !Array.isArray(selectedProduct.variants) || selectedProduct.variants.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <Package className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                                <p>No variants available for this product</p>
                            </div>
                        ) : (
                            <div className="max-h-96 overflow-y-auto space-y-2">
                                {selectedProduct.variants.map((variant) => {
                                    const isSelected = isVariantSelected(variant, selectedProduct);
                                    const variantImage = variant.image || selectedProduct.featuredImage || '/images/placeholder.png';
                                    
                                    return (
                                        <div
                                            key={variant._id}
                                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                                isSelected
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                            onClick={() => handleVariantSelect(variant, selectedProduct)}
                                        >
                                            <div className="flex items-start space-x-3">
                                                {/* Variant Image */}
                                                <div className="flex-shrink-0">
                                                    <img 
                                                        src={variantImage}
                                                        alt={variant.sku}
                                                        className="w-16 h-16 object-cover rounded-md border border-gray-200"
                                                        onError={(e) => {
                                                            e.target.src = '/images/placeholder.png';
                                                        }}
                                                    />
                                                </div>
                                                
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center space-x-2">
                                                        <h4 className="font-medium">
                                                            <span className="text-gray-600">SKU: </span>
                                                            <span className={`${isSelected ? 'text-blue-700 font-bold bg-blue-100 px-2 py-0.5 rounded' : 'text-gray-900'}`}>
                                                                {variant.sku}
                                                            </span>
                                                        </h4>
                                                        {isSelected && (
                                                            <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                                        )}
                                                    </div>
                                                    
                                                    <div className="flex items-center space-x-2 mt-2">
                                                        {variant.size && (
                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                Size: {variant.size}
                                                            </span>
                                                        )}
                                                        {variant.color && (
                                                            <span 
                                                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                                                                style={{ backgroundColor: variant.hexCode || '#6B7280' }}
                                                            >
                                                                {variant.color}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Selected Variants with Quantities */}
            {selectedVariants.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">Selected Variants</h2>
                        <p className="text-sm text-gray-600 mt-1">Set quantities for each selected variant</p>
                    </div>
                    
                    <div className="p-6">
                        <div className="space-y-4">
                            {selectedVariants.map((variant) => (
                                <div key={variant.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                    <div className="flex items-start space-x-3 flex-1">
                                        {/* Variant Image */}
                                        <div className="flex-shrink-0">
                                            <img 
                                                src={variant.image || '/images/placeholder.png'} 
                                                alt={variant.sku}
                                                className="w-16 h-16 object-cover rounded-md border border-gray-200"
                                                onError={(e) => {
                                                    e.target.src = '/images/placeholder.png';
                                                }}
                                            />
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-gray-900">{variant.productTitle}</h4>
                                            <div className="flex items-center space-x-2 mt-1">
                                                <span className="text-sm">
                                                    <span className="text-gray-600">SKU: </span>
                                                    <span className="text-blue-700 font-bold bg-blue-100 px-2 py-0.5 rounded">
                                                        {variant.sku}
                                                    </span>
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-2 mt-2">
                                                {variant.size && (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        Size: {variant.size}
                                                    </span>
                                                )}
                                                {variant.color && (
                                                    <span 
                                                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                                                        style={{ backgroundColor: variant.hexCode || '#6B7280' }}
                                                    >
                                                        {variant.color}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center space-x-3">
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => updateVariantQuantity(variant.key, variant.quantity - 1)}
                                                className="p-1 rounded-md border border-gray-300 hover:bg-gray-50"
                                                disabled={variant.quantity <= 1}
                                            >
                                                <Minus className="w-4 h-4" />
                                            </button>
                                            <input
                                                type="text"
                                                value={variant.quantity}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    if (value === '' || /^\d+$/.test(value)) {
                                                        updateVariantQuantity(variant.key, parseInt(value) || 1);
                                                    }
                                                }}
                                                className="w-16 text-center px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                            <button
                                                onClick={() => updateVariantQuantity(variant.key, variant.quantity + 1)}
                                                className="p-1 rounded-md border border-gray-300 hover:bg-gray-50"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                        
                                        <button
                                            onClick={() => removeVariant(variant.key)}
                                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="mt-6 pt-4 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-600">
                                    Total labels to print: {selectedVariants.reduce((sum, v) => sum + v.quantity, 0)}
                                </div>
                                <div className="text-sm font-medium text-gray-900">
                                    {selectedVariants.length} unique variant{selectedVariants.length !== 1 ? 's' : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Page Settings and Print Button */}
            {selectedVariants.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">Print Settings</h2>
                        <p className="text-sm text-gray-600 mt-1">Configure label dimensions and proceed to print</p>
                    </div>
                    
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Width Setting */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Label Width (mm)
                                </label>
                                <input
                                    type="number"
                                    value={pageSettings.width}
                                    onChange={(e) => handlePageSettingsChange('width', parseInt(e.target.value) || 50)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    min="10"
                                    max="200"
                                />
                            </div>

                            {/* Height Setting */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Label Height (mm)
                                </label>
                                <input
                                    type="number"
                                    value={pageSettings.height}
                                    onChange={(e) => handlePageSettingsChange('height', parseInt(e.target.value) || 25)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    min="10"
                                    max="200"
                                />
                            </div>

                            {/* Unit Setting */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Unit
                                </label>
                                <select
                                    value={pageSettings.unit}
                                    onChange={(e) => handlePageSettingsChange('unit', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="mm">Millimeters (mm)</option>
                                    <option value="cm">Centimeters (cm)</option>
                                    <option value="in">Inches (in)</option>
                                </select>
                            </div>
                        </div>

                        {/* Preview Info */}
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                            <h3 className="text-sm font-medium text-gray-900 mb-2">Print Preview</h3>
                            <div className="text-sm text-gray-600 space-y-1">
                                <div>Label Size: {pageSettings.width} × {pageSettings.height} {pageSettings.unit}</div>
                                <div>Total Labels: {selectedVariants.reduce((sum, v) => sum + v.quantity, 0)}</div>
                                <div>Unique SKUs: {selectedVariants.length}</div>
                            </div>
                        </div>

                        {/* Proceed to Print Button */}
                        <div className="mt-6 flex justify-end space-x-3">
                            <button
                                onClick={handleProceedToPrint}
                                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center space-x-2"
                            >
                                <Printer className="w-5 h-5" />
                                <span>Preview & Print</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
