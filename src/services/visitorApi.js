import { getCookie } from 'cookies-next';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const getAuthToken = (token) => {
    return token || getCookie('token') || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
};

const apiCall = async (endpoint, options = {}) => {
    try {
        const defaultHeaders = {
            'Content-Type': 'application/json',
        };

        const requestOptions = {
            headers: {
                ...defaultHeaders,
                ...options.headers,
            },
            ...options,
        };

        const response = await fetch(`${API_BASE_URL}${endpoint}`, requestOptions);
        const data = await response.json();

        if (!response.ok) {
            const error = new Error(data.message || 'Request failed');
            error.status = response.status;
            error.response = { data, status: response.status };
            throw error;
        }

        return data;
    } catch (error) {
        if (error.status || error.response) {
            throw error;
        }
        const networkError = new Error(error.message || 'Network error');
        networkError.status = 500;
        throw networkError;
    }
};

export const visitorAPI = {
    // Get visitor footprint list with date, filter tabs, pagination
    getFootprint: (params = {}, token) => {
        const query = new URLSearchParams(params).toString();
        const authToken = getAuthToken(token);
        return apiCall(`/visitor/footprint?${query}`, {
            headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
        });
    },

    // Get visitor journey timeline
    getSessionJourney: (sessionId, token) => {
        const authToken = getAuthToken(token);
        return apiCall(`/visitor/session/${sessionId}/journey`, {
            headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
        });
    },

    // Get live shoppers snapshot
    getLiveShoppers: (token) => {
        const authToken = getAuthToken(token);
        return apiCall('/visitor/live', {
            headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
        });
    },

    // Record activity (fallback if socket is unavailable)
    recordActivity: (data) => {
        return apiCall('/visitor/activity', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    // Identify customer on checkout typing
    identifyCustomer: (data) => {
        return apiCall('/visitor/identify', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    // ==========================================
    // OFFER TEMPLATES & CUSTOM OFFERS
    // ==========================================

    // Get all offer templates
    getOfferTemplates: (token) => {
        const authToken = getAuthToken(token);
        return apiCall('/visitor/offer-templates', {
            headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
        });
    },

    // Create an offer template
    createOfferTemplate: (data, token) => {
        const authToken = getAuthToken(token);
        return apiCall('/visitor/offer-templates', {
            method: 'POST',
            headers: {
                ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
    },

    // Update an offer template
    updateOfferTemplate: (id, data, token) => {
        const authToken = getAuthToken(token);
        return apiCall(`/visitor/offer-templates/${id}`, {
            method: 'PUT',
            headers: {
                ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
    },

    // Delete an offer template
    deleteOfferTemplate: (id, token) => {
        const authToken = getAuthToken(token);
        return apiCall(`/visitor/offer-templates/${id}`, {
            method: 'DELETE',
            headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
        });
    },

    // Send custom offer to a visitor
    sendCustomOffer: (data, token) => {
        const authToken = getAuthToken(token);
        return apiCall('/visitor/offers/send', {
            method: 'POST',
            headers: {
                ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
    },

    // Get pending offer for a visitor (Public)
    getPendingOffer: (visitorId) => {
        return apiCall(`/visitor/offers/pending/${encodeURIComponent(visitorId)}`);
    },

    // Record visitor response to an offer (Public)
    respondToOffer: (offerId, action) => {
        return apiCall(`/visitor/offers/${offerId}/action`, {
            method: 'POST',
            body: JSON.stringify({ action })
        });
    },

    // Get offers history log
    getOffersHistory: (token, limit = 50) => {
        const authToken = getAuthToken(token);
        return apiCall(`/visitor/offers/history?limit=${limit}`, {
            headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
        });
    }
};

export default visitorAPI;

