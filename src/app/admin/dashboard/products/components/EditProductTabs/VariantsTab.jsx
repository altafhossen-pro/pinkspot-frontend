import React from 'react';
import { Plus, Trash2, Edit } from 'lucide-react';
import ImageUpload from '@/components/Common/ImageUpload';

export default function VariantsTab({ 
    formData, 
    setFormData, 
    variantForm, 
    handleVariantInputChange, 
    hasColorVariants, 
    setHasColorVariants, 
    addVariant, 
    removeVariant, 
    updateVariant, 
    updateVariantAttribute,
    setVariantForm,
    onManageStock
}) {
    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-medium text-gray-900">Add Variant</h2>
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={hasColorVariants}
                            onChange={(e) => setHasColorVariants(e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm font-medium text-gray-700">Enable Colors</span>
                    </label>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-lg border border-gray-100">
                    {hasColorVariants && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Color Name *
                                </label>
                                <input
                                    type="text"
                                    name="color"
                                    value={variantForm.color}
                                    onChange={handleVariantInputChange}
                                    placeholder="e.g. Rose Gold, Silver"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Color Code
                                </label>
                                <div className="flex space-x-2">
                                    <input
                                        type="color"
                                        name="colorCode"
                                        value={variantForm.colorCode}
                                        onChange={handleVariantInputChange}
                                        className="h-10 w-10 p-1 border border-gray-300 rounded-lg cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        name="colorCode"
                                        value={variantForm.colorCode}
                                        onChange={handleVariantInputChange}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Size (Optional)
                        </label>
                        <input
                            type="text"
                            name="size"
                            value={variantForm.size}
                            onChange={handleVariantInputChange}
                            placeholder="e.g. Small, 7.5, Adjustable"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            SKU (Optional - auto generated if empty)
                        </label>
                        <input
                            type="text"
                            name="sku"
                            value={variantForm.sku}
                            onChange={handleVariantInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Current Price (৳) *
                        </label>
                        <input
                            type="number"
                            name="currentPrice"
                            value={variantForm.currentPrice}
                            onChange={handleVariantInputChange}
                            min="0"
                            step="0.01"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Old Price (৳)
                        </label>
                        <input
                            type="number"
                            name="oldPrice"
                            value={variantForm.oldPrice}
                            onChange={handleVariantInputChange}
                            min="0"
                            step="0.01"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Stock Quantity *
                        </label>
                        <input
                            type="number"
                            name="stock"
                            value={variantForm.stock}
                            onChange={handleVariantInputChange}
                            min="0"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Variant Image
                        </label>
                        <ImageUpload
                            value={variantForm.image}
                            onChange={(url) => setVariantForm(prev => ({ ...prev, image: url }))}
                        />
                    </div>

                    <div className="md:col-span-2 pt-2">
                        <button
                            type="button"
                            onClick={addVariant}
                            className="w-full flex justify-center items-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer font-medium"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Add Variant
                        </button>
                    </div>
                </div>
            </div>

            {/* Added Variants List */}
            {formData.variants.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                        <h2 className="text-lg font-medium text-gray-900">Current Variants ({formData.variants.length})</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attributes</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price (৳)</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {formData.variants.map((variant, vIndex) => (
                                    <tr key={vIndex} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {variant.images && variant.images[0]?.url ? (
                                                <img 
                                                    src={variant.images[0].url} 
                                                    alt="Variant" 
                                                    className="h-12 w-12 object-cover rounded-md border border-gray-200"
                                                />
                                            ) : (
                                                <div className="h-12 w-12 bg-gray-100 rounded-md flex items-center justify-center text-gray-400 border border-gray-200 text-xs">
                                                    No Img
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-2">
                                                {variant.attributes.map((attr, aIndex) => (
                                                    <div key={aIndex} className="flex items-center space-x-2">
                                                        <span className="text-xs font-medium text-gray-500 w-12">{attr.name}:</span>
                                                        {attr.name.toLowerCase() === 'color' ? (
                                                            <div className="flex items-center space-x-2">
                                                                <input
                                                                    type="color"
                                                                    value={attr.hexCode || '#000000'}
                                                                    onChange={(e) => updateVariantAttribute(vIndex, aIndex, 'hexCode', e.target.value)}
                                                                    className="h-6 w-6 rounded cursor-pointer border border-gray-300"
                                                                />
                                                                <input
                                                                    type="text"
                                                                    value={attr.value}
                                                                    onChange={(e) => updateVariantAttribute(vIndex, aIndex, 'value', e.target.value)}
                                                                    className="text-sm px-2 py-1 border border-gray-300 rounded"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <input
                                                                type="text"
                                                                value={attr.value}
                                                                onChange={(e) => updateVariantAttribute(vIndex, aIndex, 'value', e.target.value)}
                                                                className="text-sm px-2 py-1 border border-gray-300 rounded"
                                                            />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="text"
                                                value={variant.sku || ''}
                                                onChange={(e) => updateVariant(vIndex, 'sku', e.target.value)}
                                                className="w-32 text-sm px-2 py-1 border border-gray-300 rounded"
                                                placeholder="SKU"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="space-y-1">
                                                <input
                                                    type="number"
                                                    value={variant.currentPrice || ''}
                                                    onChange={(e) => updateVariant(vIndex, 'currentPrice', parseFloat(e.target.value))}
                                                    className="w-24 text-sm px-2 py-1 border border-gray-300 rounded"
                                                    placeholder="Price"
                                                />
                                                <input
                                                    type="number"
                                                    value={variant.originalPrice || ''}
                                                    onChange={(e) => updateVariant(vIndex, 'originalPrice', parseFloat(e.target.value))}
                                                    className="w-24 text-sm px-2 py-1 border border-gray-300 rounded text-gray-500 line-through"
                                                    placeholder="Old Price"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="number"
                                                    value={variant.stockQuantity || 0}
                                                    readOnly
                                                    className="w-20 text-sm px-2 py-1 border border-gray-300 rounded bg-gray-50 cursor-not-allowed"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => onManageStock(variant, vIndex)}
                                                    className="px-2 py-1 bg-gray-100 text-gray-700 border border-gray-300 rounded text-xs hover:bg-gray-200 transition-colors"
                                                    title="Manage Stock"
                                                >
                                                    <Edit className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                type="button"
                                                onClick={() => removeVariant(vIndex)}
                                                className="text-red-600 hover:text-red-900 bg-red-50 p-2 rounded-md hover:bg-red-100 transition-colors cursor-pointer"
                                                title="Remove Variant"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
