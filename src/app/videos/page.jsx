'use client'

import React, { useState, useEffect } from 'react';
import { ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { productAPI } from '@/services/api';
import toast from 'react-hot-toast';

const VideoCard = ({ video }) => {

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 group">
            {/* Video Container */}
            <div className="relative w-full aspect-video bg-gray-900 overflow-hidden">
                <iframe
                    width="100%"
                    height="100%"
                    src={video.videoUrl}
                    title={`${video.productName} video player`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                />
            </div>

            {/* Product Info */}
            <div className="p-5 space-y-4">
                {/* Product Name */}
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 ">
                    {video.productName}
                </h3>

                {/* View Product Link */}
                <div className="flex items-center justify-end">
                    {video.slug ? (
                        <Link
                            href={`/product/${video.slug}`}
                            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 flex items-center gap-2 cursor-pointer"
                        >
                            <ShoppingBag className="h-4 w-4" />
                            View Product
                        </Link>
                    ) : (
                        <span className="px-6 py-2.5 bg-gray-400 text-white text-sm font-medium rounded-xl flex items-center gap-2 cursor-not-allowed">
                            <ShoppingBag className="h-4 w-4" />
                            View Product
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

const page = () => {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVideos = async () => {
            try {
                setLoading(true);
                const response = await productAPI.getProductVideos();
                
                if (response.success) {
                    // Transform products with videos into flat video array
                    // Each product can have multiple videos, so we create a card for each video
                    const videoList = [];
                    response.data.forEach((product, productIndex) => {
                        if (product.productVideos && product.productVideos.length > 0) {
                            product.productVideos.forEach((videoUrl, videoIndex) => {
                                // Only add video if videoUrl exists and is not empty
                                if (videoUrl && videoUrl.trim() !== '') {
                                    videoList.push({
                                        id: `${product._id || productIndex}-${videoIndex}`,
                                        productName: product.title,
                                        videoUrl: videoUrl,
                                        slug: product.slug,
                                        featuredImage: product.featuredImage
                                    });
                                }
                            });
                        }
                    });
                    setVideos(videoList);
                } else {
                    toast.error('Failed to load videos: ' + response.message);
                }
            } catch (error) {
                console.error('Error fetching videos:', error);
                toast.error('Error loading videos');
            } finally {
                setLoading(false);
            }
        };

        fetchVideos();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Page Header */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-gray-900 mb-3">Product Videos</h1>
                    <p className="text-gray-600 text-lg">Explore our latest collections</p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <span className="text-gray-600">Loading videos...</span>
                        </div>
                    </div>
                ) : videos.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-gray-500 text-lg">No videos available at the moment.</p>
                    </div>
                ) : (
                    /* Video Grid - 3 columns on large screens, 2 on medium, 1 on small */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                        {videos
                            .filter((video) => video.videoUrl && video.videoUrl.trim() !== '')
                            .map((video) => (
                                <VideoCard key={video.id} video={video} />
                            ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default page;