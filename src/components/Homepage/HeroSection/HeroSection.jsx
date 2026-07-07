'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { heroBannerAPI, heroProductAPI } from '@/services/api';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import './HeroSection.css';


function HeroSlider({ sliderData, loading }) {
    if (loading) {
        return (
            <div className="w-full h-full bg-gradient-to-r from-pink-100 via-pink-50 to-pink-100 rounded-2xl flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading hero banners...</p>
                </div>
            </div>
        );
    }

    if (!sliderData || sliderData.length === 0) {
        return (
            <div className="w-full h-full bg-gradient-to-r from-pink-100 via-pink-50 to-pink-100 rounded-2xl flex items-center justify-center">
                <div className="text-center p-8">
                    <div className="w-20 h-20 mx-auto mb-6 bg-pink-200 rounded-full flex items-center justify-center">
                        <svg className="w-10 h-10 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No Hero Banners</h3>
                    <p className="text-gray-500 mb-4">Hero banners will appear here once added by admin</p>
                    <div className="inline-flex items-center px-4 py-2 bg-pink-100 text-pink-700 rounded-lg text-sm font-medium">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Contact admin to add banners
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full">
        <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            spaceBetween={0}
            slidesPerView={1}
            navigation={true}
            pagination={{
                clickable: true,
                el: '.swiper-pagination',
                bulletClass: 'swiper-pagination-bullet',
                bulletActiveClass: 'swiper-pagination-bullet-active',
            }}
            // autoplay={{
            //     delay: 4500,
            //     disableOnInteraction: false,
            // }}
            loop={sliderData.length > 1}
            className="w-full h-full"
        >
            {sliderData.map((slide) => (
                <SwiperSlide key={slide._id || slide.id} className="h-full">
                    {slide.link ? (
                        <Link href={slide.link} className="block w-full h-full">
                            <img
                                src={slide.image}
                                alt="Hero Banner"
                                className="w-full h-full object-cover rounded-2xl cursor-pointer"
                            />
                        </Link>
                    ) : (
                        <img
                            src={slide.image}
                            alt="Hero Banner"
                            className="w-full h-full object-cover rounded-2xl"
                        />
                    )}
                </SwiperSlide>
            ))}


            {/* Custom Pagination */}
            <div className="swiper-pagination !bottom-4 sm:!bottom-6"></div>
        </Swiper>
        </div>
    );
}

function ProductImageGrid({ productImages, loading }) {
    if (loading) {
        return (
            <div className="flex flex-col gap-2 sm:gap-4">
                <div className="relative group overflow-hidden rounded-xl shadow-lg animate-pulse bg-gray-200 h-48"></div>
                <div className="flex gap-2 sm:gap-4 h-24 sm:h-32 md:h-44">
                    <div className="flex-1 relative group overflow-hidden rounded-xl shadow-lg animate-pulse bg-gray-200"></div>
                    <div className="flex-1 relative group overflow-hidden rounded-xl shadow-lg animate-pulse bg-gray-200"></div>
                </div>
            </div>
        );
    }

    if (!productImages || productImages.length === 0) {
        return (
            <div className="flex flex-col gap-2 sm:gap-4">
                <div className="relative group overflow-hidden rounded-xl shadow-lg bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                    <div className="text-center p-6">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Featured Products</h3>
                        <p className="text-sm text-gray-500">Products will appear here once added by admin</p>
                    </div>
                </div>
            </div>
        );
    }

    const [largeImage] = productImages.filter(img => img.size === 'large');
    const smallImages = productImages.filter(img => img.size === 'small');

    return (
        <div className="flex flex-col gap-2 sm:gap-4">
            {/* Top Large Image */}
            {largeImage && (
                <Link 
                    href={`/product/${largeImage.productId?.slug}`}
                    className="relative group overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer block"
                >
                    <img
                        src={largeImage.customImage || largeImage.productId?.featuredImage || largeImage.productId?.images?.[0] || "/images/placeholder.png"}
                        alt={largeImage.productId?.title || largeImage.productId?.name || "Featured Product"}
                        className="w-full aspect-[16/9] object-cover group-hover:scale-105 transition-transform duration-500 h-48"
                    />
                    {/* Badge */}
                    {largeImage.badge?.text && (
                        <div className={`absolute top-2 sm:top-4 left-2 sm:left-4 ${largeImage.badge.color} text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold shadow-lg`}>
                            {largeImage.badge.text}
                        </div>
                    )}
                </Link>
            )}

            {/* Bottom Two Small Images */}
            <div className="flex gap-2 sm:gap-4 h-24 sm:h-32 md:h-44">
                {smallImages.map((product) => (
                    <Link
                        key={product._id}
                        href={`/product/${product.productId?.slug}`}
                        className="flex-1 relative group overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer block"
                    >
                        <img
                            src={product.customImage || product.productId?.featuredImage || product.productId?.images?.[0] || "/images/placeholder.png"}
                            alt={product.productId?.title || product.productId?.name || "Product"}
                            className="w-full h-full aspect-[16/9] object-cover group-hover:scale-105 transition-transform duration-500"
                        />

                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                        {/* Badge */}
                        {product.badge?.text && (
                            <div className={`absolute top-1 sm:top-2 left-1 sm:left-2 ${product.badge.color} text-white px-1 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-semibold shadow-lg`}>
                                {product.badge.text}
                            </div>
                        )}

                    </Link>
                ))}
            </div>
        </div>
    );
}

export default function HeroSection() {
    const [sliderData, setSliderData] = useState([]);
    const [productImages, setProductImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [productsLoading, setProductsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchHeroBanners = async () => {
            try {
                setLoading(true);
                const response = await heroBannerAPI.getHeroBanners();
                
                if (response.success && response.data && response.data.length > 0) {
                    setSliderData(response.data);
                } else {
                    setSliderData([]);
                }
            } catch (error) {
                console.error('Error fetching hero banners:', error);
                setError(error.message);
                setSliderData([]);
            } finally {
                setLoading(false);
            }
        };

        const fetchHeroProducts = async () => {
            try {
                setProductsLoading(true);
                const response = await heroProductAPI.getHeroProducts();
                
                if (response.success && response.data && response.data.length > 0) {
                    setProductImages(response.data);
                } else {
                    setProductImages([]);
                }
            } catch (error) {
                console.error('Error fetching hero products:', error);
                setProductImages([]);
            } finally {
                setProductsLoading(false);
            }
        };

        fetchHeroBanners();
        fetchHeroProducts();
    }, []);

    return (
        <section className="bg-gradient-to-br from-pink-50 via-white to-purple-50 py-4 sm:py-6 lg:py-8 px-4">
            <div className="max-w-screen-2xl mx-auto">
                <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:items-start">
                    {/* Left Slider - Full width on mobile, 64% on desktop */}
                    {/* Aspect ratio: 983/384 ≈ 2.56:1 (approximately 21:8) */}
                    <div className="w-full lg:w-[64%] aspect-[983/384]">
                        <HeroSlider sliderData={sliderData} loading={loading} />
                    </div>

                    {/* Right Product Images - Hidden on mobile, visible on desktop */}
                    <div className="hidden lg:block w-full lg:flex-1">
                        <ProductImageGrid productImages={productImages} loading={productsLoading} />
                    </div>
                </div>
            </div>
        </section>
    );
}