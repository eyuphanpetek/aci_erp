document.addEventListener('DOMContentLoaded', async () => {
    // 1. Auth Setup
    const user = ErpAuth.getUser();
    if (!user) return;

    // Check role for showing/hiding costs
    const canViewCosts = user.roleName === 'SuperAdmin' || user.roleName === 'Admin' || user.roleName === 'Manager';

    // Hide the cost column header if not authorized
    if (!canViewCosts) {
        document.querySelectorAll('.cost-column').forEach(el => el.remove());
    }

    // Bind Logout
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => ErpAuth.logout());
    }

    // Load User info in Navbar
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

    // 2. DOM Elements & State
    const categorySelect = document.getElementById('categorySelect');
    const btnRefreshTasks = document.getElementById('btnRefreshTasks');
    const tasksCard = document.getElementById('tasks-card');
    let dataTable = null;
    let currentTasks = [];

    // Modal elements
    const editModal = new bootstrap.Modal(document.getElementById('editTaskModal'));
    const editForm = document.getElementById('editTaskForm');
    const authorSelect = document.getElementById('modal-author-id');
    const typesetterSelect = document.getElementById('modal-typesetter-id');

    // 3. Load Initial Data (Categories & Users)
    async function loadCategories() {
        try {
            const data = await ErpApi.get('/Categories');
            categorySelect.innerHTML = '<option value="">-- Kategori Seçin --</option>';
            data.forEach(c => {
                categorySelect.innerHTML += `<option value="${c.id}">${c.name}</option>`;
            });
        } catch (err) {
            console.error('Error loading categories:', err);
            categorySelect.innerHTML = '<option value="">Yükleme hatası</option>';
        }
    }

    async function loadUsers() {
        try {
            const data = await ErpApi.get('/Users/lookup');
            const authorOpts = '<option value="">Seçiniz...</option>' + data.map(u => `<option value="${u.id}">${u.fullName}</option>`).join('');
            authorSelect.innerHTML = authorOpts;
            typesetterSelect.innerHTML = authorOpts;
        } catch (err) {
            console.error('Error loading users:', err);
        }
    }

    // Initialize formatting
    const formatCurrency = (val) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);
    const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString('tr-TR') : '-';

    // 4. Initialize / Refresh DataTable
    async function loadTasks() {
        const catId = categorySelect.value;
        if (!catId) {
            tasksCard.style.display = 'none';
            document.getElementById('totalBar').classList.add('d-none');
            return;
        }

        try {
            Swal.fire({ title: 'Yükleniyor...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            currentTasks = await ErpApi.get(`/PublicationTasks?categoryId=${catId}`);
            Swal.close();

            tasksCard.style.display = 'block';
            updateTotals(currentTasks);

            if (dataTable) {
                dataTable.clear().rows.add(currentTasks).draw();
            } else {
                initDataTable(currentTasks);
            }
        } catch (err) {
            console.error(err);
            Swal.fire('Hata!', 'Görevler yüklenirken bir sorun oluştu.', 'error');
        }
    }

    function updateTotals(tasks) {
        const totalBar = document.getElementById('totalBar');
        const taskCount = tasks.length;
        const pageCount = tasks.reduce((s, t) => s + (t.pageCount || 0), 0);
        const questionCount = tasks.reduce((s, t) => s + (t.traditionalCount || 0) + (t.conceptCount || 0) + (t.contextCount || 0), 0);
        const totalCostVal = tasks.reduce((s, t) => s + (t.calculatedCost || 0), 0);

        document.getElementById('totalTaskCount').textContent = taskCount;
        document.getElementById('totalPageCount').textContent = pageCount;
        document.getElementById('totalQuestionCount').textContent = questionCount;
        document.getElementById('totalCost').textContent = canViewCosts ? formatCurrency(totalCostVal) : '-';
        totalBar.classList.remove('d-none');
    }

    function initDataTable(data) {
        const columns = [
            {
                data: null,
                render: (data, type, row) => `<strong>${row.productName}</strong><br/><small class="text-muted">${row.branchName}</small>`
            },
            {
                data: null,
                render: (data, type, row) => {
                    return `<div><span class="badge bg-label-primary me-1" title="Yazar"><i class="ti tabler-pencil fs-6"></i></span> ${row.authorName || '-'}</div>
                            <div class="mt-1"><span class="badge bg-label-secondary me-1" title="Dizgici"><i class="ti tabler-keyboard fs-6"></i></span> ${row.typesetterName || '-'}</div>`;
                }
            },
            {
                data: null,
                render: (data, type, row) => {
                    return `<div><small class="text-muted">Yaz:</small> ${formatDate(row.authorStartDate)}</div>
                            <div><small class="text-muted">Diz:</small> ${formatDate(row.typesetterStartDate)}</div>`;
                }
            },
            {
                data: null,
                render: (data, type, row) => {
                    const chk = (d) => d ? '<i class="ti tabler-check text-success"></i>' : '<i class="ti tabler-minus text-muted"></i>';
                    return `<div class="d-flex gap-2">
                                <span title="1. Okuma: ${formatDate(row.proofread1Date)}" class="badge bg-label-secondary">${chk(row.proofread1Date)} 1.O</span>
                                <span title="2. Okuma: ${formatDate(row.proofread2Date)}" class="badge bg-label-secondary">${chk(row.proofread2Date)} 2.O</span>
                                <span title="3. Okuma: ${formatDate(row.proofread3Date)}" class="badge bg-label-secondary">${chk(row.proofread3Date)} 3.O</span>
                            </div>`;
                }
            },
            {
                data: null,
                render: (data, type, row) => {
                    return `<small>
                        Sayfa: ${row.pageCount} | Test: ${row.testCount}<br/>
                        Soru (G: ${row.traditionalCount}, Kav: ${row.conceptCount}, Bağ: ${row.contextCount})<br/>
                        Konu Anf: ${row.topicPageCount}
                    </small>`;
                }
            }
        ];

        if (canViewCosts) {
            columns.push({
                data: 'calculatedCost',
                render: (data) => `<span class="fw-bold text-success">${formatCurrency(data || 0)}</span>`
            });
        }

        // Action column
        columns.push({
            data: null,
            orderable: false,
            render: (data, type, row) => {
                return `<button class="btn btn-sm btn-icon btn-primary btn-edit-task" data-id="${row.id}" title="Düzenle">
                            <i class="ti tabler-edit"></i>
                        </button>`;
            }
        });

        dataTable = $('.datatables-tasks').DataTable({
            data: data,
            columns: columns,
            language: {
                url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/tr.json',
                emptyTable: "Bu kategoride görev bulunamadı."
            },
            order: [[0, 'asc']],
            dom: '<"row"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6"f>>t<"row"<"col-sm-12 col-md-6"i><"col-sm-12 col-md-6"p>>',
            responsive: true
        });

        // Edit button click handler
        $('.datatables-tasks tbody').on('click', '.btn-edit-task', function () {
            const taskId = $(this).data('id');
            const task = currentTasks.find(t => t.id === taskId);
            if (task) openEditModal(task);
        });
    }

    // 5. Modal Logic
    function openEditModal(task) {
        document.getElementById('modal-task-id').value = task.id;
        document.getElementById('modal-product-branch-name').textContent = `${task.productName} - ${task.branchName}`;
        
        document.getElementById('modal-author-id').value = task.authorId || '';
        document.getElementById('modal-typesetter-id').value = task.typesetterId || '';
        
        const setDate = (id, val) => { document.getElementById(id).value = val ? val.substring(0, 10) : ''; };
        setDate('modal-author-start', task.authorStartDate);
        setDate('modal-typesetter-start', task.typesetterStartDate);
        setDate('modal-proof1', task.proofread1Date);
        setDate('modal-proof2', task.proofread2Date);
        setDate('modal-proof3', task.proofread3Date);

        document.getElementById('modal-page-count').value = task.pageCount || 0;
        document.getElementById('modal-test-count').value = task.testCount || 0;
        document.getElementById('modal-traditional-count').value = task.traditionalCount || 0;
        document.getElementById('modal-concept-count').value = task.conceptCount || 0;
        document.getElementById('modal-context-count').value = task.contextCount || 0;
        document.getElementById('modal-topic-page-count').value = task.topicPageCount || 0;
        document.getElementById('modal-description').value = task.description || '';

        editModal.show();
    }

    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const taskId = document.getElementById('modal-task-id').value;
        const payload = {
            authorId: document.getElementById('modal-author-id').value || null,
            typesetterId: document.getElementById('modal-typesetter-id').value || null,
            pageCount: parseInt(document.getElementById('modal-page-count').value) || 0,
            testCount: parseInt(document.getElementById('modal-test-count').value) || 0,
            traditionalCount: parseInt(document.getElementById('modal-traditional-count').value) || 0,
            conceptCount: parseInt(document.getElementById('modal-concept-count').value) || 0,
            contextCount: parseInt(document.getElementById('modal-context-count').value) || 0,
            topicPageCount: parseInt(document.getElementById('modal-topic-page-count').value) || 0,
            authorStartDate: document.getElementById('modal-author-start').value || null,
            typesetterStartDate: document.getElementById('modal-typesetter-start').value || null,
            proofread1Date: document.getElementById('modal-proof1').value || null,
            proofread2Date: document.getElementById('modal-proof2').value || null,
            proofread3Date: document.getElementById('modal-proof3').value || null,
            description: document.getElementById('modal-description').value || ''
        };

        try {
            Swal.fire({ title: 'Kaydediliyor...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            await ErpApi.put(`/PublicationTasks/${taskId}/cost`, payload);
            Swal.fire('Başarılı', 'Görev detayları güncellendi ve maliyet yeniden hesaplandı.', 'success');
            editModal.hide();
            loadTasks(); // Refresh grid to show new cost
        } catch (err) {
            console.error(err);
            Swal.fire('Hata!', err.message || 'Güncelleme başarısız.', 'error');
        }
    });

    // Event Listeners
    categorySelect.addEventListener('change', loadTasks);
    btnRefreshTasks.addEventListener('click', loadTasks);

    // Init
    loadCategories();
    loadUsers();
});
