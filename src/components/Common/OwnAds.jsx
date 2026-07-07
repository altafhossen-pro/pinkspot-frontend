'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { adsAPI } from '@/services/api';

export default function OwnAds({ position }) {
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAd();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position]);

  const fetchAd = async () => {
    try {
      setLoading(true);
      const response = await adsAPI.getActiveAds(position);
      
      if (response.success && response.data && response.data.length > 0) {
        // Randomly select one ad from the array
        const ads = response.data;
        const randomIndex = Math.floor(Math.random() * ads.length);
        const selectedAd = ads[randomIndex];
        
        // Check if ad has product with slug
        if (selectedAd.product && selectedAd.product.slug) {
          setAd(selectedAd);
        }
      }
    } catch (error) {
      console.error('Error fetching ad:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null; // Don't show anything while loading
  }

  if (!ad || !ad.image) {
    return null; // Don't show anything if no ad or no image
  }

  const productSlug = ad.product?.slug;

  if (!productSlug) {
    return null; // Don't show if no product slug
  }

  return (
    <div className="w-full mb-6">
      <Link
        href={`/product/${productSlug}`}
        className="block w-full cursor-pointer rounded-lg overflow-hidden transition-transform hover:scale-[1.01] shadow-sm hover:shadow-md"
        style={{
          height: '100px', // Short height as requested (banner style)
          position: 'relative',
        }}
      >
        <img
          src={ad.image}
          alt={ad.title || 'Advertisement'}
          className="w-full h-full object-cover"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </Link>
    </div>
  );
}

