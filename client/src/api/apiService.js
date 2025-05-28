const BASE_URL = '/api';

const getAccessToken = () => sessionStorage.getItem('accessToken');
const setAccessToken = (token) => sessionStorage.setItem('accessToken', token);
const redirectToLanding = () => {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('user');
    location.href = '/';
}

async function refreshToken() {
    try {
        const response = await fetch(`${BASE_URL}/auth/refresh-token`, {
            method: 'POST',
            credentials: 'same-origin',
        });

        const data = await response.json();

        if (!data.accessToken) {
            throw new Error('No access token received');
        }
        setAccessToken(data.accessToken);
        return data.accessToken;
    } catch (error) {
        console.error('RefreshToken function error:', error);
        redirectToLanding();
        throw error;
    }
}

async function makeRequest(endpoint, options = {}) {
    let token = getAccessToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers,
        credentials: 'same-origin',
    };

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, config);

        if (response.status === 204) {
            return null;
        }
        if (!response.ok) {
            if (response.status === 401 && endpoint !== '/auth/refresh-token') {
                console.log(`Request to ${endpoint} failed with 401. Attempting token refresh.`);
                try {
                    const newAccessToken = await refreshToken();

                    if (!newAccessToken) {
                        throw new Error('Refreshing access token failed');
                    }

                    config.headers['Authorization'] = `Bearer ${newAccessToken}`;
                    console.log(`Retrying request to ${endpoint} with new token.`);
                    const retryResponse = await fetch(`${BASE_URL}${endpoint}`, config); 

                    if (!retryResponse.ok) {
                        throw new Error(`Retry request to ${endpoint} failed`);
                    }
                    if (retryResponse.status === 204) {
                        return null;
                    }
                    return await retryResponse.json();
                } catch (refreshError) {
                    console.error(`Failed to refresh token or retry request for ${endpoint}:`, refreshError)
                    throw refreshError;
                }
            }
            throw new Error(`API request to ${endpoint} failed`);
        }
        return await response.json();
    } catch (error) {
        console.error(`API request error for ${BASE_URL}${endpoint}:`, error);
        throw error;
    }
}

export const apiService = {
    get: (endpoint, options = {}) => makeRequest(endpoint, { ...options, method: 'GET' }),
    post: (endpoint, body, options = {}) => makeRequest(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
    put: (endpoint, body, options = {}) => makeRequest(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
    delete: (endpoint, options = {}) => makeRequest(endpoint, { ...options, method: 'DELETE' }),
};