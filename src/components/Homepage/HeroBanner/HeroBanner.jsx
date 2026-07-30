'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { settingsAPI } from '@/services/api';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';

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

    // Render Slider Mode
    if (bannerData.type === 'slider' && bannerData.slides && bannerData.slides.length > 0) {
        return (
            <section className="relative w-full overflow-hidden bg-gray-100 group">
                <Swiper
                    modules={[Pagination, Autoplay]}
                    spaceBetween={0}
                    slidesPerView={1}
                    pagination={{ clickable: true }}
                    autoplay={{ delay: 5000, disableOnInteraction: false }}
                    loop={bannerData.slides.length > 1}
                    className="w-full aspect-[5/2] lg:aspect-[5/1]"
                >
                    {bannerData.slides.map((slide, index) => (
                        <SwiperSlide key={index}>
                            {slide.link ? (
                                <Link href={slide.link} className="block w-full h-full">
                                    <img
                                        src={slide.image}
                                        alt={`Hero Banner Slide ${index + 1}`}
                                        className="object-cover object-center w-full h-full"
                                    />
                                </Link>
                            ) : (
                                <img
                                    src={slide.image}
                                    alt={`Hero Banner Slide ${index + 1}`}
                                    className="object-cover object-center w-full h-full"
                                />
                            )}
                        </SwiperSlide>
                    ))}
                </Swiper>
            </section>
        );
    }

    // Render Single Image Mode
    if (bannerData.type === 'single' && bannerData.image) {
        const content = (
            <img
                src={bannerData.image}
                alt="Govaly Home banner"
                loading="lazy"
                className="object-cover object-center w-full h-full"
            />
        );

        return (
            <section className="relative aspect-[5/2] lg:aspect-[5/1] w-full overflow-hidden bg-gray-100 group block">
                {bannerData.link ? (
                    <Link href={bannerData.link} className="block w-full h-full">
                        {content}
                    </Link>
                ) : (
                    <div className="w-full h-full">
                        {content}
                    </div>
                )}
            </section>
        );
    }

    return null;
}