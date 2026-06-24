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

    // 2. Fetch stats from API
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
