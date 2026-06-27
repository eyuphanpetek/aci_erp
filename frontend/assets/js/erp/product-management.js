document.addEventListener('DOMContentLoaded', async () => {
    // 1. Auth Setup & Roles Guard
    const user = ErpAuth.getUser();
    if (!user) return;

    const isAdmin = user.roleName === 'SuperAdmin' || user.roleName === 'Admin';
    if (!isAdmin) {
        document.getElementById('unauthorized-alert').classList.remove('d-none');
    }

    // Bind Logout
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => ErpAuth.logout());
    }

    // Load User info in Navbar if present
    const navUserFullname = document.getElementById('nav-user-fullname');
    const navUserRole = document.getElementById('nav-user-role');
    if (navUserFullname) navUserFullname.textContent = user.fullName;
    if (navUserRole) {
        let roleDisplay = user.roleName;
        if (user.roleName === 'SuperAdmin') roleDisplay = 'Sistem Yöneticisi';
        else if (user.roleName === 'Admin') roleDisplay = 'Yönetici';
        else if (user.roleName === 'Manager') roleDisplay = 'Müdür';
        else if (user.roleName === 'Employee') roleDisplay = 'Personel';
        navUserRole.textContent = roleDisplay;
    }


    // 2. Fetch and Render Accordion
    async function loadCatalog() {
        const accordionContainer = document.getElementById('categoryAccordion');
        accordionContainer.innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Yükleniyor...</span>
                </div>
            </div>`;

        try {
            const response = await fetch(`${API_BASE_URL}/categories`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('erp_token')}`
                }
            });

            if (!response.ok) throw new Error('Katalog yüklenemedi');

            const categories = await response.json();
            accordionContainer.innerHTML = '';

            categories.forEach((cat, index) => {
                const accordionItem = document.createElement('div');
                accordionItem.className = 'accordion-item';

                let productsHtml = '';
                if (cat.products.length === 0) {
                    productsHtml = '<p class="text-muted p-3 mb-0">Bu kategoride henüz ürün tanımlanmamış.</p>';
                } else {
                    productsHtml = cat.products.map(prod => {
                        const branchesHtml = prod.branches.map(br => `
                            <span class="badge bg-label-primary me-2 my-1 fs-6">
                                ${br.name}
                                ${isAdmin ? `<a href="javascript:void(0);" class="text-danger ms-1 text-decoration-none remove-branch-btn" data-pb-id="${br.productBranchId}">&times;</a>` : ''}
                            </span>
                        `).join('');

                        return `
                            <div class="card mb-3 border border-1 p-3 product-card" data-product-id="${prod.id}">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <h6 class="fw-bold mb-0 text-heading">${prod.name}</h6>
                                    ${isAdmin ? `<button class="btn btn-sm btn-outline-danger delete-product-btn" data-product-id="${prod.id}">Sil</button>` : ''}
                                </div>
                                <div class="mb-2">
                                    <strong>Bağlı Branşlar:</strong>
                                    <div class="d-flex flex-wrap align-items-center mt-1">
                                        ${branchesHtml || '<span class="text-muted fs-7">Branş atanmamış.</span>'}
                                    </div>
                                </div>
                                ${isAdmin ? `
                                <div class="input-group input-group-sm mt-3 add-branch-group" style="max-width: 300px;">
                                    <input type="text" class="form-control branch-input" placeholder="Yeni branş adı girin..." />
                                    <button class="btn btn-primary add-branch-btn" type="button" data-product-id="${prod.id}">+ Branş</button>
                                </div>` : ''}
                            </div>
                        `;
                    }).join('');
                }

                accordionItem.innerHTML = `
                    <h2 class="accordion-header" id="heading-${cat.id}">
                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse"
                            data-bs-target="#collapse-${cat.id}" aria-expanded="false" aria-controls="collapse-${cat.id}">
                            <i class="ti tabler-folder me-2 text-primary"></i>
                            <strong>${cat.name}</strong>
                        </button>
                    </h2>
                    <div id="collapse-${cat.id}" class="accordion-collapse collapse"
                        aria-labelledby="heading-${cat.id}" data-bs-parent="#categoryAccordion">
                        <div class="accordion-body">
                            <div class="product-list-container">
                                ${productsHtml}
                            </div>
                            ${isAdmin ? `
                            <div class="mt-4">
                                <button class="btn btn-sm btn-outline-primary add-product-modal-btn" data-category-id="${cat.id}">
                                    + Yeni Ürün Ekle
                                </button>
                            </div>` : ''}
                        </div>
                    </div>
                `;

                accordionContainer.appendChild(accordionItem);
            });

            // 3. Register Event Listeners
            if (isAdmin) {
                // Delete Product
                document.querySelectorAll('.delete-product-btn').forEach(btn => {
                    btn.addEventListener('click', async function () {
                        const prodId = this.getAttribute('data-product-id');
                        const confirm = await Swal.fire({
                            title: 'Emin misiniz?',
                            text: "Bu ürün silindiğinde, ürüne ait tüm maliyet ve iş takip görevleri de silinecektir!",
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonText: 'Evet, Sil!',
                            cancelButtonText: 'İptal',
                            customClass: {
                                confirmButton: 'btn btn-danger me-3',
                                cancelButton: 'btn btn-label-secondary'
                            },
                            buttonsStyling: false
                        });

                        if (confirm.isConfirmed) {
                            try {
                                const delRes = await fetch(`${API_BASE_URL}/products/${prodId}`, {
                                    method: 'DELETE',
                                    headers: {
                                        'Authorization': `Bearer ${localStorage.getItem('erp_token')}`
                                    }
                                });

                                if (delRes.ok) {
                                    Swal.fire({ icon: 'success', title: 'Silindi', text: 'Ürün başarıyla silindi.', timer: 1500 });
                                    loadCatalog();
                                } else {
                                    throw new Error();
                                }
                            } catch {
                                Swal.fire({ icon: 'error', title: 'Başarısız', text: 'Ürün silinirken bir hata oluştu.' });
                            }
                        }
                    });
                });

                // Add Branch
                document.querySelectorAll('.add-branch-btn').forEach(btn => {
                    btn.addEventListener('click', async function () {
                        const prodId = this.getAttribute('data-product-id');
                        const input = this.closest('.add-branch-group').querySelector('.branch-input');
                        const branchName = input.value.trim();

                        if (!branchName) {
                            Swal.fire({ icon: 'warning', title: 'Uyarı', text: 'Lütfen geçerli bir branş adı girin.' });
                            return;
                        }

                        try {
                            const res = await fetch(`${API_BASE_URL}/products/${prodId}/branches`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${localStorage.getItem('erp_token')}`
                                },
                                body: JSON.stringify({ branchName })
                            });

                            if (res.ok) {
                                Swal.fire({ icon: 'success', title: 'Eklendi', text: 'Branş başarıyla eklendi.', timer: 1200 });
                                loadCatalog();
                            } else {
                                throw new Error();
                            }
                        } catch {
                            Swal.fire({ icon: 'error', title: 'Başarısız', text: 'Branş eklenirken bir hata oluştu.' });
                        }
                    });
                });

                // Remove Branch
                document.querySelectorAll('.remove-branch-btn').forEach(btn => {
                    btn.addEventListener('click', async function () {
                        const pbId = this.getAttribute('data-pb-id');
                        const confirm = await Swal.fire({
                            title: 'Emin misiniz?',
                            text: "Branşın ürün bağlantısı kesilecektir. Bu işlem geri alınamaz!",
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonText: 'Evet, Çıkar!',
                            cancelButtonText: 'İptal',
                            customClass: {
                                confirmButton: 'btn btn-danger me-3',
                                cancelButton: 'btn btn-label-secondary'
                            },
                            buttonsStyling: false
                        });

                        if (confirm.isConfirmed) {
                            try {
                                const delRes = await fetch(`${API_BASE_URL}/products/branches/${pbId}`, {
                                    method: 'DELETE',
                                    headers: {
                                        'Authorization': `Bearer ${localStorage.getItem('erp_token')}`
                                    }
                                });

                                if (delRes.ok) {
                                    Swal.fire({ icon: 'success', title: 'Çıkarıldı', text: 'Branş üründen çıkarıldı.', timer: 1200 });
                                    loadCatalog();
                                } else {
                                    throw new Error();
                                }
                            } catch {
                                Swal.fire({ icon: 'error', title: 'Başarısız', text: 'Branş çıkarılırken bir hata oluştu.' });
                            }
                        }
                    });
                });

                // Open Product Add Modal
                document.querySelectorAll('.add-product-modal-btn').forEach(btn => {
                    btn.addEventListener('click', function () {
                        const catId = this.getAttribute('data-category-id');
                        document.getElementById('modal-category-id').value = catId;
                        document.getElementById('modal-product-name').value = '';
                        
                        const modal = new bootstrap.Modal(document.getElementById('addProductModal'));
                        modal.show();
                    });
                });
            }

        } catch (error) {
            accordionContainer.innerHTML = `<div class="alert alert-danger mb-0">Hata: ${error.message}</div>`;
        }
    }

    // Add Product Form Submit
    const addProductForm = document.getElementById('addProductForm');
    if (addProductForm) {
        addProductForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const name = document.getElementById('modal-product-name').value.trim();
            const categoryId = parseInt(document.getElementById('modal-category-id').value);

            if (!name) return;

            try {
                const res = await fetch(`${API_BASE_URL}/products`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('erp_token')}`
                    },
                    body: JSON.stringify({ name, categoryId })
                });

                if (res.ok) {
                    // Close Modal
                    const modalEl = document.getElementById('addProductModal');
                    const modal = bootstrap.Modal.getInstance(modalEl);
                    modal.hide();

                    Swal.fire({ icon: 'success', title: 'Başarılı', text: 'Ürün ve varsayılan branşlar başarıyla eklendi.', timer: 2000 });
                    loadCatalog();
                } else {
                    const data = await res.json();
                    throw new Error(data.message || 'Ürün eklenemedi');
                }
            } catch (error) {
                Swal.fire({ icon: 'error', title: 'Hata', text: error.message });
            }
        });
    }

    // Initial Load
    loadCatalog();
});
