const API_BASE_URL = 'http://localhost:5164/api';

const ErpApi = {
    getToken: () => localStorage.getItem('erp_token'),

    request: async (endpoint, options = {}) => {
        const url = `${API_BASE_URL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };

        const token = ErpApi.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers
        };

        try {
            const response = await fetch(url, config);
            
            if (response.status === 401) {
                // Unauthorized - clear token and redirect to login
                localStorage.removeItem('erp_token');
                localStorage.removeItem('erp_user');
                window.location.href = 'auth-login-basic.html';
                return null;
            }

            // Handle 204 No Content
            if (response.status === 204) {
                return null;
            }

            let data = null;
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                data = await response.json();
            } else {
                const text = await response.text();
                if (text) {
                    try { data = JSON.parse(text); } catch(e) { data = { message: text }; }
                }
            }

            if (!response.ok) {
                throw new Error((data && data.message) || `API request failed with status ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    get: (endpoint) => ErpApi.request(endpoint, { method: 'GET' }),
    
    post: (endpoint, data) => ErpApi.request(endpoint, { 
        method: 'POST', 
        body: JSON.stringify(data) 
    }),
    
    put: (endpoint, data) => ErpApi.request(endpoint, { 
        method: 'PUT', 
        body: JSON.stringify(data) 
    }),
    
    delete: (endpoint) => ErpApi.request(endpoint, { method: 'DELETE' })
};
