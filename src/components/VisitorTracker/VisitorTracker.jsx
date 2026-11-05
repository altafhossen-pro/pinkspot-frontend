'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { io } from 'socket.io-client';
import { getCookie, setCookie } from 'cookies-next';
import { useAppContext } from '@/context/AppContext';
import VisitorOfferModal from './VisitorOfferModal';
import visitorAPI from '@/services/visitorApi';

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

    // Dynamic refs to avoid stale closure in socket events and heartbeat
    const cartRef = useRef(cart);
    const cartTotalRef = useRef(cartTotal);
    const userRef = useRef(user);

    useEffect(() => {
        cartRef.current = cart;
        cartTotalRef.current = cartTotal;
        userRef.current = user;
    }, [cart, cartTotal, user]);

    // Custom Screen Offer State
    const [activeOffer, setActiveOffer] = useState(null);
    const [showOfferModal, setShowOfferModal] = useState(false);
    const offerTimerRef = useRef(null);
    const processedOffersRef = useRef(new Set());

    const triggerOfferDisplay = (offer) => {
        if (!offer || !offer._id) return;
        if (processedOffersRef.current.has(offer._id)) return;
        processedOffersRef.current.add(offer._id);

        if (offerTimerRef.current) clearTimeout(offerTimerRef.current);

        const delayMs = Math.max(0, (Number(offer.delaySeconds) || 0) * 1000);
        if (delayMs > 0) {
            offerTimerRef.current = setTimeout(() => {
                setActiveOffer(offer);
                setShowOfferModal(true);
            }, delayMs);
        } else {
            setActiveOffer(offer);
            setShowOfferModal(true);
        }
    };

    const handleOfferAction = (offerId) => {
        setShowOfferModal(false);
        if (globalSocket && globalSocket.connected) {
            globalSocket.emit('visitor_offer_action', { offerId, action: 'clicked' });
        }
        visitorAPI.respondToOffer(offerId, 'clicked').catch(() => {});
    };

    const handleOfferClose = (offerId) => {
        setShowOfferModal(false);
        if (globalSocket && globalSocket.connected) {
            globalSocket.emit('visitor_offer_action', { offerId, action: 'dismissed' });
        }
        visitorAPI.respondToOffer(offerId, 'dismissed').catch(() => {});
    };

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

        // Listen for live instant custom offers dispatched by admin
        socket.on('custom_visitor_offer', (offer) => {
            if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/admin')) {
                triggerOfferDisplay(offer);
            }
        });

        // Check for pending offers (in case visitor was offline or reloaded page)
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/admin')) {
            visitorAPI.getPendingOffer(visitorId).then(res => {
                if (res?.success && res?.data) {
                    triggerOfferDisplay(res.data);
                }
            }).catch(() => {});
        }

        // 3. Heartbeat timer (15 seconds)
        heartbeatRef.current = setInterval(() => {
            if (typeof document !== 'undefined' && document.hidden) return;
            if (socket.connected && !window.location.pathname.startsWith('/admin')) {
                const curCart = cartRef.current || [];
                const computed = curCart.reduce((sum, item) => sum + (Number(item.price || item.currentPrice || 0) * Number(item.quantity || 1)), 0);
                const finalTotal = Number(cartTotalRef.current) > 0 ? Number(cartTotalRef.current) : computed;

                socket.emit('visitor_heartbeat', {
                    visitorId,
                    url: window.location.pathname + window.location.search,
                    title: document.title,
                    hasCart: Boolean(curCart.length > 0),
                    cartTotal: finalTotal,
                    customerPhone: userRef.current?.phone || null,
                    customerName: userRef.current?.name || null
                });
            }
        }, 15000);

        return () => {
            if (offerTimerRef.current) clearTimeout(offerTimerRef.current);
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

        const curCart = cart || [];
        const computed = curCart.reduce((sum, item) => sum + (Number(item.price || item.currentPrice || 0) * Number(item.quantity || 1)), 0);
        const finalTotal = Number(cartTotal) > 0 ? Number(cartTotal) : computed;

        globalSocket.emit('visitor_cart_update', {
            visitorId,
            url: pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : ''),
            cart: curCart,
            cartTotal: finalTotal
        });
    }, [cart, cartTotal]);

    // Helper to send activity payload
    const sendActivity = (socket, visitorId, url) => {
        const curCart = cartRef.current || [];
        const computed = curCart.reduce((sum, item) => sum + (Number(item.price || item.currentPrice || 0) * Number(item.quantity || 1)), 0);
        const finalTotal = Number(cartTotalRef.current) > 0 ? Number(cartTotalRef.current) : computed;

        const payload = {
            visitorId,
            url,
            title: document.title || 'Storefront',
            referrer: document.referrer || '',
            cart: curCart,
            cartTotal: finalTotal,
            hasCart: Boolean(curCart.length > 0),
            visitedCheckout: url.includes('/checkout'),
            customerPhone: userRef.current?.phone || null,
            customerName: userRef.current?.name || null,
            userId: userRef.current?._id || userRef.current?.id || null
        };

        socket.emit('visitor_activity', payload);
    };

    return (
        <>
            {showOfferModal && activeOffer && !pathname?.startsWith('/admin') && (
                <VisitorOfferModal
                    offer={activeOffer}
                    onClose={handleOfferClose}
                    onAction={handleOfferAction}
                />
            )}
        </>
    );
}

export default function VisitorTracker() {
    return (
        <Suspense fallback={null}>
            <VisitorTrackerCore />
        </Suspense>
    );
}
