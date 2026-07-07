'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { settingsAPI } from '@/services/api';

export default function HeroBanner() {
    const [bannerData, setBannerData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBanner = async () => {
            try {
                const res = await settingsAPI.getSiteSettings();
                if (res.success && res.data?.topHeroBanner) {
                    setBannerData(res.data.topHeroBanner);
                }
            } catch (error) {
                console.error("Error fetching top hero banner", error);
            } finally {
                setLoading(false);
            }
        };
        fetchBanner();
    }, []);

    if (loading) {
        return (
            <div className="w-full aspect-[5/2] lg:aspect-[5/1] bg-gray-200 animate-pulse"></div>
        );
    }

    if (!bannerData || !bannerData.isActive) {
        return null;
    }

    if (bannerData.type === 'image' && !bannerData.image) return null;
    if (bannerData.type === 'video' && !bannerData.videoUrl) return null;

    const getEmbedUrl = (url) => {
        if (!url) return '';
        try {
            if (url.includes('oembed.json') && url.includes('url=')) {
                const urlObj = new URL(url);
                const embeddedUrl = urlObj.searchParams.get('url');
                if (embeddedUrl) {
                    url = embeddedUrl;
                }
            }

            if (url.includes('youtube.com/watch')) {
                const urlObj = new URL(url);
                const videoId = urlObj.searchParams.get('v');
                if (videoId) {
                    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0`;
                }
            }
            
            if (url.includes('youtu.be/')) {
                const videoId = url.split('youtu.be/')[1]?.split('?')[0];
                if (videoId) {
                    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0`;
                }
            }
            
            if (url.includes('vimeo.com')) {
                let vimeoUrl = url;
                if (!vimeoUrl.includes('player.vimeo.com/video/')) {
                    // Try to convert standard vimeo link to player link
                    const match = vimeoUrl.match(/vimeo\.com\/(\d+)/);
                    if (match && match[1]) {
                        vimeoUrl = `https://player.vimeo.com/video/${match[1]}`;
                    }
                }
                if (!vimeoUrl.includes('background=1')) {
                    vimeoUrl = vimeoUrl + (vimeoUrl.includes('?') ? '&' : '?') + 'background=1';
                }
                return vimeoUrl;
            }
            
            return url;
        } catch (e) {
            return url;
        }
    };

    const renderBackground = () => {
        if (bannerData.type === 'video') {
            const isMp4 = bannerData.videoUrl.endsWith('.mp4');
            if (isMp4) {
                return (
                    <video
                        src={bannerData.videoUrl}
                        className="object-cover w-full h-full"
                        autoPlay
                        loop
                        muted
                        playsInline
                        style={{ position: "absolute", inset: 0 }}
                    />
                );
            }
            
            const embedUrl = getEmbedUrl(bannerData.videoUrl);
            
            return (
                <div className="absolute inset-0 overflow-hidden flex items-center justify-center">
                    <iframe
                        src={embedUrl}
                        className="pointer-events-none"
                        frameBorder="0"
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                        style={{ 
                            width: "150vw", 
                            height: "150vh",
                            maxWidth: "none",
                            transform: "scale(1.2)"
                        }} 
                    />
                </div>
            );
        }

        return (
            <img
                src={bannerData.image}
                alt="Govaly Home banner"
                loading="lazy"
                className="object-cover object-center w-full h-full"
                style={{ position: "absolute", inset: 0 }}
            />
        );
    };

    const renderContent = () => {
        // Only show text content for video banners
        if (bannerData.type === 'image') return null;

        const hasTextContent = bannerData.title || bannerData.subtitle || bannerData.buttonText;
        
        if (!hasTextContent) return null;

        return (
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-center p-4">
                {bannerData.title && (
                    <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-2 md:mb-4 drop-shadow-lg">
                        {bannerData.title}
                    </h2>
                )}
                {bannerData.subtitle && (
                    <p className="text-sm md:text-lg lg:text-xl text-gray-200 mb-6 max-w-3xl drop-shadow-md">
                        {bannerData.subtitle}
                    </p>
                )}
                {bannerData.buttonText && bannerData.link && (
                    <Link
                        href={bannerData.link}
                        className="px-6 py-2.5 md:px-8 md:py-3 bg-pink-500 hover:bg-pink-600 text-white text-sm md:text-base font-semibold rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 pointer-events-auto"
                    >
                        {bannerData.buttonText}
                    </Link>
                )}
            </div>
        );
    };

    return (
        <div>
            <section className="relative aspect-[5/2] lg:aspect-[5/1] w-full overflow-hidden bg-gray-900 group">
                {renderBackground()}
                
                {bannerData.link && !bannerData.buttonText && (
                    <Link href={bannerData.link} className="absolute inset-0 z-10 block" />
                )}
                
                <div className="absolute inset-0 z-20 pointer-events-none">
                    {renderContent()}
                </div>
            </section>
        </div>
    );
}