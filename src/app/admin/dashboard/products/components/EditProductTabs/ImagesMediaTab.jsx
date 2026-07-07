import React from 'react';
import { X } from 'lucide-react';
import ImageUpload from '@/components/Common/ImageUpload';
import GalleryImageUpload from '@/components/Common/GalleryImageUpload';

export default function ImagesMediaTab({ 
    formData, 
    setFormData, 
    videoInput, 
    setVideoInput, 
    addProductVideo, 
    removeProductVideo, 
    getVideoPlatformName 
}) {
    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-6">Product Images</h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Featured Image */}
                    <div className="lg:col-span-1 border-r border-gray-200 pr-6">
                        <h3 className="text-sm font-medium text-gray-700 mb-4">Featured Image *</h3>
                        <p className="text-xs text-gray-500 mb-4">
                            Main image that will be shown on product cards and listings.
                            <br />Recommended size: 800x800px
                        </p>
                        <ImageUpload
                            value={formData.featuredImage}
                            onChange={(url) => setFormData(prev => ({ ...prev, featuredImage: url }))}
                        />
                    </div>

                    {/* Gallery Images */}
                    <div className="lg:col-span-2 pl-2">
                        <h3 className="text-sm font-medium text-gray-700 mb-4">Product Gallery</h3>
                        <p className="text-xs text-gray-500 mb-4">
                            Additional images to show different angles or details.
                            <br />You can upload multiple images.
                        </p>
                        <GalleryImageUpload
                            values={formData.gallery}
                            onChange={(urls) => setFormData(prev => ({ ...prev, gallery: urls }))}
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-medium text-gray-900">Product Videos</h2>
                    <span className="text-sm text-gray-500">Optional</span>
                </div>
                
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="w-full sm:w-1/3">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Platform
                            </label>
                            <select
                                value={videoInput.platform}
                                onChange={(e) => setVideoInput(prev => ({ ...prev, platform: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="youtube">YouTube</option>
                                <option value="tiktok">TikTok</option>
                                <option value="vimeo">Vimeo</option>
                                <option value="facebook">Facebook</option>
                                <option value="instagram">Instagram</option>
                                <option value="other">Other/Custom URL</option>
                            </select>
                        </div>
                        <div className="w-full sm:flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Video URL
                            </label>
                            <input
                                type="text"
                                value={videoInput.url}
                                onChange={(e) => setVideoInput(prev => ({ ...prev, url: e.target.value }))}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        addProductVideo();
                                    }
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Paste video link here (e.g. https://youtube.com/watch?v=...)"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={addProductVideo}
                            className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                        >
                            Add Video
                        </button>
                    </div>

                    {/* Video List */}
                    {formData.productVideos.length > 0 && (
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <ul className="divide-y divide-gray-200">
                                {formData.productVideos.map((url, index) => (
                                    <li key={index} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center space-x-3 truncate pr-4">
                                            <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 shrink-0">
                                                {getVideoPlatformName(url)}
                                            </span>
                                            <a 
                                                href={url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-sm text-blue-600 hover:text-blue-800 truncate"
                                            >
                                                {url}
                                            </a>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeProductVideo(url)}
                                            className="p-2 text-gray-400 hover:text-red-500 transition-colors shrink-0 cursor-pointer"
                                            title="Remove video"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
