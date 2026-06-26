/**
 * ERP Dashboard JS
 */

'use strict';

document.addEventListener('DOMContentLoaded', async function () {
    // 1. Display user name
    const userNameSpan = document.getElementById('dashboard-user-name');
    const user = ErpAuth.getUser();
    if (userNameSpan && user) {
        userNameSpan.textContent = user.fullName;
    }

    // Check if user is administrator
    const isDashboardAdmin = user && (user.roleName === 'SuperAdmin' || user.roleName === 'Admin');

    if (!isDashboardAdmin) {
        // Hide Users and Roles cards
        const usersCard = document.getElementById('dashboard-users-card');
        const rolesCard = document.getElementById('dashboard-roles-card');
        if (usersCard) usersCard.style.display = 'none';
        if (rolesCard) rolesCard.style.display = 'none';

        // Expand Database Status Card to fill row
        const dbstatusCard = document.getElementById('dashboard-dbstatus-card');
        if (dbstatusCard) {
            dbstatusCard.className = 'col-12';
        }
        return;
    }

    // 2. Fetch stats from API (Admins only)
    try {
        const usersResponse = await ErpApi.get('/users?page=1&pageSize=1');
        const rolesResponse = await ErpApi.get('/roles');

        if (usersResponse) {
            document.getElementById('stat-total-users').textContent = usersResponse.totalCount;
        }
        if (rolesResponse) {
            document.getElementById('stat-total-roles').textContent = rolesResponse.length;
        }
    } catch (error) {
        console.error('Failed to load dashboard stats:', error);
        document.getElementById('stat-total-users').textContent = 'N/A';
        document.getElementById('stat-total-roles').textContent = 'N/A';
    }
});
