const ErpAuth = {
    login: async (email, password) => {
        try {
            // Clear any existing session before attempting to login
            localStorage.removeItem('erp_token');
            localStorage.removeItem('erp_user');
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                // Ensure localStorage is cleared if login failed
                localStorage.removeItem('erp_token');
                localStorage.removeItem('erp_user');
                throw new Error(data.message || 'Login failed');
            }

            localStorage.setItem('erp_token', data.token);
            localStorage.setItem('erp_user', JSON.stringify(data.user));

            return data.user;
        } catch (error) {
            // Ensure localStorage is cleared in case of request network errors
            localStorage.removeItem('erp_token');
            localStorage.removeItem('erp_user');
            console.error('Login Error:', error);
            throw error;
        }
    },

    logout: () => {
        localStorage.removeItem('erp_token');
        localStorage.removeItem('erp_user');
        window.location.href = 'auth-login-basic.html';
    },

    getUser: () => {
        const userStr = localStorage.getItem('erp_user');
        return userStr ? JSON.parse(userStr) : null;
    },

    checkAuth: () => {
        const token = localStorage.getItem('erp_token');
        const isLoginPage = window.location.pathname.includes('auth-login');

        if (!token) {
            if (!isLoginPage) {
                window.location.href = 'auth-login-basic.html';
            }
        } else {
            // Logged in user: prevent accessing login page
            if (isLoginPage) {
                window.location.href = 'index.html';
            } else {
                // Role guard for administrative pages
                const userStr = localStorage.getItem('erp_user');
                if (userStr) {
                    const user = JSON.parse(userStr);
                    const path = window.location.pathname;
                    if ((path.includes('app-user-list.html') || path.includes('app-access-roles.html')) &&
                        user.roleName !== 'SuperAdmin' && user.roleName !== 'Admin') {
                        window.location.href = 'index.html';
                    }
                }
            }
        }
    }
};

// Auto-check auth on script load
document.addEventListener('DOMContentLoaded', () => {
    ErpAuth.checkAuth();

    // Dynamically hide administrative sidebar navigation items for non-admins
    const user = ErpAuth.getUser();
    if (user && user.roleName !== 'SuperAdmin' && user.roleName !== 'Admin') {
        const adminMenuKeys = ['Users', 'Roles & Permissions'];
        adminMenuKeys.forEach(key => {
            const div = document.querySelector(`[data-i18n="${key}"]`);
            if (div) {
                const menuItem = div.closest('.menu-item');
                if (menuItem) {
                    menuItem.style.setProperty('display', 'none', 'important');
                }
            }
        });
    }
});
