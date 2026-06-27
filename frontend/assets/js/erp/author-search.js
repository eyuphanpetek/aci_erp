document.addEventListener('DOMContentLoaded', async () => {
    const user = ErpAuth.getUser();
    if (!user) return;

    const canViewCosts = user.roleName === 'SuperAdmin' || user.roleName === 'Admin' || user.roleName === 'Manager';

    // Hide cost column if not authorized
    if (!canViewCosts) {
        document.querySelectorAll('.cost-col-header').forEach(el => el.remove());
    }

    // Navbar info
    const navName = document.getElementById('nav-user-fullname');
    const navRole = document.getElementById('nav-user-role');
    if (navName) navName.textContent = user.fullName;
    if (navRole) {
        const roleMap = { SuperAdmin: 'Sistem Yöneticisi', Admin: 'Yönetici', Manager: 'Müdür', Employee: 'Personel' };
        navRole.textContent = roleMap[user.roleName] || user.roleName;
    }
    document.getElementById('btn-logout')?.addEventListener('click', () => ErpAuth.logout());

    // Helpers
    const formatCurrency = (v) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(v);
    const formatDate = (d) => d ? new Date(d).toLocaleDateString('tr-TR') : '-';
    const chk = (d) => d ? `<i class="ti tabler-check text-success"></i>` : `<i class="ti tabler-minus text-muted"></i>`;

    // Load user dropdown
    const authorSelect = document.getElementById('authorSelect');
    try {
        const users = await ErpApi.get('/Users/lookup');
        users.forEach(u => {
            authorSelect.innerHTML += `<option value="${u.id}">${u.fullName}</option>`;
        });
    } catch (e) { console.error(e); }

    // Search state
    let dataTable = null;
    const searchInput = document.getElementById('authorSearchInput');
    let debounceTimer = null;

    searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        const val = searchInput.value.trim();
        if (val.length >= 2) {
            debounceTimer = setTimeout(() => {
                // Find matching user in dropdown
                const opts = Array.from(authorSelect.options);
                const match = opts.find(o => o.text.toLowerCase().includes(val.toLowerCase()));
                if (match && match.value) {
                    authorSelect.value = match.value;
                    doSearch(match.value, match.text);
                }
            }, 500);
        }
    });

    authorSelect.addEventListener('change', () => {
        const id = authorSelect.value;
        const name = authorSelect.options[authorSelect.selectedIndex]?.text;
        if (id) doSearch(id, name);
    });

    document.getElementById('btnSearch').addEventListener('click', () => {
        const id = authorSelect.value;
        const name = authorSelect.options[authorSelect.selectedIndex]?.text;
        if (id) doSearch(id, name);
        else Swal.fire('Uyarı', 'Lütfen bir yazar seçin veya arama yapın.', 'warning');
    });

    async function doSearch(userId, userName) {
        try {
            Swal.fire({ title: 'Aranıyor...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            const tasks = await ErpApi.get(`/PublicationTasks/author/${userId}`);
            Swal.close();

            document.getElementById('resultsTitle').textContent = `"${userName}" — Atanmış Görevler (${tasks.length})`;
            document.getElementById('resultsCard').classList.remove('d-none');

            // Totals
            updateSummary(tasks);

            // DataTable
            const columns = [
                { data: 'categoryName', defaultContent: '-' },
                {
                    data: null,
                    render: (d, t, r) => `<strong>${r.productName}</strong><br/><small class="text-muted">${r.branchName}</small>`
                },
                {
                    data: null,
                    render: (d, t, r) => {
                        const isAuthor = r.authorId === userId;
                        const isTypesetter = r.typesetterId === userId;
                        return isAuthor && isTypesetter ? '<span class="badge bg-label-warning">Yazar & Dizgici</span>'
                            : isAuthor ? '<span class="badge bg-label-primary">Yazar</span>'
                            : '<span class="badge bg-label-secondary">Dizgici</span>';
                    }
                },
                {
                    data: null,
                    render: (d, t, r) => `<div><small>Yaz: ${formatDate(r.authorStartDate)}</small></div>
                                          <div><small>Diz: ${formatDate(r.typesetterStartDate)}</small></div>`
                },
                {
                    data: null,
                    render: (d, t, r) => `<div class="d-flex gap-1">
                        <span class="badge bg-label-secondary" title="1. Okuma: ${formatDate(r.proofread1Date)}">${chk(r.proofread1Date)} 1.O</span>
                        <span class="badge bg-label-secondary" title="2. Okuma: ${formatDate(r.proofread2Date)}">${chk(r.proofread2Date)} 2.O</span>
                        <span class="badge bg-label-secondary" title="3. Okuma: ${formatDate(r.proofread3Date)}">${chk(r.proofread3Date)} 3.O</span>
                    </div>`
                },
                {
                    data: null,
                    render: (d, t, r) => `<small>Sayfa: ${r.pageCount || 0} | Test: ${r.testCount || 0}<br/>
                        G: ${r.traditionalCount || 0} Kav: ${r.conceptCount || 0} Bağ: ${r.contextCount || 0}</small>`
                }
            ];

            if (canViewCosts) {
                columns.push({
                    data: 'calculatedCost',
                    render: (v) => `<span class="fw-bold text-success">${formatCurrency(v || 0)}</span>`
                });
            }

            if (dataTable) {
                dataTable.destroy();
                $('.datatables-author-tasks').empty().append('<thead><tr>' +
                    ['Kategori','Ürün / Branş','Rol','Başlangıç','Aşamalar','Metrikler'].concat(canViewCosts ? ['Maliyet'] : []).map(h => `<th>${h}</th>`).join('') +
                    '</tr></thead>');
            }

            dataTable = $('.datatables-author-tasks').DataTable({
                data: tasks,
                columns: columns,
                language: { url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/tr.json', emptyTable: 'Görev bulunamadı.' },
                order: [[0, 'asc']],
                dom: '<"row"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6"f>>t<"row"<"col-sm-12 col-md-6"i><"col-sm-12 col-md-6"p>>',
                responsive: true
            });
        } catch (err) {
            console.error(err);
            Swal.fire('Hata!', 'Veriler yüklenirken bir sorun oluştu.', 'error');
        }
    }

    function updateSummary(tasks) {
        const bar = document.getElementById('summaryBar');
        document.getElementById('summaryTaskCount').textContent = tasks.length;
        document.getElementById('summaryPageCount').textContent = tasks.reduce((s, t) => s + (t.pageCount || 0), 0);
        document.getElementById('summaryQuestionCount').textContent = tasks.reduce((s, t) => s + (t.traditionalCount || 0) + (t.conceptCount || 0) + (t.contextCount || 0), 0);
        document.getElementById('summaryCost').textContent = canViewCosts
            ? formatCurrency(tasks.reduce((s, t) => s + (t.calculatedCost || 0), 0))
            : '-';
        bar.classList.remove('d-none');
    }
});
