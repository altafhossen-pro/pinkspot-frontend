'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { 
    ArrowLeft, 
    RefreshCw, 
    TrendingUp, 
    TrendingDown,
    Package,
    ShoppingCart,
    AlertCircle,
    Calendar,
    User
} from 'lucide-react';
import { inventoryAPI } from '@/services/api';
import { getCookie } from 'cookies-next';
import { useAppContext } from '@/context/AppContext';
import PermissionDenied from '@/components/Common/PermissionDenied';

const StockHistoryPage = () => {
    const router = useRouter();
    const params = useParams();
    const productId = params.id;
    const { hasPermission, contextLoading } = useAppContext();
    
    const [loading, setLoading] = useState(true);
    const [product, setProduct] = useState(null);
    const [variants, setVariants] = useState([]);
    const [mainProduct, setMainProduct] = useState(null);
    const [expandedVariants, setExpandedVariants] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState(null);
    const [variantPages, setVariantPages] = useState({}); // { sku: page }
    
    const token = getCookie('token');
    const [checkingPermission, setCheckingPermission] = useState(true);
    const [hasReadPermission, setHasReadPermission] = useState(false);
    const [permissionError, setPermissionError] = useState(null);

    useEffect(() => {
        if (!contextLoading) {
            const readPerm = hasPermission('inventory', 'read');
            setHasReadPermission(readPerm);
            setCheckingPermission(false);
            if (!readPerm) {
                setPermissionError('You do not have permission to view stock history');
            }
        }
    }, [contextLoading, hasPermission]);

    useEffect(() => {
        if (hasReadPermission) {
            fetchStockHistory();
        }
    }, [productId, hasReadPermission, currentPage]);

    const fetchStockHistory = async (variantPagesParam = variantPages) => {
        try {
            setLoading(true);
            const response = await inventoryAPI.getProductStockHistory(
                productId, 
                token, 
                currentPage, 
                50,
                variantPagesParam
            );
            
            if (response.success) {
                setProduct(response.data.product);
                setVariants(response.data.variants || []);
                if (response.data.mainProduct) {
                    setMainProduct(response.data.mainProduct);
                    setPagination(response.data.mainProduct.pagination);
                }
            } else {
                toast.error(response.message || 'Failed to fetch stock history');
            }
        } catch (error) {
            console.error('Error fetching stock history:', error);
            toast.error('Error fetching stock history');
        } finally {
            setLoading(false);
        }
    };

    const handleVariantPageChange = (sku, page) => {
        setVariantPages(prev => ({ ...prev, [sku]: page }));
    };

    // Fetch when variant pages change
    useEffect(() => {
        if (hasReadPermission) {
            const variantPagesKeys = Object.keys(variantPages);
            if (variantPagesKeys.length > 0) {
                fetchStockHistory(variantPages);
            }
        }
    }, [variantPages]);

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

    const formatDateOnly = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Group timeline entries by date for sold items
    const groupTimelineByDate = (timeline) => {
        const soldByDate = {};
        const otherEntries = [];

        // Separate sold entries and other entries
        timeline.forEach(entry => {
            if (entry.type === 'remove' || entry.type === 'Sold') {
                const dateKey = formatDateOnly(entry.date);
                if (!soldByDate[dateKey]) {
                    soldByDate[dateKey] = {
                        date: entry.date,
                        dateKey,
                        type: 'remove',
                        entries: [],
                        reason: 'Customer Orders',
                        performedBy: { name: 'Customer' },
                        reference: 'Customer'
                    };
                }
                soldByDate[dateKey].entries.push(entry);
            } else {
                otherEntries.push(entry);
            }
        });

        // Convert grouped sold entries to timeline format
        const groupedSold = Object.values(soldByDate).map(group => {
            // Sort entries by time within the date (oldest first)
            group.entries.sort((a, b) => new Date(a.date) - new Date(b.date));
            
            // Calculate totals
            const totalQuantity = group.entries.reduce((sum, entry) => sum + Math.abs(entry.quantityChange), 0);
            const firstEntry = group.entries[0];
            const lastEntry = group.entries[group.entries.length - 1];
            
            return {
                date: group.date,
                type: 'remove',
                quantityChange: -totalQuantity,
                previousStock: firstEntry.previousStock,
                newStock: lastEntry.newStock,
                reason: group.reason,
                performedBy: group.performedBy,
                reference: group.reference,
                isGrouped: true,
                orderCount: group.entries.length
            };
        });

        // Combine and sort by date (newest first)
        const combined = [...otherEntries, ...groupedSold];
        combined.sort((a, b) => new Date(b.date) - new Date(a.date));

        return combined;
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'add':
            case 'purchase':
                return <TrendingUp className="w-4 h-4 text-green-600" />;
            case 'remove':
                return <TrendingDown className="w-4 h-4 text-red-600" />;
            case 'adjustment':
                return <AlertCircle className="w-4 h-4 text-orange-600" />;
            default:
                return <Package className="w-4 h-4 text-gray-600" />;
        }
    };

    const getTypeLabel = (type) => {
        switch (type) {
            case 'add':
                return 'Added';
            case 'purchase':
                return 'Purchase';
            case 'remove':
                return 'Sold';
            case 'adjustment':
                return 'Adjustment';
            default:
                return type;
        }
    };

    const toggleVariant = (sku) => {
        setExpandedVariants(prev => ({
            ...prev,
            [sku]: !prev[sku]
        }));
    };

    if (checkingPermission || contextLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (permissionError || !hasReadPermission) {
        return <PermissionDenied message={permissionError} />;
    }

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
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900">Stock History</h1>
                    {product && (
                        <p className="text-sm text-gray-500 mt-1">{product.title} - {product.brand}</p>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            ) : (
                <>
                    {/* Main Product (if no variants) */}
                    {mainProduct && (
                        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Stock History</h2>
                            
                            {/* Timeline Table */}
                            {mainProduct.timeline.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">No stock history available</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity Change</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Previous Stock</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New Stock</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performed By</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {groupTimelineByDate(mainProduct.timeline).map((entry, index) => (
                                                <tr key={index} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                        {formatDate(entry.date)}
                                                        {entry.isGrouped && entry.orderCount > 1 && (
                                                            <span className="block text-xs text-gray-500 mt-1">
                                                                ({entry.orderCount} orders)
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <div className="flex items-center space-x-2">
                                                            {getTypeIcon(entry.type)}
                                                            <span className="text-sm font-medium text-gray-900">{getTypeLabel(entry.type)}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-900">
                                                        {entry.reason || 'N/A'}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <span className={`text-sm font-medium ${entry.quantityChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                            {entry.quantityChange >= 0 ? '+' : ''}{entry.quantityChange}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                        {entry.previousStock}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {entry.newStock}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                        {entry.performedBy?.name || 'N/A'}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-600">
                                                        {entry.reference || 'N/A'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            
                            {/* Pagination for Main Product */}
                            {pagination && pagination.totalPages > 1 && (
                                <div className="mt-4 flex items-center justify-between">
                                    <div className="text-sm text-gray-700">
                                        Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to {Math.min(pagination.currentPage * pagination.limit, pagination.totalRecords)} of {pagination.totalRecords} records
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={!pagination.hasPrevPage}
                                            className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                        >
                                            Previous
                                        </button>
                                        <span className="px-3 py-1 text-sm text-gray-700">
                                            Page {pagination.currentPage} of {pagination.totalPages}
                                        </span>
                                        <button
                                            onClick={() => setCurrentPage(p => p + 1)}
                                            disabled={!pagination.hasNextPage}
                                            className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Variants */}
                    {variants.length > 0 && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold text-gray-900">Variants Stock History</h2>
                            {variants.map((variant, index) => (
                                <div key={variant.sku} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                                    <div className="mb-4">
                                        <h3 className="text-md font-semibold text-gray-900 mb-2">
                                            SKU: {variant.sku}
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {variant.attributes?.map((attr, idx) => (
                                                <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                                    {attr.name}: {attr.value}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {variant.timeline.length === 0 ? (
                                        <p className="text-gray-500 text-center py-8">No stock history available</p>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity Change</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Previous Stock</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New Stock</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performed By</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {groupTimelineByDate(variant.timeline).map((entry, idx) => (
                                                        <tr key={idx} className="hover:bg-gray-50">
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                                {formatDate(entry.date)}
                                                                {entry.isGrouped && entry.orderCount > 1 && (
                                                                    <span className="block text-xs text-gray-500 mt-1">
                                                                        ({entry.orderCount} orders)
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap">
                                                                <div className="flex items-center space-x-2">
                                                                    {getTypeIcon(entry.type)}
                                                                    <span className="text-sm font-medium text-gray-900">{getTypeLabel(entry.type)}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-900">
                                                                {entry.reason || 'N/A'}
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap">
                                                                <span className={`text-sm font-medium ${entry.quantityChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                    {entry.quantityChange >= 0 ? '+' : ''}{entry.quantityChange}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                                {entry.previousStock}
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                                                {entry.newStock}
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                                {entry.performedBy?.name || 'N/A'}
                                                            </td>
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-600">
                                                                {entry.reference || 'N/A'}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                    
                                    {/* Pagination for Variant Timeline */}
                                    {variant.pagination && variant.pagination.totalPages > 1 && (
                                        <div className="mt-4 flex items-center justify-between">
                                            <div className="text-sm text-gray-700">
                                                Showing {((variant.pagination.currentPage - 1) * variant.pagination.limit) + 1} to {Math.min(variant.pagination.currentPage * variant.pagination.limit, variant.pagination.totalRecords)} of {variant.pagination.totalRecords} records
                                            </div>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleVariantPageChange(variant.sku, variant.pagination.currentPage - 1)}
                                                    disabled={!variant.pagination.hasPrevPage}
                                                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                                >
                                                    Previous
                                                </button>
                                                <span className="px-3 py-1 text-sm text-gray-700">
                                                    Page {variant.pagination.currentPage} of {variant.pagination.totalPages}
                                                </span>
                                                <button
                                                    onClick={() => handleVariantPageChange(variant.sku, variant.pagination.currentPage + 1)}
                                                    disabled={!variant.pagination.hasNextPage}
                                                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                                >
                                                    Next
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {variants.length === 0 && !mainProduct && (
                        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
                            <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p className="text-gray-500">No stock history available for this product</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default StockHistoryPage;

