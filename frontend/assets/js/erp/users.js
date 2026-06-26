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
        'Employee': { icon: '<i class="icon-base ti tabler-user icon-md text-success me-2"></i>', badgeClass: 'bg-label-secondary' },
        'User': { icon: '<i class="icon-base ti tabler-user icon-md text-success me-2"></i>', badgeClass: 'bg-label-secondary' }
    };

    const roleTranslations = {
        'SuperAdmin': 'Sistem Yöneticisi',
        'Admin': 'Yönetici',
        'Manager': 'Müdür',
        'Employee': 'Personel',
        'User': 'Kullanıcı'
    };

    const editRoleSelect = document.getElementById('edit-user-role');

    // Load roles dynamically for the dropdown select
    async function loadRoles() {
        try {
            const roles = await ErpApi.get('/roles');
            const currentUser = ErpAuth.getUser();
            const isAdmin = currentUser && currentUser.roleName === 'Admin';

            // Filter out SuperAdmin role from display if logged in user is just Admin
            const filteredRoles = roles.filter(role => {
                if (isAdmin && role.id === 1) return false;
                return true;
            });

            if (roleSelect && roles) {
                roleSelect.innerHTML = '';
                filteredRoles.forEach(role => {
                    const option = document.createElement('option');
                    option.value = role.id;
                    option.textContent = roleTranslations[role.name] || role.name;
                    roleSelect.appendChild(option);
                });
            }

            if (editRoleSelect && roles) {
                editRoleSelect.innerHTML = '';
                filteredRoles.forEach(role => {
                    const option = document.createElement('option');
                    option.value = role.id;
                    option.textContent = roleTranslations[role.name] || role.name;
                    editRoleSelect.appendChild(option);
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
            if (dt_user_table) {
                dt_user = new DataTable(dt_user_table, {
                    language: {
                        search: '',
                        searchPlaceholder: 'Kullanıcı Ara',
                        lengthMenu: '_MENU_',
                        info: '_TOTAL_ kayıttan _START_ - _END_ arası gösteriliyor',
                        infoEmpty: 'Kayıt bulunamadı',
                        infoFiltered: '(_MAX_ kayıt arasından filtrelendi)',
                        zeroRecords: 'Eşleşen kayıt bulunamadı',
                        paginate: {
                            first: 'İlk',
                            previous: 'Önceki',
                            next: 'Sonraki',
                            last: 'Son'
                        }
                    },
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
                                const translatedRole = roleTranslations[role] || role;
                                return `<span class='text-truncate d-flex align-items-center text-heading'>${details.icon}${translatedRole}</span>`;
                            }
                        },
                        {
                            // Status
                            targets: 4,
                            render: (data, type, full) => {
                                const isActive = full.isActive;
                                const statusClass = isActive ? 'bg-label-success' : 'bg-label-secondary';
                                const statusTitle = isActive ? 'Aktif' : 'Pasif';
                                return `<span class="badge ${statusClass}">${statusTitle}</span>`;
                            }
                        },
                        {
                            // Actions
                            targets: 5,
                            title: 'İşlemler',
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
                                
                                // Edit button: Both SuperAdmin and Admin can edit details
                                if (isSuperAdmin || isAdmin) {
                                    actionButtons += `
                                        <a href="javascript:;" class="btn btn-text-secondary rounded-pill waves-effect btn-icon edit-record" data-id="${full.id}" title="Edit User">
                                            <i class="icon-base ti tabler-edit icon-22px"></i>
                                        </a>
                                    `;
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
                                        placeholder: 'Kullanıcı Ara',
                                        text: '_INPUT_'
                                    }
                                },
                                {
                                    buttons: (function() {
                                        const currentUser = ErpAuth.getUser();
                                        const isSuperAdmin = currentUser && currentUser.roleName === 'SuperAdmin';
                                        return isSuperAdmin ? [
                                            {
                                                text: '<span class="d-flex align-items-center gap-2"><i class="icon-base ti tabler-plus icon-xs"></i> Kullanıcı Ekle</span>',
                                                className: 'add-new btn btn-primary waves-effect waves-light',
                                                attr: {
                                                    'data-bs-toggle': 'offcanvas',
                                                    'data-bs-target': '#offcanvasAddUser'
                                                }
                                            }
                                        ] : [];
                                    })()
                                }
                            ]
                        },
                        bottomStart: {
                            rowClass: 'row mx-3 justify-content-between',
                            features: ['info']
                        },
                        bottomEnd: 'paging'
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
                alert('Lütfen tüm alanları doldurun (Ad Soyad, E-posta, Şifre ve Rol).');
                return;
            }

            // Password strength validation (at least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character)
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;
            if (!passwordRegex.test(password)) {
                alert('Şifre en az 8 karakter uzunluğunda olmalı ve en az bir büyük harf, bir küçük harf, bir rakam ve bir özel karakter içermelidir.');
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
                alert(error.message || 'Kullanıcı eklenemedi');
            }
        });
    }

    // Handle delete user (soft-delete / deactivate)
    document.addEventListener('click', async function (e) {
        const deleteBtn = e.target.closest('.delete-record');
        if (deleteBtn) {
            const userId = deleteBtn.getAttribute('data-id');
            if (confirm('Bu kullanıcıyı devre dışı bırakmak istediğinizden emin misiniz?')) {
                try {
                    await ErpApi.delete(`/users/${userId}`);
                    // Reload table
                    const newResponse = await ErpApi.get('/users?page=1&pageSize=1000');
                    if (dt_user) {
                        dt_user.clear().rows.add(newResponse.users).draw();
                    }
                } catch (error) {
                    alert(error.message || 'Kullanıcı devre dışı bırakılamadı');
                }
            }
        }
    });

    // Handle reactivate user
    document.addEventListener('click', async function (e) {
        const reactivateBtn = e.target.closest('.reactivate-record');
        if (reactivateBtn) {
            const userId = reactivateBtn.getAttribute('data-id');
            if (confirm('Bu kullanıcıyı yeniden etkinleştirmek istediğinizden emin misiniz?')) {
                try {
                    await ErpApi.put(`/users/${userId}`, { isActive: true });
                    // Reload table
                    const newResponse = await ErpApi.get('/users?page=1&pageSize=1000');
                    if (dt_user) {
                        dt_user.clear().rows.add(newResponse.users).draw();
                    }
                } catch (error) {
                    alert(error.message || 'Kullanıcı etkinleştirilemedi');
                }
            }
        }
    });

    // Handle edit user click
    document.addEventListener('click', async function (e) {
        const editBtn = e.target.closest('.edit-record');
        if (editBtn) {
            const userId = editBtn.getAttribute('data-id');
            try {
                const user = await ErpApi.get(`/users/${userId}`);
                if (user) {
                    document.getElementById('edit-user-id').value = user.id;
                    document.getElementById('edit-user-fullname').value = user.fullName;
                    document.getElementById('edit-user-email').value = user.email;
                    document.getElementById('edit-user-password').value = ''; // clear password field
                    
                    const roleSelectEl = document.getElementById('edit-user-role');
                    if (roleSelectEl) {
                        roleSelectEl.value = user.roleId;
                    }

                    // Hierarchy guard: If logged in as Admin and editing a SuperAdmin,
                    // disable the form inputs and save button to prevent modifications.
                    const currentUser = ErpAuth.getUser();
                    const isTargetSuperAdmin = user.roleName === 'SuperAdmin';
                    const isOperatorAdmin = currentUser && currentUser.roleName === 'Admin';
                    
                    const formInputs = document.querySelectorAll('#editUserForm input, #editUserForm select, #editUserForm button[type="submit"]');
                    if (isOperatorAdmin && isTargetSuperAdmin) {
                        formInputs.forEach(input => {
                            if (input.id !== 'edit-user-email') {
                                input.setAttribute('disabled', 'true');
                            }
                        });
                        alert('Yönetici yetkisiyle Sistem Yöneticisi hesabı düzenlenemez.');
                    } else {
                        formInputs.forEach(input => {
                            if (input.id !== 'edit-user-email') {
                                input.removeAttribute('disabled');
                            }
                        });
                    }

                    // Show the offcanvas
                    const offcanvasEl = document.getElementById('offcanvasEditUser');
                    const offcanvas = new bootstrap.Offcanvas(offcanvasEl);
                    offcanvas.show();
                }
            } catch (error) {
                alert(error.message || 'Kullanıcı bilgileri yüklenemedi');
            }
        }
    });

    // Handle edit form submit
    const editUserForm = document.getElementById('editUserForm');
    if (editUserForm) {
        editUserForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const userId = document.getElementById('edit-user-id').value;
            const fullName = document.getElementById('edit-user-fullname').value;
            const password = document.getElementById('edit-user-password').value;
            const roleId = parseInt(document.getElementById('edit-user-role').value);

            if (!fullName || !roleId) {
                alert('Lütfen Ad Soyad ve Rol alanlarını doldurun.');
                return;
            }

            const updateData = {
                fullName,
                roleId
            };

            // Optional password update
            if (password) {
                // Password strength validation
                const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;
                if (!passwordRegex.test(password)) {
                    alert('Şifre en az 8 karakter uzunluğunda olmalı ve en az bir büyük harf, bir küçük harf, bir rakam ve bir özel karakter içermelidir.');
                    return;
                }
                updateData.password = password;
            }

            try {
                const response = await ErpApi.put(`/users/${userId}`, updateData);

                if (response) {
                    // Close the offcanvas
                    const offcanvasEl = document.getElementById('offcanvasEditUser');
                    const offcanvas = bootstrap.Offcanvas.getInstance(offcanvasEl) || new bootstrap.Offcanvas(offcanvasEl);
                    offcanvas.hide();

                    // Reload the table data
                    if (dt_user) {
                        const newResponse = await ErpApi.get('/users?page=1&pageSize=1000');
                        dt_user.clear().rows.add(newResponse.users).draw();
                    }
                }
            } catch (error) {
                alert(error.message || 'Kullanıcı güncellenemedi');
            }
        });
    }
});
