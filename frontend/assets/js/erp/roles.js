/**
 * ERP Roles page JS
 */

'use strict';

document.addEventListener('DOMContentLoaded', async function () {
    const rolesContainer = document.getElementById('erp-role-cards-container');
    const dt_user_table = document.querySelector('.datatables-users');

    const roleDetails = {
        'SuperAdmin': { icon: 'ti tabler-crown text-primary', badgeClass: 'bg-label-danger', avatars: ['1.png', '5.png'] },
        'Admin': { icon: 'ti tabler-device-desktop text-danger', badgeClass: 'bg-label-warning', avatars: ['2.png', '12.png'] },
        'Manager': { icon: 'ti tabler-edit text-warning', badgeClass: 'bg-label-info', avatars: ['3.png', '6.png'] },
        'User': { icon: 'ti tabler-user text-success', badgeClass: 'bg-label-secondary', avatars: ['4.png', '10.png'] }
    };

    // Render roles cards dynamically
    async function loadRoles() {
        if (!rolesContainer) return;
        
        try {
            const roles = await ErpApi.get('/roles');
            if (!roles) return;

            rolesContainer.innerHTML = '';

            roles.forEach(role => {
                const details = roleDetails[role.name] || { icon: 'ti tabler-user text-primary', badgeClass: 'bg-label-primary', avatars: ['1.png'] };
                const col = document.createElement('div');
                col.className = 'col-xl-4 col-lg-6 col-md-6';
                
                // Generate dummy avatar initials or images based on count
                let avatarsHtml = '';
                const displayCount = Math.min(role.userCount, 4);
                for (let i = 0; i < displayCount; i++) {
                    const avatarNum = ((i + role.id) % 14) + 1; // dummy avatar indices 1 to 14
                    avatarsHtml += `
                        <li data-bs-toggle="tooltip" data-popup="tooltip-custom" data-bs-placement="top" title="User" class="avatar pull-up">
                            <img class="rounded-circle" src="../../assets/img/avatars/${avatarNum}.png" alt="Avatar" />
                        </li>
                    `;
                }
                if (role.userCount > 4) {
                    avatarsHtml += `
                        <li class="avatar">
                            <span class="avatar-initial rounded-circle pull-up" data-bs-toggle="tooltip" data-bs-placement="bottom" title="${role.userCount - 4} more">+${role.userCount - 4}</span>
                        </li>
                    `;
                }

                col.innerHTML = `
                    <div class="card h-100">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-4">
                                <h6 class="fw-normal mb-0 text-body">Total ${role.userCount} users</h6>
                                <ul class="list-unstyled d-flex align-items-center avatar-group mb-0">
                                    ${avatarsHtml}
                                </ul>
                            </div>
                            <div class="d-flex justify-content-between align-items-end">
                                <div class="role-heading">
                                    <h5 class="mb-1">${role.name}</h5>
                                    <span class="badge ${details.badgeClass} mb-2">${role.description}</span>
                                    <div>
                                        <a href="javascript:;" class="role-edit-modal text-muted small">
                                            <i class="icon-base ${details.icon} icon-sm me-1"></i> Predefined Role
                                        </a>
                                    </div>
                                </div>
                                <a href="javascript:void(0);" class="text-heading"><i class="icon-base ti tabler-copy icon-md"></i></a>
                            </div>
                        </div>
                    </div>
                `;
                rolesContainer.appendChild(col);
            });

            // Add the "Add New Role" card at the end
            const addRoleCol = document.createElement('div');
            addRoleCol.className = 'col-xl-4 col-lg-6 col-md-6';
            addRoleCol.innerHTML = `
                <div class="card h-100">
                    <div class="row h-100">
                        <div class="col-sm-5">
                            <div class="d-flex align-items-end h-100 justify-content-center mt-sm-0 mt-4">
                                <img src="../../assets/img/illustrations/add-new-roles.png" class="img-fluid" alt="Image" width="83" />
                            </div>
                        </div>
                        <div class="col-sm-7">
                            <div class="card-body text-sm-end text-center ps-sm-0">
                                <button class="btn btn-sm btn-primary mb-4 text-nowrap" id="add-role-btn">Add New Role</button>
                                <p class="mb-0">Add new role,<br>if it doesn't exist.</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            rolesContainer.appendChild(addRoleCol);

            document.getElementById('add-role-btn').addEventListener('click', function() {
                alert('Role customization is locked to predefined ERP roles in Phase 1.');
            });

        } catch (error) {
            console.error('Failed to load roles list:', error);
        }
    }

    await loadRoles();

    // Initialize user table filtering by role
    let dt_user;
    async function initializeUserTable() {
        try {
            if (dt_user_table) {
                dt_user = new DataTable(dt_user_table, {
                    processing: true,
                    serverSide: true,
                    ajax: async function (data, callback, settings) {
                        try {
                            const page = Math.floor(data.start / data.length) + 1;
                            const pageSize = data.length;
                            const search = data.search.value || '';
                            
                            const response = await ErpApi.get(`/users?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(search)}`);
                            
                            if (response) {
                                callback({
                                    draw: data.draw,
                                    recordsTotal: response.totalCount,
                                    recordsFiltered: response.totalCount,
                                    data: response.users
                                });
                            } else {
                                callback({ draw: data.draw, recordsTotal: 0, recordsFiltered: 0, data: [] });
                            }
                        } catch (error) {
                            console.error('Failed to load user list:', error);
                            callback({ draw: data.draw, recordsTotal: 0, recordsFiltered: 0, data: [] });
                        }
                    },
                    columns: [
                        { data: 'id' },
                        { data: 'id', orderable: false, render: DataTable.render.select() },
                        { data: 'fullName' },
                        { data: 'roleName' },
                        { data: 'isActive' },
                        { data: 'action' }
                    ],
                    columnDefs: [
                        {
                            className: 'control',
                            searchable: false,
                            orderable: false,
                            responsivePriority: 2,
                            targets: 0,
                            render: () => ''
                        },
                        {
                            targets: 1,
                            orderable: false,
                            searchable: false,
                            responsivePriority: 4,
                            checkboxes: true,
                            render: () => '<input type="checkbox" class="dt-checkboxes form-check-input">',
                            checkboxes: {
                                selectAllRender: '<input type="checkbox" class="form-check-input">'
                            }
                        },
                        {
                            targets: 2,
                            responsivePriority: 3,
                            render: (data, type, full) => {
                                const name = full.fullName;
                                const email = full.email;
                                const initials = (name.match(/\b\w/g) || []).map(char => char.toUpperCase()).slice(0, 2).join('');
                                const states = ['success', 'danger', 'warning', 'info', 'dark', 'primary', 'secondary'];
                                const state = states[Math.floor(Math.random() * states.length)];
                                const avatar = `<span class="avatar-initial rounded-circle bg-label-${state}">${initials}</span>`;

                                return `
                                    <div class="d-flex justify-content-start align-items-center user-name">
                                        <div class="avatar-wrapper">
                                            <div class="avatar avatar-sm me-4">
                                                ${avatar}
                                            </div>
                                        </div>
                                        <div class="d-flex flex-column">
                                            <a href="javascript:void(0);" class="text-heading text-truncate"><span class="fw-medium">${name}</span></a>
                                            <small>${email}</small>
                                        </div>
                                    </div>
                                `;
                            }
                        },
                        {
                            targets: 3,
                            render: (data, type, full) => {
                                const role = full.roleName;
                                const details = roleDetails[role] || { icon: 'ti tabler-user', badgeClass: 'bg-label-secondary' };
                                const iconClass = details.icon.replace('text-primary', '').replace('text-danger', '').replace('text-warning', '').replace('text-success', '');
                                return `<span class='text-truncate d-flex align-items-center text-heading'><i class="icon-base ${details.icon} icon-md me-2"></i>${role}</span>`;
                            }
                        },
                        {
                            targets: 4,
                            render: (data, type, full) => {
                                const isActive = full.isActive;
                                const statusClass = isActive ? 'bg-label-success' : 'bg-label-secondary';
                                const statusTitle = isActive ? 'Active' : 'Inactive';
                                return `<span class="badge ${statusClass}">${statusTitle}</span>`;
                            }
                        },
                        {
                            targets: 5,
                            title: 'Actions',
                            searchable: false,
                            orderable: false,
                            render: (data, type, full) => {
                                const currentUser = ErpAuth.getUser();
                                const isSuperAdmin = currentUser && currentUser.roleName === 'SuperAdmin';
                                const isAdmin = currentUser && currentUser.roleName === 'Admin';
                                
                                let actionButtons = '';
                                
                                // Deactivate/Reactivate action
                                if (full.isActive) {
                                    // Active user: Only SuperAdmin can deactivate
                                    if (isSuperAdmin) {
                                        actionButtons += `
                                            <a href="javascript:;" class="btn btn-text-secondary rounded-pill waves-effect btn-icon delete-record" data-id="${full.id}" title="Deactivate User">
                                                <i class="icon-base ti tabler-trash icon-22px"></i>
                                            </a>
                                        `;
                                    }
                                } else {
                                    // Inactive user: SuperAdmin and Admin can reactivate
                                    if (isSuperAdmin || isAdmin) {
                                        actionButtons += `
                                            <a href="javascript:;" class="btn btn-text-secondary rounded-pill waves-effect btn-icon reactivate-record" data-id="${full.id}" title="Reactivate User">
                                                <i class="icon-base ti tabler-user-check icon-22px text-success"></i>
                                            </a>
                                        `;
                                    }
                                }
                                
                                return `
                                    <div class="d-flex align-items-center">
                                        ${actionButtons}
                                    </div>
                                `;
                            }
                        }
                    ],
                    select: {
                        style: 'multi',
                        selector: 'td:nth-child(2)'
                    },
                    order: [[2, 'asc']],
                    layout: {
                        topStart: {
                            rowClass: 'row m-3 my-0 justify-content-between',
                            features: [
                                {
                                    pageLength: {
                                        menu: [10, 25, 50, 100],
                                        text: '_MENU_'
                                    }
                                }
                            ]
                        },
                        topEnd: {
                            features: [
                                {
                                    search: {
                                        placeholder: 'Search User',
                                        text: '_INPUT_'
                                    }
                                }
                            ]
                        }
                    }
                });

                // Style fixes for the layout elements
                setTimeout(() => {
                    const elementsToModify = [
                        { selector: '.dt-search .form-control', classToRemove: 'form-control-sm' },
                        { selector: '.dt-length .form-select', classToRemove: 'form-select-sm', classToAdd: 'ms-0' },
                        { selector: '.dt-length', classToAdd: 'mb-md-6 mb-0' },
                        { selector: '.dt-layout-table', classToRemove: 'row mt-2' },
                        { selector: '.dt-layout-full', classToRemove: 'col-md col-12', classToAdd: 'table-responsive' }
                    ];

                    elementsToModify.forEach(({ selector, classToRemove, classToAdd }) => {
                        document.querySelectorAll(selector).forEach(element => {
                            if (classToRemove) {
                                classToRemove.split(' ').forEach(className => element.classList.remove(className));
                            }
                            if (classToAdd) {
                                classToAdd.split(' ').forEach(className => element.classList.add(className));
                            }
                        });
                    });
                }, 100);
            }
        } catch (error) {
            console.error('Failed to load user list:', error);
        }
    }

    await initializeUserTable();

    // Handle delete user
    document.addEventListener('click', async function (e) {
        const deleteBtn = e.target.closest('.delete-record');
        if (deleteBtn) {
            const userId = deleteBtn.getAttribute('data-id');
            if (confirm('Are you sure you want to deactivate this user?')) {
                try {
                    await ErpApi.delete(`/users/${userId}`);
                    // Reload table and cards
                    const newResponse = await ErpApi.get('/users?page=1&pageSize=1000');
                    if (dt_user) {
                        dt_user.clear().rows.add(newResponse.users).draw();
                    }
                    await loadRoles();
                } catch (error) {
                    alert(error.message || 'Failed to delete user');
                }
            }
        }
    });

    // Handle reactivate user
    document.addEventListener('click', async function (e) {
        const reactivateBtn = e.target.closest('.reactivate-record');
        if (reactivateBtn) {
            const userId = reactivateBtn.getAttribute('data-id');
            if (confirm('Are you sure you want to reactivate this user?')) {
                try {
                    await ErpApi.put(`/users/${userId}`, { isActive: true });
                    // Reload table and cards
                    const newResponse = await ErpApi.get('/users?page=1&pageSize=1000');
                    if (dt_user) {
                        dt_user.clear().rows.add(newResponse.users).draw();
                    }
                    await loadRoles();
                } catch (error) {
                    alert(error.message || 'Failed to reactivate user');
                }
            }
        }
    });
});
