/**
 * Facebook Conversions API (CAPI) & Pixel Client Utility
 * Provides seamless dual tracking (Client Pixel + Server CAPI) with automatic event deduplication.
 */

// Helper to generate unique event ID for Meta deduplication
export function generateEventId(eventName = 'event') {
  return `capi_${eventName.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Dispatch an event to Facebook via both client-side Pixel (if active) and server-side CAPI
 * @param {string} eventName - e.g. 'ViewContent', 'AddToCart', 'InitiateCheckout', 'ViewCategory', 'Search'
 * @param {object} customData - e.g. { content_name, content_ids, value, currency, brand }
 * @param {object} userData - optional { phone, email, name }
 * @param {string} eventId - optional custom deduplication ID
 */
export async function trackFacebookEvent(eventName, customData = {}, userData = {}, eventId = null) {
  if (typeof window === 'undefined') return;

  const resolvedEventId = eventId || generateEventId(eventName);
  const currentUrl = window.location.href;

  // 1. Browser Meta Pixel (Dual-tracking deduplication)
  if (typeof window.fbq === 'function') {
    try {
      window.fbq('track', eventName, customData, { eventID: resolvedEventId });
    } catch (e) {
      // Ignore client pixel errors
    }
  }

  // 2. Server-side CAPI Call
  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
    
    // Auto-enrich user data from client
    const enrichedUserData = {
      ...userData,
      clientUserAgent: navigator.userAgent
    };

    fetch(`${API_BASE_URL}/settings/facebook-capi/event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        eventName,
        customData,
        userData: enrichedUserData,
        eventSourceUrl: currentUrl,
        eventId: resolvedEventId,
        brandName: customData.brand || customData.brandName
      }),
      keepalive: true
    }).catch(() => {
      // Non-blocking fail-safe
    });
  } catch (err) {
    // Non-blocking fail-safe
  }

  return resolvedEventId;
}

