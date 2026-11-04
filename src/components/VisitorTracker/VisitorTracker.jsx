'use client';

import { useEffect, useRef, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { io } from 'socket.io-client';
import { getCookie, setCookie } from 'cookies-next';
import { useAppContext } from '@/context/AppContext';

let globalSocket = null;

export function getVisitorSocketInstance() {
    return globalSocket;
}

function VisitorTrackerCore() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { cart, cartTotal, user } = useAppContext();
    const lastUrlRef = useRef('');
    const heartbeatRef = useRef(null);

    useEffect(() => {
        // 1. Get or generate persistent visitor ID
        let visitorId = getCookie('visitor_id') || (typeof window !== 'undefined' ? localStorage.getItem('forpink_vid') : null);
        
        if (!visitorId) {
            visitorId = 'vid_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
            setCookie('visitor_id', visitorId, { maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' });
            if (typeof window !== 'undefined') localStorage.setItem('forpink_vid', visitorId);
        }

        // 2. Initialize Socket.io connection for visitor tracking
        const socketUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace('/api/v1', '');
        const socket = io(socketUrl, {
            transports: ['websocket', 'polling'],
            auth: {
                visitorId: visitorId
            },
            reconnectionAttempts: 10,
            reconnectionDelay: 2000
        });

        globalSocket = socket;

        socket.on('connect', () => {
            // Send initial connection activity if not admin
            if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/admin')) {
                sendActivity(socket, visitorId, window.location.pathname + window.location.search);
            }
        });

        // 3. Heartbeat timer (15 seconds)
        heartbeatRef.current = setInterval(() => {
            if (typeof document !== 'undefined' && document.hidden) return;
            if (socket.connected && !window.location.pathname.startsWith('/admin')) {
                socket.emit('visitor_heartbeat', {
                    visitorId,
                    url: window.location.pathname + window.location.search,
                    title: document.title,
                    hasCart: Boolean(cart && cart.length > 0),
                    cartTotal: cartTotal || 0,
                    customerPhone: user?.phone || null,
                    customerName: user?.name || null
                });
            }
        }, 15000);

        return () => {
            if (heartbeatRef.current) clearInterval(heartbeatRef.current);
            socket.disconnect();
            globalSocket = null;
        };
    }, []);

    // 4. Track Route Changes
    useEffect(() => {
        if (!pathname || pathname.startsWith('/admin')) return;

        const currentUrl = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
        if (currentUrl === lastUrlRef.current) return;
        lastUrlRef.current = currentUrl;

        const visitorId = getCookie('visitor_id') || (typeof window !== 'undefined' ? localStorage.getItem('forpink_vid') : null);
        if (!visitorId) return;

        const timer = setTimeout(() => {
            if (globalSocket && globalSocket.connected) {
                sendActivity(globalSocket, visitorId, currentUrl);
            }
        }, 200);

        return () => clearTimeout(timer);
    }, [pathname, searchParams]);

    // 5. Track Cart changes
    useEffect(() => {
        if (!pathname || pathname.startsWith('/admin')) return;
        const visitorId = getCookie('visitor_id') || (typeof window !== 'undefined' ? localStorage.getItem('forpink_vid') : null);
        if (!visitorId || !globalSocket || !globalSocket.connected) return;

        globalSocket.emit('visitor_cart_update', {
            visitorId,
            url: pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : ''),
            cart: cart || [],
            cartTotal: cartTotal || 0
        });
    }, [cart?.length, cartTotal]);

    // Helper to send activity payload
    const sendActivity = (socket, visitorId, url) => {
        const payload = {
            visitorId,
            url,
            title: document.title || 'Storefront',
            referrer: document.referrer || '',
            cart: cart || [],
            cartTotal: cartTotal || 0,
            hasCart: Boolean(cart && cart.length > 0),
            visitedCheckout: url.includes('/checkout'),
            customerPhone: user?.phone || null,
            customerName: user?.name || null,
            userId: user?._id || user?.id || null
        };

        socket.emit('visitor_activity', payload);
    };

    return null;
}

export default function VisitorTracker() {
    return (
        <Suspense fallback={null}>
            <VisitorTrackerCore />
        </Suspense>
    );
}
