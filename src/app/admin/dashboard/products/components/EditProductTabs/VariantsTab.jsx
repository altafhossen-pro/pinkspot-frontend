import React, { useState } from 'react';
import { Plus, Trash2, Edit, Upload, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import ImageUpload from '@/components/Common/ImageUpload';
import { uploadAPI } from '@/services/api';
import toast from 'react-hot-toast';

export default function VariantsTab({ 
    formData, 
    setFormData, 
    variantForm, 
    setVariantForm, 
    skuSuggestion,
    handleVariantInputChange, 
    hasColorVariants, 
    setHasColorVariants, 
    addVariant, 
    removeVariant, 
    updateVariant, 
    updateVariantAttribute,
    onManageStock,
    onAutoGenerateSku,
    moveVariant
}) {
    const [uploadingVariantIndex, setUploadingVariantIndex] = useState(null);

    const handleVariantImageUpload = async (file, vIndex) => {
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        setUploadingVariantIndex(vIndex);
        const loadingToast = toast.loading('Uploading image...');

        try {
            const formDataToUpload = new FormData();
            formDataToUpload.append('image', file);
            const data = await uploadAPI.uploadSingle(formDataToUpload);

            if (data.success) {
                updateVariant(vIndex, 'images', [{ url: data.data.url, altText: 'Variant' }]);
                toast.success('Variant image updated successfully!', { id: loadingToast });
            } else {
                toast.error(data.message || 'Upload failed', { id: loadingToast });
            }
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Upload failed. Please try again.', { id: loadingToast });
        } finally {
            setUploadingVariantIndex(null);
        }
    };

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
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                                SKU (Optional - auto generated if empty)
                            </label>
                            {onAutoGenerateSku && (
                                <button
                                    type="button"
                                    onClick={() => onAutoGenerateSku()}
                                    className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                                >
                                    Auto Generate
                                </button>
                            )}
                        </div>
                        <input
                            type="text"
                            name="sku"
                            value={variantForm.sku}
                            onChange={handleVariantInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {skuSuggestion && (
                            <p className="mt-1 text-xs text-green-600">{skuSuggestion}</p>
                        )}
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

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Sort Order *
                        </label>
                        <input
                            type="number"
                            name="sortOrder"
                            value={variantForm.sortOrder}
                            onChange={handleVariantInputChange}
                            min="1"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Variant Image
                        </label>
                        <ImageUpload
                            currentImage={variantForm.image}
                            onImageUpload={(url) => setVariantForm(prev => ({ ...prev, image: url }))}
                            onImageRemove={() => setVariantForm(prev => ({ ...prev, image: '' }))}
                        />
                    </div>

                    <div className="flex flex-col items-end w-full space-y-4">
                        <p className="text-xs text-gray-500 text-left w-full">
                            Note: Use the <span className="font-semibold text-gray-700">Sort Order</span> field to organize the order of colors/images when multiple variants have the same size. Lower number means first.
                        </p>
                        <button
                            type="button"
                            onClick={addVariant}
                            className="inline-flex items-center px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 focus:ring-4 focus:ring-gray-200 transition-colors cursor-pointer"
                        >
                            <Plus className="w-4 h-4 mr-2" />
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
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sort Order</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {formData.variants.map((variant, vIndex) => (
                                    <tr key={vIndex} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="relative group inline-block">
                                                {variant.images && variant.images[0]?.url ? (
                                                    <img 
                                                        src={variant.images[0].url} 
                                                        alt="Variant" 
                                                        className={`h-12 w-12 object-cover rounded-md border border-gray-200 ${uploadingVariantIndex === vIndex ? 'opacity-50' : ''}`}
                                                    />
                                                ) : (
                                                    <div className="h-12 w-12 bg-gray-100 rounded-md flex items-center justify-center text-gray-400 border border-gray-200 text-xs">
                                                        No Img
                                                    </div>
                                                )}
                                                
                                                {uploadingVariantIndex === vIndex ? (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-md">
                                                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                                                    </div>
                                                ) : (
                                                    <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-md cursor-pointer" title="Change Image">
                                                        <Upload className="w-4 h-4" />
                                                        <input 
                                                            type="file" 
                                                            className="hidden" 
                                                            accept="image/*"
                                                            onChange={(e) => {
                                                                if (e.target.files && e.target.files[0]) {
                                                                    handleVariantImageUpload(e.target.files[0], vIndex);
                                                                }
                                                            }}
                                                        />
                                                    </label>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-2">
                                                {(() => {
                                                    const attrs = variant.attributes || [];
                                                    const sizeAttr = attrs.find(a => a.name.toLowerCase() === 'size') || { name: 'Size', value: '' };
                                                    const colorAttr = attrs.find(a => a.name.toLowerCase() === 'color') || { name: 'Color', value: '', hexCode: '#000000' };
                                                    
                                                    const handleAttrChange = (attrName, field, value) => {
                                                        const newAttrs = [...attrs];
                                                        const idx = newAttrs.findIndex(a => a.name.toLowerCase() === attrName.toLowerCase());
                                                        if (idx >= 0) {
                                                            newAttrs[idx] = { ...newAttrs[idx], [field]: value, ...(field === 'value' ? { displayValue: value } : {}) };
                                                        } else {
                                                            const newA = { name: attrName, value: field === 'value' ? value : '', displayValue: field === 'value' ? value : '' };
                                                            if (field === 'hexCode' || attrName.toLowerCase() === 'color') {
                                                                newA.hexCode = field === 'hexCode' ? value : '#000000';
                                                            }
                                                            newAttrs.push(newA);
                                                        }
                                                        updateVariant(vIndex, 'attributes', newAttrs);
                                                    };

                                                    return (
                                                        <>
                                                            <div className="flex items-center space-x-2">
                                                                <span className="text-xs font-medium text-gray-500 w-12">Size:</span>
                                                                <input
                                                                    type="text"
                                                                    value={sizeAttr.value}
                                                                    onChange={(e) => handleAttrChange('Size', 'value', e.target.value)}
                                                                    className="text-sm px-2 py-1 border border-gray-300 rounded w-full max-w-[120px]"
                                                                    placeholder="Size"
                                                                />
                                                            </div>
                                                            {hasColorVariants && (
                                                                <div className="flex items-center space-x-2 mt-2">
                                                                    <span className="text-xs font-medium text-gray-500 w-12">Color:</span>
                                                                    <div className="flex items-center space-x-1">
                                                                        <input
                                                                            type="color"
                                                                            value={colorAttr.hexCode || '#000000'}
                                                                            onChange={(e) => handleAttrChange('Color', 'hexCode', e.target.value)}
                                                                            className="h-6 w-6 rounded cursor-pointer border border-gray-300 shrink-0"
                                                                        />
                                                                        <input
                                                                            type="text"
                                                                            value={colorAttr.value}
                                                                            onChange={(e) => handleAttrChange('Color', 'value', e.target.value)}
                                                                            className="text-sm px-2 py-1 border border-gray-300 rounded w-full max-w-[90px]"
                                                                            placeholder="Color"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="text"
                                                    value={variant.sku || ''}
                                                    onChange={(e) => updateVariant(vIndex, 'sku', e.target.value)}
                                                    className="w-32 text-sm px-2 py-1 border border-gray-300 rounded"
                                                    placeholder="SKU"
                                                />
                                                {onAutoGenerateSku && (
                                                    <button
                                                        type="button"
                                                        onClick={() => onAutoGenerateSku(vIndex)}
                                                        className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer"
                                                        title="Auto Generate"
                                                    >
                                                        Auto
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="number"
                                                value={variant.sortOrder || 1}
                                                onChange={(e) => updateVariant(vIndex, 'sortOrder', parseInt(e.target.value))}
                                                className="w-20 text-sm px-2 py-1 border border-gray-300 rounded"
                                                min="1"
                                                placeholder="Order"
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
                                            <div className="flex justify-end space-x-2">
                                                {moveVariant && (
                                                    <div className="flex flex-col space-y-1 mr-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => moveVariant(vIndex, 'up')}
                                                            disabled={vIndex === 0}
                                                            className={`p-1 rounded text-gray-500 hover:bg-gray-100 hover:text-blue-600 ${vIndex === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
                                                            title="Move Up"
                                                        >
                                                            <ChevronUp className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => moveVariant(vIndex, 'down')}
                                                            disabled={vIndex === formData.variants.length - 1}
                                                            className={`p-1 rounded text-gray-500 hover:bg-gray-100 hover:text-blue-600 ${vIndex === formData.variants.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
                                                            title="Move Down"
                                                        >
                                                            <ChevronDown className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => removeVariant(vIndex)}
                                                    className="text-red-600 hover:text-red-900 bg-red-50 p-2 rounded-md hover:bg-red-100 transition-colors cursor-pointer"
                                                    title="Remove Variant"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
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
