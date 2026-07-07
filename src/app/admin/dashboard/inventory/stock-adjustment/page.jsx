'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { 
    Package, 
    Plus, 
    RefreshCw,
    TrendingUp,
    Calendar,
    User,
    Eye,
    X
} from 'lucide-react';
import { inventoryAPI } from '@/services/api';
import { getCookie } from 'cookies-next';
import { useAppContext } from '@/context/AppContext';
import PermissionDenied from '@/components/Common/PermissionDenied';

const StockAdjustmentPage = () => {
    const router = useRouter();
    const { hasPermission, contextLoading } = useAppContext();
    const [adjustments, setAdjustments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    
    const token = getCookie('token');
    const [checkingPermission, setCheckingPermission] = useState(true);
    const [hasReadPermission, setHasReadPermission] = useState(false);
    const [permissionError, setPermissionError] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedAdjustment, setSelectedAdjustment] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    useEffect(() => {
        if (!contextLoading) {
            const readPerm = hasPermission('inventory', 'read');
            setHasReadPermission(readPerm);
            setCheckingPermission(false);
            if (!readPerm) {
                setPermissionError('You do not have permission to view stock adjustments');
            }
        }
    }, [contextLoading, hasPermission]);

    useEffect(() => {
        if (hasReadPermission) {
            fetchAdjustments();
        }
    }, [page, hasReadPermission]);

    const fetchAdjustments = async () => {
        try {
            setLoading(true);
            const response = await inventoryAPI.getStockAdjustments({
                page,
                limit: 20
            }, token);
            
            if (response.success) {
                setAdjustments(response.data);
                setTotalPages(response.pagination.totalPages);
            } else {
                toast.error('Failed to fetch stock adjustments');
            }
        } catch (error) {
            console.error('Error fetching stock adjustments:', error);
            toast.error('Error fetching stock adjustments');
        } finally {
            setLoading(false);
        }
    };

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

    const getReasonLabel = (reason) => {
        const reasonMap = {
            'damaged': 'Damaged',
            'expired': 'Expired',
            'lost': 'Lost',
            'theft': 'Theft',
            'returned': 'Returned',
            'defective': 'Defective',
            'waste': 'Waste',
            'other': 'Other'
        };
        return reasonMap[reason] || reason;
    };

    const handleViewDetails = async (adjustmentId) => {
        try {
            setLoadingDetails(true);
            const response = await inventoryAPI.getStockAdjustmentById(adjustmentId, token);
            
            if (response.success) {
                setSelectedAdjustment(response.data);
                setShowDetailsModal(true);
            } else {
                toast.error('Failed to fetch adjustment details');
            }
        } catch (error) {
            console.error('Error fetching adjustment details:', error);
            toast.error('Error fetching adjustment details');
        } finally {
            setLoadingDetails(false);
        }
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
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Stock Adjustments</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage stock adjustments and track inventory reductions</p>
                </div>
                <button
                    onClick={() => router.push('/admin/dashboard/inventory/stock-adjustment/create')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 cursor-pointer flex items-center space-x-2"
                >
                    <Plus className="w-5 h-5" />
                    <span>New Stock Adjustment</span>
                </button>
            </div>

            {/* Adjustments List */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Adjustment History</h2>
                </div>
                
                {loading ? (
                    <div className="p-12 text-center">
                        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                        <p className="text-gray-600">Loading adjustments...</p>
                    </div>
                ) : adjustments.length === 0 ? (
                    <div className="p-12 text-center">
                        <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500 mb-4">No stock adjustments found</p>
                        <button
                            onClick={() => router.push('/admin/dashboard/inventory/stock-adjustment/create')}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 cursor-pointer inline-flex items-center space-x-2"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Create First Adjustment</span>
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Adjustment #
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
                                            Adjusted By
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {adjustments.map((adjustment) => (
                                        <tr key={adjustment._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {adjustment.adjustmentNumber}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatDate(adjustment.createdAt)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                <span className="font-medium">
                                                    {adjustment.items?.length || 0} {adjustment.items?.length === 1 ? 'item' : 'items'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <span className="text-red-600 font-medium">
                                                    -{adjustment.totalQuantity}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {adjustment.performedBy?.name || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <button
                                                    onClick={() => handleViewDetails(adjustment._id)}
                                                    disabled={loadingDetails}
                                                    className="text-blue-600 hover:text-blue-800 cursor-pointer flex items-center space-x-1 disabled:opacity-50"
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
                        {totalPages > 1 && (
                            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                                <div className="flex-1 flex justify-between sm:hidden">
                                    <button
                                        onClick={() => setPage(prev => Math.max(1, prev - 1))}
                                        disabled={page === 1}
                                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={page === totalPages}
                                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
                                </div>
                                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-gray-700">
                                            Page <span className="font-medium">{page}</span> of{' '}
                                            <span className="font-medium">{totalPages}</span>
                                        </p>
                                    </div>
                                    <div>
                                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                            <button
                                                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                                                disabled={page === 1}
                                                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Previous
                                            </button>
                                            <button
                                                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                                                disabled={page === totalPages}
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

            {/* Details Modal */}
            {showDetailsModal && selectedAdjustment && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900">
                                    Stock Adjustment - {selectedAdjustment.adjustmentNumber}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    {formatDate(selectedAdjustment.createdAt)} • {selectedAdjustment.items?.length || 0} items
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowDetailsModal(false);
                                    setSelectedAdjustment(null);
                                }}
                                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {/* Adjustment Info */}
                            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-xs text-gray-500 mb-1">Total Quantity Adjusted</p>
                                    <p className="text-lg font-semibold text-red-600">-{selectedAdjustment.totalQuantity || 0}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-xs text-gray-500 mb-1">Adjusted By</p>
                                    <p className="text-sm font-medium text-gray-900">{selectedAdjustment.performedBy?.name || 'N/A'}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-xs text-gray-500 mb-1">Date</p>
                                    <p className="text-sm font-medium text-gray-900">{formatDate(selectedAdjustment.createdAt)}</p>
                                </div>
                            </div>

                            {/* Notes */}
                            {selectedAdjustment.notes && (
                                <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <p className="text-xs font-medium text-blue-900 mb-1">Notes</p>
                                    <p className="text-sm text-blue-800">{selectedAdjustment.notes}</p>
                                </div>
                            )}

                            {/* Items Table */}
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
                                                Quantity
                                            </th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Reason
                                            </th>
                                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Previous Stock
                                            </th>
                                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                New Stock
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {selectedAdjustment.items?.map((item, index) => (
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
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-red-600 font-medium text-right">
                                                    -{item.quantity || 0}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">
                                                    <span className="inline-block px-2 py-1 rounded text-xs bg-red-100 text-red-700">
                                                        {getReasonLabel(item.reason)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                                                    {item.previousStock || 0}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-green-600 text-right">
                                                    {item.newStock || 0}
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
                                    <span className="font-medium">Total Items:</span> {selectedAdjustment.items?.length || 0} • 
                                    <span className="font-medium ml-2">Total Quantity Adjusted:</span> <span className="text-red-600">-{selectedAdjustment.totalQuantity || 0}</span>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowDetailsModal(false);
                                        setSelectedAdjustment(null);
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

export default StockAdjustmentPage;

