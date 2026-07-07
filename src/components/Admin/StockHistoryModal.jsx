'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Package, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { inventoryAPI } from '@/services/api';
import { getCookie } from 'cookies-next';

const StockHistoryModal = ({ isOpen, onClose, product }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const token = getCookie('token');
    useEffect(() => {
        if (isOpen && product) {
            fetchStockHistory();
        }
    }, [isOpen, product, currentPage]);

    const fetchStockHistory = async () => {
        try {
            setLoading(true);
            const response = await inventoryAPI.getStockHistory(product._id, {
                page: currentPage,
                limit: 20
            }, token);
            
            if (response.success) {
                setHistory(response.data);
                setTotalPages(response.pagination.totalPages);
            }
        } catch (error) {
            console.error('Error fetching stock history:', error);
        } finally {
            setLoading(false);
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'add':
                return 'text-green-600 bg-green-50';
            case 'remove':
                return 'text-red-600 bg-red-50';
            default:
                return 'text-gray-600 bg-gray-50';
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'add':
                return <TrendingUp className="w-4 h-4" />;
            case 'remove':
                return <TrendingDown className="w-4 h-4" />;
            default:
                return <Package className="w-4 h-4" />;
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
                    <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                            Stock History - {product?.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                            Track all stock changes for this product
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">

                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="flex items-center space-x-2">
                                <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                                <span className="text-gray-600">Loading history...</span>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {history.length === 0 ? (
                                <div className="text-center py-12">
                                    <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                    <p className="text-gray-500">No stock history found</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {history.map((record, index) => (
                                        <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <div className={`p-2 rounded-full ${getTypeColor(record.type)}`}>
                                                        {getTypeIcon(record.type)}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center space-x-2">
                                                            <span className="font-medium text-gray-900">
                                                                {record.type === 'add' ? 'Add Stock' : 
                                                                 record.type === 'remove' ? 'Remove Stock' :
                                                                 record.type.charAt(0).toUpperCase() + record.type.slice(1)}
                                                            </span>
                                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(record.type)}`}>
                                                                {record.type === 'add' ? 'Add' : 
                                                                 record.type === 'remove' ? 'Remove' : record.type}
                                                            </span>
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {record.reason && (
                                                                <span>Reason: {record.reason}</span>
                                                            )}
                                                            {record.reference && (
                                                                <span className="ml-2">Ref: {record.reference}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="flex items-center space-x-2">
                                                        <span className={`font-medium ${record.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                            {record.type === 'remove' ? '-' : '+'}{Math.abs(record.quantity)}
                                                        </span>
                                                        <span className="text-gray-400">→</span>
                                                        <span className="font-medium text-gray-900">
                                                            {record.newStock}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {formatDate(record.createdAt)}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {record.variant && (
                                                <div className="mt-2 ml-12 text-sm text-gray-600">
                                                    <span className="font-medium">Variant:</span>
                                                    {record.variant.attributes && record.variant.attributes.length > 0 && (
                                                        <span className="ml-2">
                                                            {record.variant.attributes.map(attr => `${attr.name}: ${attr.value}`).join(', ')}
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {record.notes && (
                                                <div className="mt-2 ml-12 text-sm text-gray-600">
                                                    <span className="font-medium">Notes:</span> {record.notes}
                                                </div>
                                            )}

                                            {record.cost && (
                                                <div className="mt-2 ml-12 text-sm text-gray-600">
                                                    <span className="font-medium">Cost:</span> ${record.cost.toFixed(2)} per unit
                                                </div>
                                            )}

                                            {/* <div className="mt-2 ml-12 text-xs text-gray-500">
                                                <span className="font-medium">Performed by:</span> {record.performedBy?.name || 'Unknown'}
                                            </div> */}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                    <div className="flex-1 flex justify-between sm:hidden">
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Previous
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                            disabled={currentPage === totalPages}
                                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Next
                                        </button>
                                    </div>
                                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-sm text-gray-700">
                                                Page <span className="font-medium">{currentPage}</span> of{' '}
                                                <span className="font-medium">{totalPages}</span>
                                            </p>
                                        </div>
                                        <div>
                                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                                <button
                                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                    disabled={currentPage === 1}
                                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Previous
                                                </button>
                                                <button
                                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                                    disabled={currentPage === totalPages}
                                                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Next
                                                </button>
                                            </nav>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StockHistoryModal;
