/**
 * QA Training Lab - Authentication Module
 * Handles user authentication state and token management
 */

const Auth = {
    TOKEN_KEY: 'qa_lab_token',
    REFRESH_TOKEN_KEY: 'qa_lab_refresh_token',
    USER_KEY: 'qa_lab_user',
    
    isAuthenticated() {
        return !!this.getToken();
    },
    
    getToken() {
        return localStorage.getItem(this.TOKEN_KEY);
    },
    
    getRefreshToken() {
        return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    },
    
    getUser() {
        const user = localStorage.getItem(this.USER_KEY);
        return user ? JSON.parse(user) : null;
    },
    
    setAuth(data) {
        if (data.accessToken) {
            localStorage.setItem(this.TOKEN_KEY, data.accessToken);
        }
        if (data.refreshToken) {
            localStorage.setItem(this.REFRESH_TOKEN_KEY, data.refreshToken);
        }
        if (data.user) {
            localStorage.setItem(this.USER_KEY, JSON.stringify(data.user));
        }
    },
    
    clearAuth() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.REFRESH_TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
    },
    
    async login(email, password) {
        const result = await API.auth.login({ email, password });
        if (result.success) {
            this.setAuth(result.data);
        }
        return result;
    },
    
    async register(userData) {
        const result = await API.auth.register(userData);
        if (result.success) {
            this.setAuth(result.data);
        }
        return result;
    },
    
    async logout() {
        await API.auth.logout();
        this.clearAuth();
        window.location.href = '/';
    },
    
    async refreshToken() {
        const result = await API.auth.refresh();
        if (result.success) {
            this.setAuth(result.data);
            return true;
        }
        this.clearAuth();
        return false;
    },
    
    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = '/pages/login.html?redirect=' + encodeURIComponent(window.location.pathname);
            return false;
        }
        return true;
    },
    
    updateNavigation() {
        const navAuth = document.getElementById('navAuth');
        if (!navAuth) return;
        
        if (this.isAuthenticated()) {
            const user = this.getUser();
            navAuth.innerHTML = `
                <span class="nav-user">Hello, ${user?.name || 'User'}</span>
                <button class="btn btn-outline" onclick="Auth.logout()">Logout</button>
            `;
        } else {
            navAuth.innerHTML = `
                <a href="/pages/login.html" class="btn btn-outline">Login</a>
                <a href="/pages/register.html" class="btn btn-primary">Sign Up</a>
            `;
        }
    }
};

window.Auth = Auth;
