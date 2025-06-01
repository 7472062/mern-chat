const BASE_URL = '/api';

const getAccessToken = () => sessionStorage.getItem('accessToken');
const setAccessToken = (token) => sessionStorage.setItem('accessToken', token);
const redirectToLanding = () => {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('user');
    location.href = '/';
}

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
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
        ...options.headers,
    };
    const isFormData = options.body instanceof FormData;

    if (!isFormData && options.body && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers,
        credentials: 'same-origin',
    };

    if (options.body && !isFormData) {
        config.body = JSON.stringify(options.body);
    } else if (isFormData) {
        config.body = options.body;
    }

    config._retry = config._retry || false;

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, config);

        if (response.status === 204) {
            return null;
        }
        if (!response.ok) {
            if (response.status === 401 && !config._retry && endpoint !== '/auth/refresh-token') {
                if (isRefreshing) {
                    console.log(`Token refresh in progress. Queuing request to ${endpoint}`);
                    return new Promise((resolve, reject) => {
                        failedQueue.push({ resolve, reject, endpoint, config });
                    }).then(async (newTokenFromQueue) => {
                        // 큐에서 새 토큰을 받으면 원래 요청 재시도
                        const newConfig = { ...config, headers: { ...config.headers, 'Authorization': `Bearer ${newTokenFromQueue}` }, _retry: true };


                        console.log(`Retrying queued request to ${endpoint} with new token.`);
                        const queuedRetryResponse = await fetch(`${BASE_URL}${endpoint}`, newConfig);
                        if (!queuedRetryResponse.ok) {
                            throw new Error(`Queued retry request to ${endpoint} failed`);
                        }
                        if (queuedRetryResponse.status === 204) return null;
                        return await queuedRetryResponse.json();
                    }).catch(queueError => {
                        console.error(`Error processing queued request for ${endpoint}:`, queueError);
                        throw queueError;
                    });
                }
                console.log(`Request to ${endpoint} failed with 401. Attempting token refresh.`);
                isRefreshing = true;
                
                try {
                    const newAccessToken = await refreshToken();

                    const newConfigForCurrentRetry = { ...config, headers: { ...config.headers, 'Authorization': `Bearer ${newAccessToken}` }, _retry: true };
                    console.log(`Retrying current request to ${endpoint} with new token.`);
                    const retryResponse = await fetch(`${BASE_URL}${endpoint}`, newConfigForCurrentRetry);

                    processQueue(null, newAccessToken);

                    if (!retryResponse.ok) {
                        processQueue(new Error(`Retry request to ${endpoint} failed`), null);
                        throw new Error(`Retry request to ${endpoint} failed`);
                    }
                    // 토큰 새로고침 성공 후
                    console.log('Token refresh successful. Processing queued requests.');

                    if (retryResponse.status === 204) {
                        return null;
                    }
                    return await retryResponse.json();
                } catch (refreshError) {
                    console.error(`Failed to refresh token or retry request for ${endpoint}:`, refreshError)
                    processQueue(refreshError, null);
                    throw refreshError;
                } finally {
                    isRefreshing = false;
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
    post: (endpoint, body, options = {}) => makeRequest(endpoint, { ...options, method: 'POST', body: body }),
    put: (endpoint, body, options = {}) => makeRequest(endpoint, { ...options, method: 'PUT', body: body }),
    delete: (endpoint, options = {}) => makeRequest(endpoint, { ...options, method: 'DELETE' }),
};