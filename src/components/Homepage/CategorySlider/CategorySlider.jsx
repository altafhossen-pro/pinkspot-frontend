'use client';

import React, { useState, useEffect } from 'react';
import { categoryAPI } from '@/services/api';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

function CategoryCard({ category, onCategoryClick }) {
    console.log({ category })
    return (
        <div
            className="flex flex-col items-center group cursor-pointer"
            onClick={() => onCategoryClick(category)}
        >
            <div
                className={`w-full rounded-xl overflow-hidden mb-2 transition-transform duration-300 group-hover:-translate-y-1 group-hover:shadow-md flex items-center justify-center ${category.bgClass || 'bg-gradient-to-b from-pink-50 to-purple-100'}`}
                style={{ aspectRatio: 'auto 151 / 151' }}
            >
                {category.image ? (
                    <Image
                        src={category.image}
                        alt={category.name}
                        width={200}
                        height={200}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            e.target.style.display = 'none';
                            if (e.target.nextSibling) {
                                e.target.nextSibling.style.display = 'block';
                            }
                        }}
                    />
                ) : null}
                {/* Fallback icon */}
                <svg className={`w-8 h-8 text-blue-200 ${category.image ? 'hidden' : 'block'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            </div>
            <h3 className="text-[11px] md:text-[13px] font-medium text-gray-800 text-center leading-tight line-clamp-2">
                {category.name}
            </h3>
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
                const data = await categoryAPI.getFeaturedCategories(50);

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

    const handleCategoryClick = (category) => {
        router.push(`/shop?category=${category.slug}`);
    };

    if (loading) {
        return (
            <section className="py-12 px-4 bg-white">
                <div className="max-w-screen-2xl mx-auto">
                    <div className="flex justify-center items-center h-32">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
                    </div>
                </div>
            </section>
        );
    }

    if (error || !categories || categories.length === 0) {
        return null;
    }

    return (
        <section className="py-4 md:py-8 px-2 md:px-4 bg-white">
            <div className="max-w-screen-2xl mx-auto">
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-9 gap-2 md:gap-4 lg:gap-5">
                    {categories.map((category) => (
                        <CategoryCard
                            key={category._id}
                            category={category}
                            onCategoryClick={handleCategoryClick}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
