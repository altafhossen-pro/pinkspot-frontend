'use client';

import { io } from 'socket.io-client';

let socketInstance = null;
let heartbeatInterval = null;
let lastTrackedUrl = '';

/**
 * Get or create unique persistent Visitor ID (stored across visits)
 */
export function getOrCreateVisitorId() {
    if (typeof window === 'undefined') return 'server_placeholder';

    let vid = localStorage.getItem('forpink_vid');
    if (!vid) {
        // Fallback check cookie
        const match = document.cookie.match(/forpink_vid=([^;]+)/);
        if (match) {
            vid = match[1];
        } else {
            vid = `vid_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
        }
        localStorage.setItem('forpink_vid', vid);
        // Set cookie for 365 days
        document.cookie = `forpink_vid=${vid}; path=/; max-age=31536000; SameSite=Lax`;
    }
    return vid;
}

/**
 * Get or initialize client Socket.io instance
 */
export function getVisitorSocket() {
    if (typeof window === 'undefined') return null;

    if (!socketInstance) {
        const vid = getOrCreateVisitorId();
        const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL 
            ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/v1\/?$/, '') 
            : 'http://localhost:5000';

        socketInstance = io(SOCKET_URL, {
            auth: { visitorId: vid },
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 10,
            reconnectionDelay: 2000
        });

        socketInstance.on('connect', () => {
            // Send initial page activity on connect
            emitCurrentActivity();
        });

        // Setup 15-second heartbeat when window is active
        startHeartbeat();
    }

    return socketInstance;
}

function startHeartbeat() {
    if (heartbeatInterval) clearInterval(heartbeatInterval);

    heartbeatInterval = setInterval(() => {
        if (typeof document !== 'undefined' && document.hidden) return; // Skip if tab is inactive
        if (socketInstance && socketInstance.connected) {
            const vid = getOrCreateVisitorId();
            socketInstance.emit('visitor_heartbeat', {
                visitorId: vid,
                url: window.location.pathname + window.location.search,
                title: document.title
            });
        }
    }, 15000);
}

function emitCurrentActivity() {
    if (typeof window === 'undefined') return;
    const socket = getVisitorSocket();
    if (!socket || !socket.connected) return;

    const vid = getOrCreateVisitorId();
    const currentUrl = window.location.pathname + window.location.search;

    socket.emit('visitor_activity', {
        visitorId: vid,
        url: currentUrl,
        title: document.title || 'Storefront',
        referrer: document.referrer || ''
    });
}

/**
 * Track route change / page view
 */
export function trackPageView(url, title = '', cart = [], cartTotal = 0) {
    if (typeof window === 'undefined') return;
    const resolvedUrl = url || window.location.pathname + window.location.search;
    
    // Prevent duplicate emits for identical URL in rapid succession
    if (resolvedUrl === lastTrackedUrl) return;
    lastTrackedUrl = resolvedUrl;

    const vid = getOrCreateVisitorId();
    const socket = getVisitorSocket();
    const docTitle = title || document.title || 'Storefront';

    const payload = {
        visitorId: vid,
        url: resolvedUrl,
        title: docTitle,
        referrer: document.referrer || '',
        cart: cart || [],
        cartTotal: cartTotal || 0,
        hasCart: Boolean(cart && cart.length > 0)
    };

    if (socket && socket.connected) {
        socket.emit('visitor_activity', payload);
    } else {
        // Fallback HTTP POST beacon
        try {
            const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
            fetch(`${API_BASE_URL}/visitor/activity`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                keepalive: true
            }).catch(() => {});
        } catch (e) {}
    }
}

/**
 * Track cart changes (real-time cart item tracking & abandonment detection)
 */
export function trackCartItems(cart = [], cartTotal = 0) {
    if (typeof window === 'undefined') return;
    const vid = getOrCreateVisitorId();
    const socket = getVisitorSocket();

    const payload = {
        visitorId: vid,
        url: window.location.pathname + window.location.search,
        cart: cart || [],
        cartTotal: cartTotal || 0
    };

    if (socket && socket.connected) {
        socket.emit('visitor_cart_update', payload);
    }
}

/**
 * Identify visitor before order (e.g. typing phone number or name on checkout)
 */
export function identifyVisitorProfile(profile = {}) {
    if (typeof window === 'undefined') return;
    const vid = getOrCreateVisitorId();
    const socket = getVisitorSocket();

    const payload = {
        visitorId: vid,
        ...profile
    };

    if (socket && socket.connected) {
        socket.emit('visitor_identify', payload);
    } else {
        try {
            const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
            fetch(`${API_BASE_URL}/visitor/identify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ visitorId: vid, profile }),
                keepalive: true
            }).catch(() => {});
        } catch (e) {}
    }
}

