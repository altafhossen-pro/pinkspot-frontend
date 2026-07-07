'use client';

import React from 'react';
import { AlertTriangle, X, Trash2, Truck } from 'lucide-react';

const DeleteConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Delete Item",
    message = "Are you sure you want to delete this item?",
    itemName = "",
    itemType = "item",
    isLoading = false,
    confirmText = "Delete",
    cancelText = "Cancel",
    dangerLevel = "high" // "high", "medium", "low"
}) => {
    if (!isOpen) return null;

    const getDangerStyles = () => {
        switch (dangerLevel) {
            case 'high':
                return {
                    iconBg: 'bg-red-100',
                    iconColor: 'text-red-600',
                    buttonBg: 'bg-red-600 hover:bg-red-700',
                    buttonFocus: 'focus:ring-red-500'
                };
            case 'medium':
                return {
                    iconBg: 'bg-orange-100',
                    iconColor: 'text-orange-600',
                    buttonBg: 'bg-orange-600 hover:bg-orange-700',
                    buttonFocus: 'focus:ring-orange-500'
                };
            case 'low':
                return {
                    iconBg: 'bg-yellow-100',
                    iconColor: 'text-yellow-600',
                    buttonBg: 'bg-yellow-600 hover:bg-yellow-700',
                    buttonFocus: 'focus:ring-yellow-500'
                };
            default:
                return {
                    iconBg: 'bg-red-100',
                    iconColor: 'text-red-600',
                    buttonBg: 'bg-red-600 hover:bg-red-700',
                    buttonFocus: 'focus:ring-red-500'
                };
        }
    };

    const styles = getDangerStyles();

    return (
        <div className="fixed inset-0 bg-black/50 flex  justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full transform transition-all h-fit mt-15">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        <div className={`p-2 ${styles.iconBg} rounded-full`}>
                            <AlertTriangle className={`h-6 w-6 ${styles.iconColor}`} />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">
                            {title}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6">
                    <p className="text-gray-600 mb-6">
                        {message}
                        {itemName && (
                            <span className="block mt-2 font-medium text-gray-900">
                                "{itemName}"
                            </span>
                        )}
                        {itemType && (
                            <span className="block mt-1 text-sm text-gray-500">
                                This action cannot be undone.
                            </span>
                        )}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {cancelText}
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={isLoading}
                            className={`px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white ${styles.buttonBg} focus:outline-none focus:ring-2 focus:ring-offset-2 ${styles.buttonFocus} transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer inline-flex items-center hover:shadow-md`}
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    {confirmText === 'Add to Steadfast' ? 'Adding...' : 'Deleting...'}
                                </>
                            ) : (
                                <>
                                    {confirmText === 'Add to Steadfast' ? (
                                        <Truck className="h-4 w-4 mr-2" />
                                    ) : (
                                        <Trash2 className="h-4 w-4 mr-2" />
                                    )}
                                    {confirmText}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmationModal;
