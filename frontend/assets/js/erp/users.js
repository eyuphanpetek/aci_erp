/**
 * ERP User List JS
 */

'use strict';

document.addEventListener('DOMContentLoaded', async function () {
    let borderColor, bodyBg, headingColor;

    borderColor = config.colors.borderColor;
    bodyBg = config.colors.bodyBg;
    headingColor = config.colors.headingColor;

    const dt_user_table = document.querySelector('.datatables-users');
    const addNewUserForm = document.getElementById('addNewUserForm');
    const roleSelect = document.getElementById('user-role');

    // Role mapping to match styling icons/colors from the template
    const roleDetails = {
        'SuperAdmin': { icon: '<i class="icon-base ti tabler-crown icon-md text-primary me-2"></i>', badgeClass: 'bg-label-danger' },
        'Admin': { icon: '<i class="icon-base ti tabler-device-desktop icon-md text-danger me-2"></i>', badgeClass: 'bg-label-warning' },
        'Manager': { icon: '<i class="icon-base ti tabler-edit icon-md text-warning me-2"></i>', badgeClass: 'bg-label-info' },
        'User': { icon: '<i class="icon-base ti tabler-user icon-md text-success me-2"></i>', badgeClass: 'bg-label-secondary' }
    };

    // Load roles dynamically for the dropdown select
    async function loadRoles() {
        try {
            const roles = await ErpApi.get('/roles');
            if (roleSelect && roles) {
                roleSelect.innerHTML = '';
                roles.forEach(role => {
                    const option = document.createElement('option');
                    option.value = role.id;
                    option.textContent = role.name;
                    roleSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Failed to load roles:', error);
        }
    }

    await loadRoles();

    let dt_user;

    // Load users and initialize Datatable
    async function initializeUserTable() {
        try {
            const response = await ErpApi.get('/users?page=1&pageSize=1000');
            const usersData = response ? response.users : [];

            if (dt_user_table) {
                dt_user = new DataTable(dt_user_table, {
                    data: usersData,
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
                            // For Responsive Control
                            className: 'control',
                            searchable: false,
                            orderable: false,
                            responsivePriority: 2,
                            targets: 0,
                            render: () => ''
                        },
                        {
                            // For Checkboxes
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
                            // User (Avatar, Name, Email)
                            targets: 2,
                            responsivePriority: 3,
                            render: (data, type, full) => {
                                const name = full.fullName;
                                const email = full.email;
                                
                                // Initials for Avatar
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
                            // Role
                            targets: 3,
                            render: (data, type, full) => {
                                const role = full.roleName;
                                const details = roleDetails[role] || { icon: '', badgeClass: 'bg-label-secondary' };
                                return `<span class='text-truncate d-flex align-items-center text-heading'>${details.icon}${role}</span>`;
                            }
                        },
                        {
                            // Status
                            targets: 4,
                            render: (data, type, full) => {
                                const isActive = full.isActive;
                                const statusClass = isActive ? 'bg-label-success' : 'bg-label-secondary';
                                const statusTitle = isActive ? 'Active' : 'Inactive';
                                return `<span class="badge ${statusClass}">${statusTitle}</span>`;
                            }
                        },
                        {
                            // Actions
                            targets: 5,
                            title: 'Actions',
                            searchable: false,
                            orderable: false,
                            render: (data, type, full) => {
                                return `
                                    <div class="d-flex align-items-center">
                                        <a href="javascript:;" class="btn btn-text-secondary rounded-pill waves-effect btn-icon delete-record" data-id="${full.id}">
                                            <i class="icon-base ti tabler-trash icon-22px"></i>
                                        </a>
                                        <a href="javascript:;" class="btn btn-text-secondary rounded-pill waves-effect btn-icon edit-record" data-id="${full.id}">
                                            <i class="icon-base ti tabler-edit icon-22px"></i>
                                        </a>
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
                                },
                                {
                                    buttons: [
                                        {
                                            text: '<span class="d-flex align-items-center gap-2"><i class="icon-base ti tabler-plus icon-xs"></i> Add User</span>',
                                            className: 'add-new btn btn-primary waves-effect waves-light',
                                            attr: {
                                                'data-bs-toggle': 'offcanvas',
                                                'data-bs-target': '#offcanvasAddUser'
                                            }
                                        }
                                    ]
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
                        { selector: '.dt-buttons', classToAdd: 'd-flex gap-4 mb-md-0 mb-4' },
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

    // Handle user creation
    if (addNewUserForm) {
        addNewUserForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const fullName = document.getElementById('add-user-fullname').value;
            const email = document.getElementById('add-user-email').value;
            const password = document.getElementById('add-user-password').value;
            const roleId = parseInt(roleSelect.value);

            if (!fullName || !email || !password || !roleId) {
                alert('Please fill in all fields (Full Name, Email, Password, and Role).');
                return;
            }

            try {
                const response = await ErpApi.post('/users', {
                    fullName,
                    email,
                    password,
                    roleId
                });

                if (response) {
                    // Close the offcanvas
                    const offcanvasEl = document.getElementById('offcanvasAddUser');
                    const offcanvas = bootstrap.Offcanvas.getInstance(offcanvasEl) || new bootstrap.Offcanvas(offcanvasEl);
                    offcanvas.hide();

                    // Reset the form
                    addNewUserForm.reset();

                    // Reload the table data
                    if (dt_user) {
                        const newResponse = await ErpApi.get('/users?page=1&pageSize=1000');
                        dt_user.clear().rows.add(newResponse.users).draw();
                    }
                }
            } catch (error) {
                alert(error.message || 'Failed to add user');
            }
        });
    }

    // Handle delete user (soft-delete / deactivate)
    document.addEventListener('click', async function (e) {
        const deleteBtn = e.target.closest('.delete-record');
        if (deleteBtn) {
            const userId = deleteBtn.getAttribute('data-id');
            if (confirm('Are you sure you want to deactivate this user?')) {
                try {
                    await ErpApi.delete(`/users/${userId}`);
                    // Reload table
                    const newResponse = await ErpApi.get('/users?page=1&pageSize=1000');
                    if (dt_user) {
                        dt_user.clear().rows.add(newResponse.users).draw();
                    }
                } catch (error) {
                    alert(error.message || 'Failed to delete user');
                }
            }
        }
    });
});
