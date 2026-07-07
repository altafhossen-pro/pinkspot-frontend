import React from 'react';
import { X } from 'lucide-react';

export default function BasicInfoTab({ 
    formData, 
    handleInputChange, 
    categories, 
    tagInput, 
    setTagInput, 
    handleTagInputKeyPress, 
    addTag, 
    removeTag, 
    generateSlug 
}) {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product Title *
                    </label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Slug
                    </label>
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            name="slug"
                            value={formData.slug}
                            onChange={handleInputChange}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                            type="button"
                            onClick={generateSlug}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors"
                        >
                            Generate
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category *
                    </label>
                    <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                    >
                        <option value="">Select Category</option>
                        {categories.map(category => (
                            <option key={category._id} value={category._id}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Brand
                    </label>
                    <input
                        type="text"
                        name="brand"
                        value={formData.brand}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                    </label>
                    <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tags
                    </label>
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <input
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyPress={handleTagInputKeyPress}
                                placeholder="Type tag and press Enter"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <button
                                type="button"
                                onClick={addTag}
                                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            >
                                Add
                            </button>
                        </div>
                        {formData.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {formData.tags.map((tag, index) => (
                                    <span 
                                        key={index} 
                                        className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full"
                                    >
                                        {tag}
                                        <button
                                            type="button"
                                            onClick={() => removeTag(tag)}
                                            className="ml-2 text-gray-500 hover:text-red-600 cursor-pointer"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Short Description
                </label>
                <textarea
                    name="shortDescription"
                    value={formData.shortDescription}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Brief description of the product"
                />
            </div>

            <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Description (Optional)
                </label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="6"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Detailed description of the product"
                />
            </div>

            <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Announcement / Instruction Text (Optional)
                </label>
                <textarea
                    name="announcementText"
                    value={formData.announcementText || ''}
                    onChange={handleInputChange}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Dynamic text to display below the Buy Now button"
                />
            </div>
        </div>
    );
}
