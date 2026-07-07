'use client';

import React, { useState } from 'react';
import { Plus, Minus, Edit3, Save, X, AlertTriangle, CheckCircle } from 'lucide-react';
import { inventoryAPI } from '@/services/api';
import { getCookie } from 'cookies-next';
import { toast } from 'react-hot-toast';

const VariantStockCard = ({ variant, productId, onStockUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [updateForm, setUpdateForm] = useState({
        type: 'add',
        quantity: '',
        reason: '',
        cost: '',
        notes: ''
    });
    const token = getCookie('token');

    const handleStockUpdate = async () => {
        if (!updateForm.quantity || updateForm.quantity === '0') {
            toast.error('Please enter a valid quantity');
            return;
        }

        // Validate remove operations
        if (updateForm.type === 'remove') {
            const quantity = parseInt(updateForm.quantity);
            if (quantity > variant.stockQuantity) {
                toast.error(`Cannot remove ${quantity} items. Current stock is only ${variant.stockQuantity}.`);
                return;
            }
        }

        try {
            setLoading(true);
            const updateData = {
                productId,
                variantSku: variant.sku,
                ...updateForm,
                quantity: parseInt(updateForm.quantity)
            };

            const response = await inventoryAPI.updateStock(updateData, token);
            if (response.success) {
                toast.success('Stock updated successfully');
                setIsEditing(false);
                setUpdateForm({
                    type: 'add',
                    quantity: '',
                    reason: '',
                    cost: '',
                    notes: ''
                });
                onStockUpdate();
            } else {
                toast.error(response.message || 'Failed to update stock');
            }
        } catch (error) {
            console.error('Error updating stock:', error);
            toast.error('Error updating stock');
        } finally {
            setLoading(false);
        }
    };

    const getStockStatusColor = (stock) => {
        if (stock <= 0) return 'text-red-600 bg-red-50';
        if (stock <= (variant.lowStockThreshold || 5)) return 'text-yellow-600 bg-yellow-50';
        return 'text-green-600 bg-green-50';
    };

    const getStockStatusText = (stock) => {
        if (stock <= 0) return 'Out of Stock';
        if (stock <= (variant.lowStockThreshold || 5)) return 'Low Stock';
        return 'In Stock';
    };

    const getAttributeDisplay = (attributes) => {
        if (!attributes || attributes.length === 0) return '';
        return attributes.map(attr => `${attr.name}: ${attr.displayValue || attr.value}`).join(', ');
    };

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                        <h5 className="font-medium text-gray-900">SKU: {variant.sku}</h5>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStockStatusColor(variant.stockQuantity)}`}>
                            {getStockStatusText(variant.stockQuantity)}
                        </span>
                    </div>
                    
                    {getAttributeDisplay(variant.attributes) && (
                        <p className="text-sm text-gray-600 mb-2">
                            {getAttributeDisplay(variant.attributes)}
                        </p>
                    )}
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Current Stock: <span className="font-medium text-gray-900">{variant.stockQuantity}</span></span>
                        <span>Threshold: <span className="font-medium text-gray-900">{variant.lowStockThreshold || 5}</span></span>
                        <span>Price: <span className="font-medium text-gray-900">৳{variant.currentPrice}</span></span>
                    </div>
                </div>
                
                <div className="flex items-center space-x-2">
                    {variant.stockQuantity <= (variant.lowStockThreshold || 5) && (
                        <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    )}
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="p-3 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                        title={isEditing ? 'Cancel' : 'Update Stock'}
                    >
                        {isEditing ? <X className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {isEditing && (
                <div className="border-t border-gray-200 pt-6 mt-6 bg-gray-50 rounded-xl p-4">
                    <h6 className="text-lg font-semibold text-gray-900 mb-4">Update Stock</h6>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Operation Type <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={updateForm.type}
                                onChange={(e) => setUpdateForm(prev => ({ ...prev, type: e.target.value }))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                            >
                                <option value="add">Add Stock</option>
                                <option value="remove">Remove Stock</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Quantity <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={updateForm.quantity}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    // Only allow numbers
                                    if (value === '' || /^\d+$/.test(value)) {
                                        setUpdateForm(prev => ({ ...prev, quantity: value }));
                                    }
                                }}
                                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm ${
                                    updateForm.type === 'remove' && updateForm.quantity && parseInt(updateForm.quantity) > variant.stockQuantity 
                                        ? 'border-red-300 bg-red-50' 
                                        : 'border-gray-300'
                                }`}
                                placeholder="Enter quantity"
                            />
                            {updateForm.type === 'remove' && updateForm.quantity && parseInt(updateForm.quantity) > variant.stockQuantity && (
                                <p className="mt-1 text-sm text-red-600 flex items-center">
                                    <span className="mr-1">⚠️</span>
                                    Cannot remove {updateForm.quantity} items. Current stock is only {variant.stockQuantity}.
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {updateForm.type === 'remove' ? 'Reason for Removal' : 'Reason for Addition'}
                            </label>
                            <input
                                type="text"
                                value={updateForm.reason}
                                onChange={(e) => setUpdateForm(prev => ({ ...prev, reason: e.target.value }))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                                placeholder={updateForm.type === 'remove' ? 'e.g., Damage, Expired, etc.' : 'e.g., New shipment, Return, etc.'}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Cost per Unit</label>
                            <input
                                type="text"
                                value={updateForm.cost}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                        setUpdateForm(prev => ({ ...prev, cost: value }));
                                    }
                                }}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                                placeholder="Enter cost per unit (৳)"
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                        <textarea
                            value={updateForm.notes}
                            onChange={(e) => setUpdateForm(prev => ({ ...prev, notes: e.target.value }))}
                            rows={2}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                            placeholder="Additional notes"
                        />
                    </div>

                    {/* Stock Preview */}
                    {updateForm.quantity && (
                        <div className={`mb-4 p-4 rounded-xl border-2 ${
                            updateForm.type === 'add' 
                                ? 'bg-green-50 border-green-200' 
                                : updateForm.type === 'remove' && parseInt(updateForm.quantity) > variant.stockQuantity
                                    ? 'bg-red-50 border-red-200'
                                    : 'bg-red-50 border-red-200'
                        }`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h6 className={`font-medium ${
                                        updateForm.type === 'add' ? 'text-green-900' : 'text-red-900'
                                    }`}>
                                        Stock {updateForm.type === 'add' ? 'Addition' : 'Removal'} Preview
                                    </h6>
                                    {updateForm.type === 'remove' && parseInt(updateForm.quantity) > variant.stockQuantity ? (
                                        <p className="text-sm text-red-700">
                                            ❌ Cannot remove {updateForm.quantity} items. Current stock is only {variant.stockQuantity}.
                                        </p>
                                    ) : (
                                        <p className={`text-sm ${
                                            updateForm.type === 'add' ? 'text-green-700' : 'text-red-700'
                                        }`}>
                                            Current: {variant.stockQuantity} → New: {
                                                updateForm.type === 'add' 
                                                    ? variant.stockQuantity + parseInt(updateForm.quantity || 0)
                                                    : Math.max(0, variant.stockQuantity - parseInt(updateForm.quantity || 0))
                                            }
                                        </p>
                                    )}
                                </div>
                                <div className="text-right">
                                    {updateForm.type === 'remove' && parseInt(updateForm.quantity) > variant.stockQuantity ? (
                                        <span className="text-lg font-bold text-red-600">
                                            ❌ Invalid
                                        </span>
                                    ) : (
                                        <span className={`text-lg font-bold ${
                                            updateForm.type === 'add' ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                            {updateForm.type === 'add' ? '+' : '-'}{updateForm.quantity}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-end space-x-3">
                        <button
                            onClick={() => {
                                setIsEditing(false);
                                setUpdateForm({
                                    type: 'add',
                                    quantity: '',
                                    reason: '',
                                    cost: '',
                                    notes: ''
                                });
                            }}
                            className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleStockUpdate}
                            disabled={loading || (updateForm.type === 'remove' && parseInt(updateForm.quantity) > variant.stockQuantity)}
                            className={`px-6 py-3 text-sm font-medium text-white border border-transparent rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md flex items-center space-x-2 ${
                                updateForm.type === 'add' 
                                    ? 'bg-green-600 hover:bg-green-700' 
                                    : 'bg-red-600 hover:bg-red-700'
                            }`}
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>Updating...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    <span>{updateForm.type === 'add' ? 'Add Stock' : 'Remove Stock'}</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VariantStockCard;
