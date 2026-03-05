/**
 * QA Training Lab - Main Application Module
 * Handles UI interactions and page-specific functionality
 */

const App = {
    init() {
        Auth.updateNavigation();
        this.checkServerHealth();
        this.initToastContainer();
    },
    
    async checkServerHealth() {
        const result = await API.health();
        if (!result.success) {
            this.showToast('Server connection issue. Some features may not work.', 'warning');
        }
    },
    
    initToastContainer() {
        if (!document.querySelector('.toast-container')) {
            const container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
    },
    
    showToast(message, type = 'info', duration = 4000) {
        const container = document.querySelector('.toast-container');
        const toast = document.createElement('div');
        toast.className = `toast alert alert-${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },
    
    showLoading(element) {
        if (element) {
            element.dataset.originalContent = element.innerHTML;
            element.innerHTML = '<span class="spinner"></span>';
            element.disabled = true;
        }
    },
    
    hideLoading(element) {
        if (element && element.dataset.originalContent) {
            element.innerHTML = element.dataset.originalContent;
            element.disabled = false;
        }
    },
    
    formatPrice(price) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(price);
    },
    
    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    getProductEmoji(category) {
        const emojis = {
            electronics: '📱',
            clothing: '👕',
            books: '📚',
            home: '🏠',
            sports: '⚽',
            toys: '🧸',
            food: '🍕',
            beauty: '💄',
            default: '📦'
        };
        return emojis[category?.toLowerCase()] || emojis.default;
    },
    
    getStatusBadge(status) {
        const badges = {
            pending: 'badge-warning',
            processing: 'badge-info',
            shipped: 'badge-info',
            delivered: 'badge-success',
            cancelled: 'badge-danger'
        };
        return badges[status?.toLowerCase()] || 'badge-info';
    },
    
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    },
    
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    },
    
    closeAllModals() {
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.classList.remove('active');
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        App.closeAllModals();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        App.closeAllModals();
    }
});

window.App = App;
