import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { inventoryAPI } from '@/services/api';
import { getCookie } from 'cookies-next';

export default function StockManagementModal({ 
    isOpen, 
    onClose, 
    productTitle, 
    productId,
    variant,
    onSuccess 
}) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        type: 'add',
        quantity: '',
        reason: '',
        notes: ''
    });

    if (!isOpen) return null;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.quantity || isNaN(formData.quantity) || parseInt(formData.quantity) <= 0) {
            toast.error('Please enter a valid quantity greater than 0');
            return;
        }

        if (!formData.reason.trim()) {
            toast.error('Please provide a reason for this stock update');
            return;
        }

        setLoading(true);
        try {
            const token = getCookie('token');
            const payload = {
                productId,
                type: formData.type,
                quantity: parseInt(formData.quantity),
                reason: formData.reason,
                notes: formData.notes
            };

            if (variant && variant.sku) {
                payload.variantSku = variant.sku;
            }

            const response = await inventoryAPI.updateStock(payload, token);
            
            if (response.success) {
                toast.success('Stock updated successfully');
                // Pass the new updated stock back to the parent
                if (onSuccess && response.data && response.data.product) {
                    if (variant && response.data.product.variant) {
                         onSuccess(response.data.product.variant.stockQuantity);
                    } else {
                         onSuccess(response.data.product.totalStock);
                    }
                }
                onClose();
            } else {
                toast.error(response.message || 'Failed to update stock');
            }
        } catch (error) {
            console.error('Error updating stock:', error);
            toast.error(error.message || 'An error occurred while updating stock');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
                <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

                <div className="relative inline-block w-full max-w-lg overflow-hidden text-left align-middle transition-all transform bg-white rounded-xl shadow-xl sm:my-8">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">Manage Stock</h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-500 focus:outline-none"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
                        <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm mb-4 border border-blue-100">
                            <p><strong>Product:</strong> {productTitle}</p>
                            {variant && (
                                <p className="mt-1">
                                    <strong>Variant:</strong> {variant.attributes?.map(a => a.displayValue || a.value).join(', ')} 
                                    (SKU: {variant.sku})
                                </p>
                            )}
                            <p className="mt-1"><strong>Current Stock:</strong> <span className="font-bold text-lg">{variant ? (variant.stockQuantity || 0) : 0}</span></p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Update Type</label>
                            <select
                                name="type"
                                value={formData.type}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="add">Add Stock (+)</option>
                                <option value="remove">Remove Stock (-)</option>
                                <option value="adjustment">Stock Adjustment</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
                            <input
                                type="number"
                                name="quantity"
                                min="1"
                                value={formData.quantity}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter quantity to add/remove"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Reason *</label>
                            <input
                                type="text"
                                name="reason"
                                value={formData.reason}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g. Received new shipment, Damaged item"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleInputChange}
                                rows="3"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Any additional details..."
                            />
                        </div>

                        <div className="pt-4 flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                ) : (
                                    <Save className="w-4 h-4 mr-2" />
                                )}
                                Confirm Update
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
