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

export const steadfastAPI = {
    // Official customer fraud / courier delivery score check
    getFraudScore: (phone, token) => {
        return apiCall(`/steadfast/fraud-check/${encodeURIComponent(phone)}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
    },

    // Get live step-by-step courier tracking from Steadfast API + DB
    getLiveTracking: (invoice, token) => {
        return apiCall(`/steadfast/live-tracking/${encodeURIComponent(invoice)}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
    },

    // Get tracking history from webhook database
    getTrackingHistory: (invoice, token) => {
        return apiCall(`/steadfast/tracking/${encodeURIComponent(invoice)}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
    }
};

export default steadfastAPI;

