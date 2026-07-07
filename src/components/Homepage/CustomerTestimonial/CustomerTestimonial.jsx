'use client';

import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import { testimonialAPI } from '@/services/api';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';

function TestimonialCard({ testimonial }) {
    return (
        <div className="bg-white border border-[#E7E7E7] rounded-xl shadow-lg h-full overflow-hidden flex items-center justify-center p-2">
            <img 
                src={testimonial.image} 
                alt="Customer Testimonial" 
                className="w-full h-auto max-h-[400px] object-contain rounded-lg"
            />
        </div>
    );
}

export default function CustomerTestimonial() {
    const [mounted, setMounted] = useState(false);
    const [testimonials, setTestimonials] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setMounted(true);
        fetchTestimonials();
    }, []);

    const fetchTestimonials = async () => {
        try {
            setLoading(true);
            const response = await testimonialAPI.getActiveTestimonials();

            if (response.success) {
                setTestimonials(response.data.testimonials);
            } else {
                console.error('Failed to fetch testimonials:', response.message);
                // Fallback to empty array if API fails
                setTestimonials([]);
            }
        } catch (error) {
            console.error('Error fetching testimonials:', error);
            // Fallback to empty array if API fails
            setTestimonials([]);
        } finally {
            setLoading(false);
        }
    };

    if (!mounted) return null;

    // Don't render if no testimonials
    if (!loading && testimonials.length === 0) {
        return null;
    }
    return (
        <section className="py-4 px-4 bg-white">
            <div className="max-w-screen-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-800 mb-4">Customer Testimonial</h2>
                    <p className="text-gray-600 text-base max-w-xl mx-auto">
                        Real stories. Genuine smiles. Discover how our jewelry made their moments unforgettable.
                    </p>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    /* Testimonials Carousel */
                    <Swiper
                        modules={[Pagination]}
                        spaceBetween={24}
                        slidesPerView={1}
                        loop={testimonials.length > 1}
                        pagination={{
                            clickable: true,
                            el: '.testimonial-pagination',
                        }}
                        breakpoints={{
                            640: {
                                slidesPerView: 2,
                            },
                            768: {
                                slidesPerView: 3,
                            },
                            1024: {
                                slidesPerView: 4,
                            },
                        }}
                        className="testimonial-swiper !pb-4 !px-1"
                    >
                        {testimonials.map((testimonial) => (
                            <SwiperSlide key={testimonial._id}>
                                <TestimonialCard testimonial={testimonial} />
                            </SwiperSlide>
                        ))}
                    </Swiper>
                )}




            </div>
        </section>
    );
}
