'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Search, Package, Plus, Minus, Printer, Settings2, Hash, Trash2, X } from 'lucide-react';
import { productAPI } from '@/services/api';
import { toast } from 'react-hot-toast';
import { useAppContext } from '@/context/AppContext';
import PermissionDenied from '@/components/Common/PermissionDenied';
import { getCookie } from 'cookies-next';

export default function LabelPrintPage() {
    const { hasPermission, contextLoading } = useAppContext();
    const [checkingPermission, setCheckingPermission] = useState(true);
    const [hasReadPermission, setHasReadPermission] = useState(false);
    
    // Products & Search state
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchFocused, setSearchFocused] = useState(false);
    const searchRef = useRef(null);
    
    // Filtered products
    const [filteredProducts, setFilteredProducts] = useState([]);
    
    // Variant Selection Modal State
    const [selectedProductForVariant, setSelectedProductForVariant] = useState(null);

    // Print Queue state
    const [printQueue, setPrintQueue] = useState([]);
    
    // Page size settings
    const [pageSettings, setPageSettings] = useState({
        width: 50, // mm
        height: 25, // mm
        unit: 'mm'
    });
    
    // Handle click outside to close search dropdown
    useEffect(() => {
        function handleClickOutside(event) {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setSearchFocused(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [searchRef]);

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

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const token = getCookie('token');
            const response = await productAPI.getAdminProducts({
                page: 1,
                limit: 2000,
                search: ''
            }, token);
            
            if (response.success && response.data) {
                const productsArray = Array.isArray(response.data) ? response.data : [];
                setProducts(productsArray);
            } else {
                toast.error(response.message || 'Failed to fetch products');
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            toast.error('Error fetching products');
        } finally {
            setLoading(false);
        }
    };

    // Filter products based on search (manual-order style)
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredProducts([]);
            return;
        }
        
        const term = searchTerm.toLowerCase().trim();
        const results = products.filter(p => {
            const titleMatch = p.title?.toLowerCase().includes(term);
            const skuMatch = p.variants?.some(v => v.sku?.toLowerCase().includes(term));
            return titleMatch || skuMatch;
        });
        setFilteredProducts(results.slice(0, 20)); // Limit to top 20 results
    }, [searchTerm, products]);

    // Scanner / Quick Add (Enter key)
    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter' && searchTerm.trim()) {
            e.preventDefault();
            
            const term = searchTerm.trim().toLowerCase();
            let exactVariant = null;
            let parentProduct = null;

            // Search for exact SKU match across all products
            for (const product of products) {
                if (product.variants && Array.isArray(product.variants)) {
                    const match = product.variants.find(v => v.sku?.toLowerCase() === term);
                    if (match) {
                        exactVariant = match;
                        parentProduct = product;
                        break;
                    }
                }
            }

            if (exactVariant && parentProduct) {
                // Auto add exact SKU match
                addToQueue(parentProduct, exactVariant);
                setSearchTerm('');
            } else {
                toast.error(`No exact SKU match found for "${searchTerm}". Please select a product below.`);
            }
        }
    };

    const addToQueue = (product, variant) => {
        const variantKey = `${product._id}-${variant._id}`;
        
        const size = variant.attributes?.find(attr => attr.name === 'Size')?.value || variant.size;
        const color = variant.attributes?.find(attr => attr.name === 'Color')?.value || variant.color;
        const colorHexCode = variant.attributes?.find(attr => attr.name === 'Color')?.hexCode || variant.hexCode;
        
        setPrintQueue(prev => {
            const existingIndex = prev.findIndex(item => item.key === variantKey);
            if (existingIndex >= 0) {
                // Increment quantity if already in queue
                const newQueue = [...prev];
                newQueue[existingIndex] = {
                    ...newQueue[existingIndex],
                    quantity: newQueue[existingIndex].quantity + 1
                };
                toast.success(`Increased quantity for ${variant.sku}`);
                return newQueue;
            } else {
                // Add new item to queue
                toast.success(`Added ${variant.sku} to queue`);
                return [{
                    key: variantKey,
                    productId: product._id,
                    productTitle: product.title,
                    variantId: variant._id,
                    sku: variant.sku,
                    size: size,
                    color: color,
                    colorHexCode: colorHexCode,
                    image: variant.image || product.featuredImage || '/images/placeholder.png',
                    quantity: 1,
                    includeSize: false,
                    includeColor: false
                }, ...prev];
            }
        });
        
        setSearchTerm('');
        setSearchFocused(false);
        setSelectedProductForVariant(null); // Close modal if open
    };

    const updateQuantity = (variantKey, quantity) => {
        if (isNaN(quantity) || quantity < 1) return;
        setPrintQueue(prev => prev.map(item => item.key === variantKey ? { ...item, quantity: parseInt(quantity) } : item));
    };

    const removeFromQueue = (variantKey) => {
        setPrintQueue(prev => prev.filter(item => item.key !== variantKey));
    };

    const updateVariantSetting = (variantKey, field, value) => {
        setPrintQueue(prev => prev.map(item => item.key === variantKey ? { ...item, [field]: value } : item));
    };

    const clearQueue = () => {
        if (confirm('Are you sure you want to clear the print queue?')) {
            setPrintQueue([]);
        }
    };

    const handleProceedToPrint = () => {
        if (printQueue.length === 0) {
            toast.error('Print queue is empty');
            return;
        }

        const printData = {
            variants: printQueue,
            pageSettings: pageSettings
        };

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
                    body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }
                    .print-container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
                    .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
                    .controls { padding: 20px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; }
                    .print-btn { background: #10b981; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: 500; display: flex; align-items: center; gap: 8px; transition: background 0.2s; }
                    .print-btn:hover { background: #059669; }
                    .close-btn { background: #6b7280; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: 500; transition: background 0.2s; }
                    .close-btn:hover { background: #4b5563; }
                    .label-container { display: grid; grid-template-columns: repeat(auto-fit, minmax(${pageSettings.width}mm, 1fr)); gap: 10px; padding: 20px; justify-items: center; }
                    .label { border: 1px dashed #d1d5db; padding: 8px; text-align: center; background: white; border-radius: 4px; display: flex; flex-direction: column; justify-content: center; align-items: center; width: ${pageSettings.width}mm; height: ${pageSettings.height}mm; min-height: ${pageSettings.height}mm; }
                    .label canvas { max-width: 100%; height: auto; margin-bottom: 5px; }
                    .label-info { font-size: 12px; line-height: 1.3; color: #374151; text-align: center; margin-top: 5px; }
                    .label-info .sku { font-weight: bold; color: #1f2937; font-size: 11px; }
                    .stats { background: #f1f5f9; padding: 15px; border-radius: 6px; margin-left: 20px; min-width: 200px; }
                    .stats h3 { margin-bottom: 10px; color: #1e293b; font-size: 14px; }
                    .stats div { margin-bottom: 5px; font-size: 13px; color: #64748b; }
                    @media print {
                        body { background: white; padding: 0; }
                        .print-container { box-shadow: none; border-radius: 0; }
                        .header, .controls, .stats { display: none; }
                        .label-container { grid-template-columns: repeat(auto-fit, minmax(${pageSettings.width}mm, 1fr)); gap: 0; padding: 0; }
                        .label { page-break-inside: avoid; margin: 0; border: none; box-shadow: none; }
                    }
                    @page { size: ${pageSettings.width}mm ${pageSettings.height}mm; margin: 0; }
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
                        </div>
                        <div>
                            <button class="print-btn" onclick="window.print()">
                                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M11 2H5a1 1 0 0 0-1 1v2H3V3a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2h-1V3a1 1 0 0 0-1-1zM3 7h10a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z"/></svg>
                                Print Labels
                            </button>
                            <button class="close-btn" onclick="window.close()">Close</button>
                        </div>
                    </div>
                    <div class="label-container" id="labels-container"></div>
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
                            
                            const skuDiv = document.createElement('div');
                            skuDiv.className = 'sku';
                            skuDiv.textContent = variant.sku;
                            infoDiv.appendChild(skuDiv);
                            
                            if (variant.includeSize && variant.size) {
                                const sizeDiv = document.createElement('div');
                                sizeDiv.textContent = 'Size: ' + variant.size;
                                infoDiv.appendChild(sizeDiv);
                            }
                            
                            if (variant.includeColor && variant.color) {
                                const colorDiv = document.createElement('div');
                                colorDiv.textContent = 'Color: ' + variant.color;
                                infoDiv.appendChild(colorDiv);
                            }
                            
                            labelDiv.appendChild(canvas);
                            labelDiv.appendChild(infoDiv);
                            container.appendChild(labelDiv);
                            
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
                                console.error('Barcode error:', error);
                                canvas.textContent = 'Error';
                            }
                        }
                    });
                </script>
            </body>
            </html>
        `);
        newWindow.document.close();
    };

    if (checkingPermission || contextLoading || loading) {
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
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            {/* Variant Selection Modal */}
            {selectedProductForVariant && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Select Variant</h3>
                                <p className="text-sm text-gray-500 mt-1">{selectedProductForVariant.title}</p>
                            </div>
                            <button 
                                onClick={() => setSelectedProductForVariant(null)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            {selectedProductForVariant.variants && selectedProductForVariant.variants.length > 0 ? (
                                <div className="grid gap-3">
                                    {selectedProductForVariant.variants.map(variant => {
                                        const size = variant.attributes?.find(attr => attr.name === 'Size')?.value || variant.size;
                                        const color = variant.attributes?.find(attr => attr.name === 'Color')?.value || variant.color;
                                        const colorHexCode = variant.attributes?.find(attr => attr.name === 'Color')?.hexCode || variant.hexCode;
                                        
                                        return (
                                        <div 
                                            key={variant._id}
                                            onClick={() => addToQueue(selectedProductForVariant, variant)}
                                            className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50/50 cursor-pointer transition-all group"
                                        >
                                            <img 
                                                src={variant.image || selectedProductForVariant.featuredImage || '/images/placeholder.png'} 
                                                alt={variant.sku}
                                                className="w-14 h-14 object-cover rounded-lg border border-gray-100 bg-white"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-gray-900 bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200">
                                                        SKU: {variant.sku}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                                    {size && (
                                                        <span className="text-xs font-medium text-gray-600 bg-white border border-gray-200 px-2 py-0.5 rounded-md">
                                                            Size: {size}
                                                        </span>
                                                    )}
                                                    {color && (
                                                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 px-2 py-0.5 rounded-md">
                                                            <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: colorHexCode || '#ccc' }}></span>
                                                            {color}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <Plus className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                        </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    No variants available for this product.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Label Print</h1>
                    <p className="text-gray-600 mt-1">Search products or scan SKUs to generate barcode labels</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Left Column: Print Queue (span 2) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Search / Scanner Bar */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 relative" ref={searchRef}>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-11 pr-4 py-3 bg-gray-50 border-0 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:bg-white placeholder-gray-400 text-lg transition-all"
                                placeholder="Scan barcode or search products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onFocus={() => setSearchFocused(true)}
                                onKeyDown={handleSearchKeyDown}
                                autoFocus
                            />
                        </div>
                        
                        {/* Product Search Dropdown */}
                        {searchFocused && searchTerm.length > 0 && (
                            <div className="absolute z-20 left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 max-h-96 overflow-y-auto overflow-x-hidden">
                                {filteredProducts.length > 0 ? (
                                    <ul className="py-2">
                                        {filteredProducts.map(product => (
                                            <li 
                                                key={product._id}
                                                className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-4 transition-colors border-b border-gray-50 last:border-0 group"
                                                onClick={() => {
                                                    setSelectedProductForVariant(product);
                                                    setSearchFocused(false);
                                                }}
                                            >
                                                <img src={product.featuredImage || '/images/placeholder.png'} alt={product.title} className="w-12 h-12 rounded-lg object-cover border border-gray-200 shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 truncate">{product.title}</p>
                                                    <p className="text-xs text-gray-500 mt-0.5">{product.variants?.length || 0} variants</p>
                                                </div>
                                                <span className="text-sm text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">Select Variant &rarr;</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="p-8 text-center">
                                        <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                        <p className="text-gray-500">No products found matching "{searchTerm}"</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Queue List */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                            <div className="flex items-center gap-2">
                                <Package className="w-5 h-5 text-gray-500" />
                                <h2 className="text-lg font-semibold text-gray-900">Print Queue</h2>
                            </div>
                            {printQueue.length > 0 && (
                                <button onClick={clearQueue} className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                                    <Trash2 className="w-4 h-4" /> Clear All
                                </button>
                            )}
                        </div>
                        
                        {printQueue.length > 0 ? (
                            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                                {printQueue.map((item) => (
                                    <div key={item.key} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 hover:bg-gray-50/50 transition-colors">
                                        <img src={item.image} alt={item.sku} className="w-16 h-16 rounded-lg object-cover border border-gray-200 shadow-sm shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-base font-semibold text-gray-900 truncate pr-4">{item.productTitle}</h3>
                                            <div className="flex flex-wrap items-center gap-2 mt-2 mb-3">
                                                <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
                                                    <Hash className="w-3 h-3" /> {item.sku}
                                                </span>
                                            </div>
                                            
                                            {/* Item Specific Print Toggles */}
                                            {(item.size || item.color) && (
                                                <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-gray-100">
                                                    <span className="text-xs font-medium text-gray-500 uppercase">Print on label:</span>
                                                    {item.size && (
                                                        <label className="flex items-center gap-2 cursor-pointer group">
                                                            <div className="relative flex items-center">
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={item.includeSize}
                                                                    onChange={(e) => updateVariantSetting(item.key, 'includeSize', e.target.checked)}
                                                                    className="w-4 h-4 border border-gray-300 rounded bg-white checked:bg-blue-600 checked:border-blue-600 focus:ring-1 focus:ring-blue-500 appearance-none cursor-pointer"
                                                                />
                                                                <svg className="absolute inset-0 w-4 h-4 text-white pointer-events-none opacity-0 peer-checked:opacity-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                            </div>
                                                            <span className="text-xs font-medium text-gray-700">Size ({item.size})</span>
                                                        </label>
                                                    )}
                                                    {item.color && (
                                                        <label className="flex items-center gap-2 cursor-pointer group">
                                                            <div className="relative flex items-center">
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={item.includeColor}
                                                                    onChange={(e) => updateVariantSetting(item.key, 'includeColor', e.target.checked)}
                                                                    className="w-4 h-4 border border-gray-300 rounded bg-white checked:bg-blue-600 checked:border-blue-600 focus:ring-1 focus:ring-blue-500 appearance-none cursor-pointer"
                                                                />
                                                                <svg className="absolute inset-0 w-4 h-4 text-white pointer-events-none opacity-0 peer-checked:opacity-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                            </div>
                                                            <span className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                                                                Color
                                                                <span className="w-2.5 h-2.5 rounded-full border border-gray-200" style={{ backgroundColor: item.colorHexCode || '#ccc' }}></span>
                                                            </span>
                                                        </label>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto mt-2 sm:mt-0 pt-4 sm:pt-0 border-t border-gray-100 sm:border-0">
                                            <div className="flex items-center bg-white border border-gray-300 rounded-lg p-1 shadow-sm">
                                                <button onClick={() => updateQuantity(item.key, item.quantity - 1)} className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md disabled:opacity-50 transition-colors" disabled={item.quantity <= 1}>
                                                    <Minus className="w-4 h-4" />
                                                </button>
                                                <input type="number" value={item.quantity} onChange={(e) => updateQuantity(item.key, parseInt(e.target.value))} className="w-14 text-center bg-transparent border-none text-sm font-bold text-gray-900 focus:ring-0 p-0" />
                                                <button onClick={() => updateQuantity(item.key, item.quantity + 1)} className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors">
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <button onClick={() => removeFromQueue(item.key)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors group">
                                                <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-16 text-center flex flex-col items-center justify-center">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-5 border border-gray-100">
                                    <Search className="w-10 h-10 text-gray-300" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900">Your queue is empty</h3>
                                <p className="text-gray-500 mt-2 max-w-sm mx-auto leading-relaxed">Search for products above, or connect a barcode scanner to add SKUs directly to this list.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Print Settings */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 sticky top-6">
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2 bg-gray-50 rounded-t-xl">
                            <Settings2 className="w-5 h-5 text-gray-500" />
                            <h2 className="text-lg font-semibold text-gray-900">Print Settings</h2>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Width (mm)</label>
                                    <input type="number" value={pageSettings.width} onChange={(e) => setPageSettings({...pageSettings, width: parseInt(e.target.value)||50})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-semibold text-gray-900" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Height (mm)</label>
                                    <input type="number" value={pageSettings.height} onChange={(e) => setPageSettings({...pageSettings, height: parseInt(e.target.value)||25})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-semibold text-gray-900" />
                                </div>
                            </div>
                            
                            <div className="bg-blue-50/80 border border-blue-100 rounded-xl p-5">
                                <h3 className="text-sm font-bold text-blue-900 mb-4">Print Summary</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-blue-800 font-medium">Unique SKUs</span>
                                        <span className="font-bold text-blue-900 bg-white px-2 py-0.5 rounded border border-blue-100">{printQueue.length}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm pt-3 border-t border-blue-200/60">
                                        <span className="text-blue-800 font-medium">Total Labels</span>
                                        <span className="font-black text-blue-900 text-2xl">{printQueue.reduce((sum, item) => sum + item.quantity, 0)}</span>
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={handleProceedToPrint}
                                disabled={printQueue.length === 0}
                                className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/20"
                            >
                                <Printer className="w-5 h-5" />
                                Print Labels
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
