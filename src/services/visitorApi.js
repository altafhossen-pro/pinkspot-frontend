const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

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
        return apiCall(`/visitor/footprint?${query}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
    },

    // Get visitor journey timeline
    getSessionJourney: (sessionId, token) => {
        return apiCall(`/visitor/session/${sessionId}/journey`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
    },

    // Get live shoppers snapshot
    getLiveShoppers: (token) => {
        return apiCall('/visitor/live', {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
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
    }
};

export default visitorAPI;

