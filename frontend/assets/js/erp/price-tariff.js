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


    // 2. Fetch and Render Tariff Table
    const tableBody = document.querySelector('#tariffTable tbody');
    
    async function loadTariffs() {
        try {
            const response = await fetch(`${API_BASE_URL}/tariff`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('erp_token')}`
                }
            });

            if (!response.ok) throw new Error('Tarife yüklenemedi');

            const tariffs = await response.json();
            tableBody.innerHTML = '';

            tariffs.forEach((t, i) => {
                const row = document.createElement('tr');
                
                const priceCellContent = isAdmin ? `
                    <div class="input-group input-group-merge" style="max-width: 150px;">
                        <input type="number" step="0.01" min="0" class="form-control price-input" 
                            data-tariff-id="${t.id}" value="${t.unitPrice.toFixed(2)}" />
                        <span class="input-group-text">₺</span>
                    </div>` : `
                    <span class="fw-medium">${t.unitPrice.toFixed(2)} ₺</span>`;

                row.innerHTML = `
                    <td>${i + 1}</td>
                    <td><strong>${t.name}</strong></td>
                    <td>${priceCellContent}</td>
                    <td><span class="badge bg-label-secondary">${t.unit}</span></td>
                `;

                tableBody.appendChild(row);
            });

            // Bind update events if Admin
            if (isAdmin) {
                document.querySelectorAll('.price-input').forEach(input => {
                    // Update on Blur
                    input.addEventListener('blur', function() {
                        updatePrice(this);
                    });

                    // Update on Enter Key
                    input.addEventListener('keypress', function(e) {
                        if (e.key === 'Enter') {
                            this.blur(); // Triggers blur which calls updatePrice
                        }
                    });
                });
            }

        } catch (error) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-danger py-4">
                        Hata: ${error.message}
                    </td>
                </tr>`;
        }
    }

    // 3. Save Price Changes to API
    async function updatePrice(inputElement) {
        const id = inputElement.getAttribute('data-tariff-id');
        const unitPrice = parseFloat(inputElement.value);

        if (isNaN(unitPrice) || unitPrice < 0) {
            Swal.fire({ icon: 'error', title: 'Hata', text: 'Lütfen geçerli bir birim fiyat girin.' });
            loadTariffs(); // Reset to current database value
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/tariff/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('erp_token')}`
                },
                body: JSON.stringify({ unitPrice })
            });

            if (res.ok) {
                // Flash input background briefly as a success indicator
                inputElement.classList.add('is-valid');
                setTimeout(() => {
                    inputElement.classList.remove('is-valid');
                }, 1000);
            } else {
                const data = await res.json();
                throw new Error(data.message || 'Fiyat güncellenemedi');
            }
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Hata', text: error.message });
            loadTariffs(); // Reset
        }
    }

    // Initial load
    loadTariffs();
});
