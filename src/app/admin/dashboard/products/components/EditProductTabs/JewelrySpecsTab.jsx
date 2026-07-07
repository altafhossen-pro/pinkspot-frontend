import React from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

export default function JewelrySpecsTab({ 
    formData, 
    setFormData, 
    handleInputChange, 
    customBraceletSize, 
    setCustomBraceletSize, 
    customRingSize, 
    setCustomRingSize, 
    addSpecification, 
    removeSpecification, 
    updateSpecification 
}) {
    return (
        <div className="space-y-6">
            {/* Jewelry Type Selection */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-6">Jewelry Type & Sizes</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-4">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                name="isBracelet"
                                checked={formData.isBracelet}
                                onChange={handleInputChange}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                            />
                            <span className="ml-2 text-sm font-medium text-gray-700">This is a Bracelet</span>
                        </label>
                        
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                name="isRing"
                                checked={formData.isRing}
                                onChange={handleInputChange}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                            />
                            <span className="ml-2 text-sm font-medium text-gray-700">This is a Ring</span>
                        </label>
                    </div>
                </div>

                {/* Bracelet Sizes */}
                {formData.isBracelet && (
                    <div className="mb-6">
                        <h3 className="text-md font-medium text-gray-900 mb-3">Available Bracelet Sizes</h3>
                        <div className="space-y-3">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={formData.braceletSizes.includes('Adjustable')} 
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setFormData(prev => ({
                                                ...prev,
                                                braceletSizes: [...prev.braceletSizes, 'Adjustable']
                                            }));
                                        } else {
                                            setFormData(prev => ({
                                                ...prev,
                                                braceletSizes: prev.braceletSizes.filter(size => size !== 'Adjustable')
                                            }));
                                        }
                                    }} 
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" 
                                />
                                <span className="text-sm text-gray-700">Adjustable</span>
                            </label>
                            
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="text"
                                        placeholder="Add custom size (e.g., 7.5, 8, 8.5)"
                                        value={customBraceletSize}
                                        onChange={(e) => setCustomBraceletSize(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                const trimmed = customBraceletSize.trim();
                                                if (trimmed && !formData.braceletSizes.includes(trimmed)) {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        braceletSizes: [...prev.braceletSizes, trimmed]
                                                    }));
                                                    setCustomBraceletSize('');
                                                }
                                            }
                                        }}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const trimmed = customBraceletSize.trim();
                                            if (trimmed && !formData.braceletSizes.includes(trimmed)) {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    braceletSizes: [...prev.braceletSizes, trimmed]
                                                }));
                                                setCustomBraceletSize('');
                                            }
                                        }}
                                        className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 cursor-pointer"
                                    >
                                        Add
                                    </button>
                                </div>
                                
                                {formData.braceletSizes.filter(size => size !== 'Adjustable').length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {formData.braceletSizes.filter(size => size !== 'Adjustable').map((size, index) => (
                                            <span key={index} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                                                {size}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            braceletSizes: prev.braceletSizes.filter(s => s !== size)
                                                        }));
                                                    }}
                                                    className="ml-2 text-blue-600 hover:text-blue-800 cursor-pointer"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Ring Sizes */}
                {formData.isRing && (
                    <div className="mb-6">
                        <h3 className="text-md font-medium text-gray-900 mb-3">Available Ring Sizes</h3>
                        <div className="space-y-3">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={formData.ringSizes.includes('Adjustable')} 
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setFormData(prev => ({
                                                ...prev,
                                                ringSizes: [...prev.ringSizes, 'Adjustable']
                                            }));
                                        } else {
                                            setFormData(prev => ({
                                                ...prev,
                                                ringSizes: prev.ringSizes.filter(size => size !== 'Adjustable')
                                            }));
                                        }
                                    }} 
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" 
                                />
                                <span className="text-sm text-gray-700">Adjustable</span>
                            </label>
                            
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="text"
                                        placeholder="Add custom size (e.g., 6, 7, 8, M, L)"
                                        value={customRingSize}
                                        onChange={(e) => setCustomRingSize(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                const trimmed = customRingSize.trim();
                                                if (trimmed && !formData.ringSizes.includes(trimmed)) {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        ringSizes: [...prev.ringSizes, trimmed]
                                                    }));
                                                    setCustomRingSize('');
                                                }
                                            }
                                        }}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const trimmed = customRingSize.trim();
                                            if (trimmed && !formData.ringSizes.includes(trimmed)) {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    ringSizes: [...prev.ringSizes, trimmed]
                                                }));
                                                setCustomRingSize('');
                                            }
                                        }}
                                        className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 cursor-pointer"
                                    >
                                        Add
                                    </button>
                                </div>
                                
                                {formData.ringSizes.filter(size => size !== 'Adjustable').length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {formData.ringSizes.filter(size => size !== 'Adjustable').map((size, index) => (
                                            <span key={index} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                                                {size}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            ringSizes: prev.ringSizes.filter(s => s !== size)
                                                        }));
                                                    }}
                                                    className="ml-2 text-blue-600 hover:text-blue-800 cursor-pointer"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Product Specifications */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-medium text-gray-900">Specifications</h2>
                    <button
                        type="button"
                        onClick={addSpecification}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100 cursor-pointer transition-colors"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Specification
                    </button>
                </div>

                {formData.specifications.length === 0 ? (
                    <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <p className="text-sm text-gray-500">No specifications added yet.</p>
                        <button
                            type="button"
                            onClick={addSpecification}
                            className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                        >
                            Click to add one
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {formData.specifications.map((spec, index) => (
                            <div key={index} className="flex gap-4 items-start bg-gray-50 p-4 rounded-lg">
                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Key (e.g. Material)</label>
                                        <input
                                            type="text"
                                            value={spec.key}
                                            onChange={(e) => updateSpecification(index, 'key', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Property Name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Value (e.g. 18k Gold)</label>
                                        <input
                                            type="text"
                                            value={spec.value}
                                            onChange={(e) => updateSpecification(index, 'value', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Property Value"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeSpecification(index)}
                                    className="p-2 text-gray-400 hover:text-red-500 mt-5 transition-colors cursor-pointer"
                                    title="Remove specification"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
