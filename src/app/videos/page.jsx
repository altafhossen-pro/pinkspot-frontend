'use client'

import React, { useState, useEffect } from 'react';
import { ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { productAPI, settingsAPI } from '@/services/api';
import toast from 'react-hot-toast';

const parseVideoUrl = (url, autoplayEnabled = true) => {
    if (!url) return { type: 'unknown', url };
    try {
        if (url.includes('tiktok.com')) {
            const match = url.match(/video\/(\d+)/);
            if (match && match[1]) {
                return { type: 'tiktok', id: match[1], url: url };
            }
            return { type: 'unknown', url };
        }
        else if (url.includes('youtube.com/watch') || url.includes('youtu.be/') || url.includes('youtube.com/shorts/') || url.includes('youtube.com/embed/')) {
            let videoId = '';
            if (url.includes('youtube.com/watch')) {
                const urlParams = new URLSearchParams(new URL(url).search);
                videoId = urlParams.get('v');
            } else if (url.includes('youtu.be/')) {
                videoId = url.split('youtu.be/')[1]?.split('?')[0];
            } else if (url.includes('youtube.com/shorts/')) {
                videoId = url.split('youtube.com/shorts/')[1]?.split('?')[0];
            } else if (url.includes('youtube.com/embed/')) {
                videoId = url.split('youtube.com/embed/')[1]?.split('?')[0];
            }
            if (videoId) {
                const autoplayParams = autoplayEnabled ? `?autoplay=1&mute=1&loop=1&playlist=${videoId}` : `?loop=1&playlist=${videoId}`;
                return { type: 'youtube', id: videoId, embedUrl: `https://www.youtube.com/embed/${videoId}${autoplayParams}` };
            }
        }
        return { type: 'unknown', url };
    } catch (error) {
        return { type: 'unknown', url };
    }
};

const TikTokEmbed = ({ url, videoId }) => {
    useEffect(() => {
        // Remove existing script if it exists to force reload of embed
        const existingScript = document.getElementById('tiktok-embed-script');
        if (existingScript) {
            existingScript.remove();
        }

        const script = document.createElement('script');
        script.id = 'tiktok-embed-script';
        script.src = 'https://www.tiktok.com/embed.js';
        script.async = true;
        document.body.appendChild(script);

        return () => {
            if (script && script.parentNode) {
                script.parentNode.removeChild(script);
            }
        };
    }, [url, videoId]);

    return (
        <div className="w-full h-full overflow-y-auto bg-black flex items-center justify-center">
            <blockquote
                className="tiktok-embed"
                cite={url}
                data-video-id={videoId}
                style={{ maxWidth: '100%', minWidth: '325px', margin: 0 }}
            >
                <section></section>
            </blockquote>
        </div>
    );
};

const VideoCard = ({ video, autoplayEnabled }) => {
    const videoData = parseVideoUrl(video.videoUrl, autoplayEnabled);

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 group">
            {/* Video Container */}
            <div className="relative w-full aspect-[9/16] bg-gray-900 overflow-hidden flex items-center justify-center">
                {videoData.type === 'youtube' && (
                    <iframe
                        width="100%"
                        height="100%"
                        src={videoData.embedUrl}
                        title={`${video.productName} video player`}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                        className="absolute inset-0 w-full h-full"
                    />
                )}

                {videoData.type === 'tiktok' && (
                    <TikTokEmbed url={videoData.url} videoId={videoData.id} />
                )}

                {videoData.type === 'unknown' && (
                    <div className="text-gray-400 text-sm text-center p-4">
                        Invalid video link.<br />
                        <span className="text-xs break-all">{video.videoUrl}</span>
                    </div>
                )}
            </div>

            {/* Product Info */}
            <div className="p-5 space-y-4">


                {/* View Product Link */}
                <div className="flex items-center justify-center">
                    {video.slug ? (
                        <Link
                            href={`/product/${video.slug}`}
                            className="px-6 py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 flex items-center gap-2 cursor-pointer"
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
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [autoplayEnabled, setAutoplayEnabled] = useState(true);
    const itemsPerPage = 12;

    useEffect(() => {
        const fetchVideos = async () => {
            try {
                setLoading(true);
                const [videosResponse, settingsResponse] = await Promise.all([
                    productAPI.getProductVideos(currentPage, itemsPerPage),
                    settingsAPI.getSiteSettings()
                ]);

                if (settingsResponse.success && settingsResponse.data) {
                    setAutoplayEnabled(settingsResponse.data.isVideoAutoplayEnabled ?? true);
                }

                if (videosResponse.success) {
                    const videoList = videosResponse.data.map((item, index) => ({
                        id: `${item._id}-${index}`,
                        productName: item.title,
                        videoUrl: item.videoUrl,
                        slug: item.slug,
                        featuredImage: item.featuredImage
                    }));
                    setVideos(videoList);
                    if (videosResponse.pagination) {
                        setTotalPages(videosResponse.pagination.totalPages);
                    }
                } else {
                    toast.error('Failed to load videos: ' + videosResponse.message);
                }
            } catch (error) {
                console.error('Error fetching videos:', error);
                toast.error('Error loading videos');
            } finally {
                setLoading(false);
            }
        };

        fetchVideos();
    }, [currentPage]);

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-4 lg:px-4">
                {/* Page Header */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-gray-900 mb-3">Product Videos</h1>
                    <p className="text-gray-600 text-lg">Explore our latest collections</p>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                        {[...Array(12)].map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden animate-pulse">
                                {/* Video Container Skeleton */}
                                <div className="relative w-full aspect-[9/16] bg-gray-200"></div>
                                
                                {/* Product Info Skeleton */}
                                <div className="p-5 space-y-4 flex flex-col items-center">
                                    <div className="h-10 bg-gray-200 rounded-lg w-32"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : videos.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-gray-500 text-lg">No videos available at the moment.</p>
                    </div>
                ) : (() => {
                    const validVideos = videos;

                    return (
                        <>
                            {/* Video Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                                {validVideos.map((video) => (
                                    <VideoCard key={video.id} video={video} autoplayEnabled={autoplayEnabled} />
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="mt-12 flex items-center justify-center space-x-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Previous
                                    </button>

                                    <div className="flex space-x-1 flex-wrap justify-center gap-y-2">
                                        {[...Array(totalPages)].map((_, index) => (
                                            <button
                                                key={index}
                                                onClick={() => setCurrentPage(index + 1)}
                                                className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${currentPage === index + 1
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {index + 1}
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </>
                    );
                })()}
            </div>
        </div>
    );
};

export default page;