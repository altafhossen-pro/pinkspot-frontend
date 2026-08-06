'use client';

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { getCookie, setCookie } from 'cookies-next';

export default function VisitorTracker() {
    const [visitorCount, setVisitorCount] = useState(0);

    useEffect(() => {
        // Get or generate visitor ID
        let visitorId = getCookie('visitor_id');
        
        if (!visitorId) {
            // Generate a random string if no UUID package is available
            visitorId = 'visitor_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            // Set cookie to expire in 1 year
            setCookie('visitor_id', visitorId, { maxAge: 60 * 60 * 24 * 365 });
        }

        // Initialize Socket.io specifically for visitor tracking
        // Connecting to backend URL (using standard environment variable or default)
        const socketUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace('/api/v1', '');
        const socket = io(socketUrl, {
            transports: ['websocket'],
            auth: {
                visitorId: visitorId
            }
        });

        // Listen for unique visitors count updates
        socket.on('unique_visitors_count', (count) => {
            console.log('Live Unique Visitors:', count);
            setVisitorCount(count);
        });

        // Cleanup on unmount
        return () => {
            socket.disconnect();
        };
    }, []);

    // This component is meant to be completely invisible and just handle logic.
    // However, if you want to display it anywhere, you can use the visitorCount state.
    // For now, it returns null to remain hidden as requested.
    return null;
}
