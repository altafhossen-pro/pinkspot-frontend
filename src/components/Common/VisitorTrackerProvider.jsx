'use client';

import React, { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { getVisitorSocket, trackPageView, trackCartItems } from '@/utils/visitorTracker';

export default function VisitorTrackerProvider() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { cart, cartTotal } = useAppContext();

    // 1. Initialize visitor socket on mount
    useEffect(() => {
        getVisitorSocket();
    }, []);

    // 2. Track route change
    useEffect(() => {
        // Do not track admin dashboard pages as customer visits!
        if (pathname?.startsWith('/admin')) return;

        const fullUrl = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
        // Small delay to let document.title update
        const timeout = setTimeout(() => {
            trackPageView(fullUrl, document.title, cart, cartTotal);
        }, 150);

        return () => clearTimeout(timeout);
    }, [pathname, searchParams]);

    // 3. Track cart updates
    useEffect(() => {
        if (pathname?.startsWith('/admin')) return;
        trackCartItems(cart, cartTotal);
    }, [cart?.length, cartTotal]);

    return null; // Invisible global tracker
}

