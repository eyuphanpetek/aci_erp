(function() {
    try {
        const userStr = localStorage.getItem('erp_user');
        if (userStr) {
            const user = JSON.parse(userStr);
            if (user.roleName !== 'SuperAdmin' && user.roleName !== 'Admin') {
                const style = document.createElement('style');
                style.textContent = `
                    li:has(> a > div[data-i18n="User Management"]),
                    li:has(> a > div[data-i18n="Users"]),
                    li:has(> a > div[data-i18n="Roles & Permissions"]),
                    li:has(> a > div[data-i18n="Roles"]) {
                        display: none !important;
                    }
                    li.menu-header:has(span[data-i18n="Management"]) {
                        display: none !important;
                    }
                `;
                document.documentElement.appendChild(style);
            }
        }
    } catch(e) {}
})();

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
                throw new Error(data.message || 'Giriş başarısız');
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

    const user = ErpAuth.getUser();
    if (user) {
        // Dynamically update navbar user profile dropdown details
        const userNameEl = document.querySelector('.dropdown-user .flex-grow-1 h6');
        if (userNameEl) {
            userNameEl.textContent = user.fullName;
        }
        const userRoleEl = document.querySelector('.dropdown-user .flex-grow-1 small');
        if (userRoleEl) {
            let roleDisplay = user.roleName;
            if (user.roleName === 'SuperAdmin') roleDisplay = 'Sistem Yöneticisi';
            else if (user.roleName === 'Admin') roleDisplay = 'Yönetici';
            else if (user.roleName === 'Manager') roleDisplay = 'Müdür';
            else if (user.roleName === 'Employee') roleDisplay = 'Personel';
            userRoleEl.textContent = roleDisplay;
        }

        // Menu items are hidden via CSS early on, but we also physically remove them from the DOM here
        // as a fallback in case CSS :has() is unsupported or other scripts try to manipulate them.
        if (user.roleName !== 'SuperAdmin' && user.roleName !== 'Admin') {
            const adminMenuKeys = ['User Management', 'Users', 'Roles & Permissions', 'Roles'];
            adminMenuKeys.forEach(key => {
                document.querySelectorAll(`[data-i18n="${key}"]`).forEach(div => {
                    const menuItem = div.closest('.menu-item');
                    if (menuItem) menuItem.remove();
                });
            });
            document.querySelectorAll('.menu-header-text[data-i18n="Management"]').forEach(span => {
                const header = span.closest('.menu-header');
                if (header) header.remove();
            });
        }
    }
});
