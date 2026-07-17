document.addEventListener('DOMContentLoaded', () => {
    const filterForm = document.getElementById('filterForm');
    const filterDate = document.getElementById('filterDate');
    const filterStatus = document.getElementById('filterStatus');
    const btnReset = document.getElementById('btnReset');
    const historyTableBody = document.getElementById('historyTableBody');
    const paginationNav = document.getElementById('paginationNav');
    const paginationList = document.getElementById('paginationList');

    let currentPage = 1;

    // Initialize Flatpickr for filterDate (dd/mm/yyyy format)
    const fp = flatpickr("#filterDate", {
        dateFormat: "Y-m-d", // submitted value
        altInput: true,      // visible text input
        altFormat: "d/m/Y",  // display format: dd/mm/yyyy
    });
    const limit = 10;

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Confirmed': return '<span class="badge bg-secondary">Menunggu</span>';
            case 'Calling': return '<span class="badge bg-warning text-dark">Dipanggil</span>';
            case 'On Treatment': return '<span class="badge bg-primary">Sedang Diperiksa</span>';
            case 'Completed': return '<span class="badge bg-success">Selesai</span>';
            case 'Skipped': return '<span class="badge bg-danger">Dilewati</span>';
            default: return `<span class="badge bg-light text-dark">${status}</span>`;
        }
    };

    const loadHistory = async () => {
        const query = new URLSearchParams({ page: currentPage, limit });
        if (filterDate.value) query.append('date', filterDate.value);
        if (filterStatus.value) query.append('status', filterStatus.value);

        historyTableBody.innerHTML = '<tr><td colspan="7" class="text-center py-4"><span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...</td></tr>';
        paginationNav.style.display = 'none';

        try {
            const res = await window.apiFetch(`/api/bookings/history?${query.toString()}`);
            if (res.success) {
                renderTable(res.data);
                renderPagination(res.pagination);
            } else {
                window.showAlert(res.message, 'danger');
                historyTableBody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-danger">Failed to load history.</td></tr>';
            }
        } catch (error) {
            window.showAlert('Network error.', 'danger');
            historyTableBody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-danger">Network error.</td></tr>';
        }
    };

    const renderTable = (bookings) => {
        if (bookings.length === 0) {
            historyTableBody.innerHTML = '<tr><td colspan="7" class="text-center py-5 text-muted"><i class="bi bi-calendar-x fs-2 d-block mb-2"></i>Belum ada riwayat booking.</td></tr>';
            return;
        }

        historyTableBody.innerHTML = bookings.map(b => `
            <tr>
                <td class="px-4">${new Date(b.visit_date).toLocaleDateString('id-ID')}</td>
                <td><small class="text-muted fw-bold">${b.booking_code}</small></td>
                <td>${b.schedule.doctor.name}</td>
                <td>${b.schedule.doctor.specialization}</td>
                <td>${b.time_slot}</td>
                <td class="fw-bold">${b.queue_number}</td>
                <td class="text-end px-4">${getStatusBadge(b.status)}</td>
            </tr>
        `).join('');
    };

    const renderPagination = (meta) => {
        if (meta.totalPages <= 1) {
            paginationNav.style.display = 'none';
            return;
        }

        paginationNav.style.display = 'block';
        let html = '';

        html += `<li class="page-item ${meta.page === 1 ? 'disabled' : ''}">
                    <a class="page-link" href="#" data-page="${meta.page - 1}">Previous</a>
                 </li>`;

        for (let i = 1; i <= meta.totalPages; i++) {
            html += `<li class="page-item ${meta.page === i ? 'active' : ''}">
                        <a class="page-link" href="#" data-page="${i}">${i}</a>
                     </li>`;
        }

        html += `<li class="page-item ${meta.page === meta.totalPages ? 'disabled' : ''}">
                    <a class="page-link" href="#" data-page="${meta.page + 1}">Next</a>
                 </li>`;

        paginationList.innerHTML = html;

        document.querySelectorAll('.page-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = parseInt(e.target.getAttribute('data-page'));
                if (target >= 1 && target <= meta.totalPages && target !== meta.page) {
                    currentPage = target;
                    loadHistory();
                }
            });
        });
    };

    filterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        currentPage = 1;
        loadHistory();
    });

    btnReset.addEventListener('click', () => {
        fp.clear();
        filterStatus.value = '';
        currentPage = 1;
        loadHistory();
    });

    loadHistory();
});
