'use client';
import Link from 'next/link';
import { useAppContext } from '@/context/AppContext';

export default function HeroOffers() {
    const { siteSettings, siteSettingsLoading } = useAppContext();
    const offersData = siteSettings?.heroOffers || null;

    if (siteSettingsLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="w-full h-32 md:h-48 bg-gray-200 animate-pulse rounded-lg"></div>
            </div>
        );
    }

    if (!offersData || !offersData.isActive || !offersData.offers || offersData.offers.length === 0) {
        return null;
    }

    // Determine grid columns based on admin selection
    const columns = offersData.gridColumns || 3;
    let gridClass = 'grid-cols-1';
    
    if (columns === 2) gridClass = 'grid-cols-1 md:grid-cols-2';
    else if (columns === 3) gridClass = 'grid-cols-1 md:grid-cols-3';
    else if (columns === 4) gridClass = 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';

    return (
        <section className="container mx-auto px-4 py-6 md:py-8">
            <div className={`grid gap-4 md:gap-6 ${gridClass}`}>
                {offersData.offers.map((offer, index) => {
                    const content = (
                        <div className="relative overflow-hidden rounded-lg shadow-sm hover:shadow-md transition-shadow group aspect-[3/2] md:aspect-auto h-full">
                            <img
                                src={offer.image}
                                alt={`Hero Offer ${index + 1}`}
                                loading="lazy"
                                className="object-cover w-full h-full md:h-48 lg:h-56 transition-transform duration-500 group-hover:scale-105"
                            />
                            {/* Optional dark overlay on hover */}
                            <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none"></div>
                        </div>
                    );

                    return offer.link ? (
                        <Link href={offer.link} key={index} className="block h-full">
                            {content}
                        </Link>
                    ) : (
                        <div key={index} className="h-full">
                            {content}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
