/**
 * QA Training Lab - API Client Module
 * Handles all API communication with the backend
 */

const API = {
    baseURL: window.location.origin,
    
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const token = localStorage.getItem('qa_lab_token');
        
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
                ...options.headers
            },
            ...options
        };
        
        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }
        
        try {
            const response = await fetch(url, config);
            const data = await response.json().catch(() => ({}));
            
            if (!response.ok) {
                throw {
                    status: response.status,
                    message: data.message || 'Request failed',
                    data
                };
            }
            
            return { success: true, data, status: response.status };
        } catch (error) {
            if (error.status) {
                return { success: false, error: error.message, status: error.status, data: error.data };
            }
            return { success: false, error: error.message || 'Network error', status: 0 };
        }
    },
    
    // Health check
    async health() {
        return this.request('/api/health');
    },
    
    // Auth endpoints
    auth: {
        async register(userData) {
            return API.request('/api/auth/register', {
                method: 'POST',
                body: userData
            });
        },
        
        async login(credentials) {
            return API.request('/api/auth/login', {
                method: 'POST',
                body: credentials
            });
        },
        
        async refresh() {
            const refreshToken = localStorage.getItem('qa_lab_refresh_token');
            return API.request('/api/auth/refresh', {
                method: 'POST',
                body: { refreshToken }
            });
        },
        
        async logout() {
            const refreshToken = localStorage.getItem('qa_lab_refresh_token');
            return API.request('/api/auth/logout', {
                method: 'POST',
                body: { refreshToken }
            });
        }
    },
    
    // Product endpoints
    products: {
        async list(params = {}) {
            const query = new URLSearchParams(params).toString();
            return API.request(`/api/products${query ? `?${query}` : ''}`);
        },
        
        async get(id) {
            return API.request(`/api/products/${id}`);
        },
        
        async create(productData) {
            return API.request('/api/products', {
                method: 'POST',
                body: productData
            });
        },
        
        async update(id, productData) {
            return API.request(`/api/products/${id}`, {
                method: 'PUT',
                body: productData
            });
        },
        
        async delete(id) {
            return API.request(`/api/products/${id}`, {
                method: 'DELETE'
            });
        }
    },
    
    // Cart endpoints
    cart: {
        async get() {
            return API.request('/api/cart');
        },
        
        async add(productId, quantity = 1) {
            return API.request('/api/cart/add', {
                method: 'POST',
                body: { productId, quantity }
            });
        },
        
        async update(itemId, quantity) {
            // Note: Backend doesn't have update endpoint, need to remove and re-add
            return API.request(`/api/cart/update/${itemId}`, {
                method: 'PUT',
                body: { quantity }
            });
        },
        
        async remove(itemId) {
            return API.request(`/api/cart/remove/${itemId}`, {
                method: 'DELETE'
            });
        },
        
        async clear() {
            return API.request('/api/cart/clear', {
                method: 'DELETE'
            });
        }
    },
    
    // Order endpoints
    orders: {
        async list() {
            return API.request('/api/orders');
        },
        
        async get(id) {
            return API.request(`/api/orders/${id}`);
        },
        
        async create(shippingAddress) {
            return API.request('/api/orders', {
                method: 'POST',
                body: { shippingAddress }
            });
        },
        
        async cancel(id) {
            return API.request(`/api/orders/${id}/cancel`, {
                method: 'PUT'
            });
        }
    },
    
    // User endpoints
    users: {
        async profile() {
            return API.request('/api/users/profile');
        },
        
        async updateProfile(data) {
            return API.request('/api/users/profile', {
                method: 'PUT',
                body: data
            });
        },
        
        async changePassword(data) {
            return API.request('/api/users/change-password', {
                method: 'PUT',
                body: data
            });
        }
    },
    
    // Seed endpoint (admin/setup)
    async seed() {
        return this.request('/api/seed', { method: 'POST' });
    }
};

window.API = API;
