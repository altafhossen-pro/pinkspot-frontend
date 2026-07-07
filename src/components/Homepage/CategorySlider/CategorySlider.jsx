'use client';

import React, { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import { categoryAPI } from '@/services/api';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';

function CategoryCard({ category, isActive = false, onCategoryClick }) {
    return (
        <div
            className={`relative  rounded-xl border transition-all duration-300 cursor-pointer hover:shadow-lg ${isActive
                ? 'bg-pink-500 border-pink-500 text-white'
                : 'bg-white border-pink-100 text-gray-700 hover:border-pink-200'
                }`}
            onClick={() => onCategoryClick(category)}
        >
            <div className="flex flex-col   space-y-3">
                <div className={` ${isActive ? 'text-white' : 'text-pink-500'}`}>
                    {category.image ? (
                        <div className="w-full aspect-[15/11] rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
                            <Image
                                src={category.image}
                                alt={category.name}
                                width={500}
                                height={500}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    // Fallback to default icon if image fails to load
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'block';
                                }}
                            />
                            {/* Fallback icon */}
                            <svg className="w-8 h-8 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                        </div>
                    ) : (
                        // Default icon if no image
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    )}
                </div>
                <div className='px-2 pb-6 text-center'>
                    <h3 className={`font-semibold text-lg ${isActive ? 'text-white' : 'text-gray-800'}`}>
                        {category.name}
                    </h3>
                    <p className={`text-sm ${isActive ? 'text-white/80' : 'text-gray-500'}`}>
                        {category.productCount || 0} Products
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function CategorySlider() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setLoading(true);
                const data = await categoryAPI.getMainCategories();

                if (data.success) {
                    setCategories(data.data);
                } else {
                    setError(data.message || 'Failed to fetch categories');
                }
            } catch (error) {
                console.error('Error fetching categories:', error);
                setError('Error fetching categories');
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, []);

    // Handle category click to navigate to shop page with category filter
    const handleCategoryClick = (category) => {
        router.push(`/shop?category=${category.slug}`);
    };

    if (loading) {
        return (
            <section className="py-12 px-4 bg-white">
                <div className="xl:2xl:max-w-7xl xl:max-w-6xl   max-w-xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-gray-800">Browse Category</h2>
                    </div>
                    <div className="flex justify-center items-center h-32">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
                    </div>
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className="py-12 px-4 bg-white">
                <div className="max-w-screen-2xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-gray-800">Browse Category</h2>
                    </div>
                    <div className="flex justify-center items-center h-32">
                        <p className="text-gray-500">Failed to load categories. Please try again later.</p>
                    </div>
                </div>
            </section>
        );
    }

    if (!categories || categories.length === 0) {
        return (
            <section className="py-12 px-4 bg-white">
                <div className="xl:2xl:max-w-7xl xl:max-w-6xl   max-w-xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-gray-800">Browse Category</h2>
                    </div>
                    <div className="flex justify-center items-center h-32">
                        <p className="text-gray-500">No categories available at the moment.</p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="lg:py-8 py-2 px-4 bg-white">
            <div className="max-w-screen-2xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-gray-800">Browse Category</h2>

                    {/* Navigation Buttons */}
                    <div className="flex gap-2">
                        <button
                            className="category-prev-btn w-10 h-10 rounded-lg border border-pink-300 text-pink-500 hover:bg-pink-50 transition-colors flex items-center justify-center"
                            aria-label="Previous categories"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button
                            className="category-next-btn w-10 h-10 rounded-lg border border-pink-300 text-pink-500 hover:bg-pink-50 transition-colors flex items-center justify-center"
                            aria-label="Next categories"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Category Slider */}
                <Swiper
                    modules={[Navigation, Autoplay]}
                    spaceBetween={20}
                    slidesPerView={2}
                    loop={true}
                    autoplay={{
                        delay: 3000,
                        disableOnInteraction: false,
                    }}
                    navigation={{
                        nextEl: '.category-next-btn',
                        prevEl: '.category-prev-btn',
                    }}
                    breakpoints={{
                        640: {
                            slidesPerView: 3,
                        },
                        768: {
                            slidesPerView: 4,
                        },
                        1024: {
                            slidesPerView: 5,
                        },
                        1280: {
                            slidesPerView: 7,
                        },
                    }}
                    className="category-swiper "
                >
                    {categories.map((category, index) => (
                        <SwiperSlide key={category._id}>
                            <CategoryCard
                                category={category}
                                isActive={false}
                                onCategoryClick={handleCategoryClick}
                            />
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        </section>
    );
}
