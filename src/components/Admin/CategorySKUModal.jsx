import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

export default function CategorySKUModal({ isOpen, onClose, onSave, category, isLoading }) {
    const [formData, setFormData] = useState({
        prefix: '',
        digitsLength: 5,
        isActive: false
    });

    useEffect(() => {
        if (category && category.skuSettings) {
            setFormData({
                prefix: category.skuSettings.prefix || '',
                digitsLength: category.skuSettings.digitsLength || 5,
                isActive: category.skuSettings.isActive || false
            });
        } else {
            setFormData({
                prefix: '',
                digitsLength: 5,
                isActive: false
            });
        }
    }, [category, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">SKU Settings</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Configure dynamic SKU generation for "{category?.name}"
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500 hover:bg-gray-100 p-2 rounded-full transition-colors"
                        disabled={isLoading}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Enable Toggle */}
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-sm font-medium text-gray-900">Enable Auto SKU</label>
                            <p className="text-xs text-gray-500">Automatically generate SKUs for new products in this category</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                formData.isActive ? 'bg-blue-600' : 'bg-gray-200'
                            }`}
                        >
                            <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                    formData.isActive ? 'translate-x-5' : 'translate-x-0'
                                }`}
                            />
                        </button>
                    </div>

                    {formData.isActive && (
                        <div className="space-y-4 pt-4 border-t border-gray-100 animate-in slide-in-from-top-2">
                            {/* Prefix */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    SKU Prefix
                                </label>
                                <input
                                    type="text"
                                    value={formData.prefix}
                                    onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="e.g., PS-NK-"
                                    required={formData.isActive}
                                />
                                <p className="text-xs text-gray-500 mt-1">This will be added before the numbers.</p>
                            </div>

                            {/* Digits Length */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Number of Digits
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={formData.digitsLength}
                                    onChange={(e) => setFormData({ ...formData, digitsLength: parseInt(e.target.value) || 5 })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required={formData.isActive}
                                />
                                <p className="text-xs text-gray-500 mt-1">Length of the incrementing number. E.g., 5 means 00001.</p>
                            </div>

                            {/* Preview */}
                            <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm flex items-center gap-2">
                                <span className="font-medium text-blue-900">Preview:</span>
                                <code className="bg-white px-2 py-0.5 rounded border border-blue-200">
                                    {formData.prefix}{'1'.padStart(formData.digitsLength, '0')}
                                </code>
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Save Settings
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
