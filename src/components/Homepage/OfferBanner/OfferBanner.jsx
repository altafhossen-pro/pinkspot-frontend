'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { offerBannerAPI } from '@/services/api'
import Link from 'next/link'

export default function OfferBanner() {
    const [banner, setBanner] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchBanner()
    }, [])

    const fetchBanner = async () => {
        try {
            setLoading(true)
            const response = await offerBannerAPI.getActiveOfferBanner()
            if (response.success && response.data) {
                setBanner(response.data)
            }
        } catch (error) {
            console.error('Error fetching banner:', error)
        } finally {
            setLoading(false)
        }
    }



    if (loading) {
        return (
            <section className="px-4 bg-white">
                <div className="max-w-screen-2xl mx-auto">
                    <div className="relative overflow-hidden">
                        <div className="flex flex-col lg:flex-row items-center min-h-[400px] bg-gray-100 rounded-lg">
                            <div className="w-full lg:w-1/2 relative h-[300px] lg:h-[400px] bg-gray-200 animate-pulse"></div>
                            <div className="w-full lg:w-1/2 p-6 lg:p-12">
                                <div className="max-w-md mx-auto lg:mx-0 space-y-4">
                                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                                    <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                                    <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                                    <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        )
    }

    if (!banner) {
        return null
    }

    return (
        <section className=" px-4 bg-white">
            <div className="max-w-screen-2xl mx-auto">
                {/* <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                        Special Offers
                    </h2>
                    <p className="text-lg text-gray-600">
                        Don't miss out on these amazing deals
                    </p>
                </div> */}



                {/* Check if it's promo code type - no link needed */}
                {banner.type === 'promo' ? (
                    <div className="relative overflow-hidden rounded-lg">
                        <div className="flex flex-col lg:flex-row items-center min-h-[400px] bg-gradient-to-r from-pink-50 to-purple-50">
                            {/* Left Side - Image */}
                            <div className="w-full lg:w-1/2 relative h-[300px] lg:h-[400px]">
                                <Image
                                    src={banner.image}
                                    alt={banner.title}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 1024px) 100vw, 50vw"
                                    priority
                                />
                            </div>

                            {/* Right Side - Content */}
                            <div className="w-full lg:w-1/2 p-6 lg:p-12">
                                <div className="max-w-md mx-auto lg:mx-0">
                                    <p className="text-sm lg:text-base mb-2 text-pink-600">
                                        {banner.subtitle}
                                    </p>

                                    <h3 className="text-2xl lg:text-4xl font-bold mb-4 text-gray-900">
                                        {banner.title}
                                    </h3>

                                    {/* Promo Code */}
                                    <div className="py-4">
                                        <p className="text-base text-gray-600 mb-2">Use promo code</p>
                                        <div className="inline-block px-0 py-2 rounded-lg text-xl lg:text-3xl font-bold text-pink-600">
                                            {banner.discountText || `${banner.discountPercentage}% OFF`}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Offer type - with link */
                    <Link href={banner.buttonLink || '#'}>
                        <div className="relative overflow-hidden rounded-lg">
                            <div className="flex flex-col lg:flex-row items-center min-h-[400px] bg-gradient-to-r from-pink-50 to-purple-50">
                                {/* Left Side - Image */}
                                <div className="w-full lg:w-1/2 relative h-[300px] lg:h-[400px]">
                                    <Image
                                        src={banner.image}
                                        alt={banner.title}
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 1024px) 100vw, 50vw"
                                        priority
                                    />
                                </div>

                                {/* Right Side - Content */}
                                <div className="w-full lg:w-1/2 p-6 lg:p-12">
                                    <div className="max-w-md mx-auto lg:mx-0">
                                        <p className="text-sm lg:text-base mb-2 text-pink-600">
                                            {banner.subtitle}
                                        </p>

                                        <h3 className="text-2xl lg:text-4xl font-bold mb-4 text-gray-900">
                                            {banner.title}
                                        </h3>

                                        {/* Button */}
                                        <div className="mt-6">
                                            <div className="inline-block px-8 py-3 rounded-lg text-lg font-semibold bg-pink-500 text-white transition-all hover:opacity-90">
                                                {banner.buttonText}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Link>
                )}


            </div>
        </section >
    )
}
