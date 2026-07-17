document.addEventListener('DOMContentLoaded', () => {
    const filterForm = document.getElementById('filterForm');
    const filterSearch = document.getElementById('filterSearch');
    const filterDate = document.getElementById('filterDate');
    const filterDoctor = document.getElementById('filterDoctor');
    const filterStatus = document.getElementById('filterStatus');
    const btnReset = document.getElementById('btnReset');
    const archiveTableBody = document.getElementById('archiveTableBody');
    const paginationNav = document.getElementById('paginationNav');
    const paginationList = document.getElementById('paginationList');

    let currentPage = 1;
    const limit = 10;

    // Setup Flatpickr for filterDate (dd/mm/yyyy format)
    const fp = flatpickr("#filterDate", {
        dateFormat: "Y-m-d", // submitted value
        altInput: true,      // visible text input
        altFormat: "d/m/Y",  // display format: dd/mm/yyyy
    });

    const loadDoctors = async () => {
        try {
            const res = await window.apiFetch('/api/doctors?limit=100');
            if (res.success && res.data.doctors) {
                res.data.doctors.forEach(doc => {
                    const opt = document.createElement('option');
                    opt.value = doc.id;
                    opt.textContent = `${doc.name} (${doc.specialization})`;
                    filterDoctor.appendChild(opt);
                });
            }
        } catch (error) {
            console.error('Failed to load doctors', error);
        }
    };

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

    const loadArchive = async () => {
        const query = new URLSearchParams({ page: currentPage, limit });
        if (filterSearch.value) query.append('search', filterSearch.value);
        if (filterDate.value) query.append('date', filterDate.value);
        if (filterDoctor.value) query.append('doctor_id', filterDoctor.value);
        if (filterStatus.value) query.append('status', filterStatus.value);

        archiveTableBody.innerHTML = '<tr><td colspan="7" class="text-center py-4"><span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading archive...</td></tr>';
        paginationNav.style.display = 'none';

        try {
            const res = await window.apiFetch(`/api/archives/bookings?${query.toString()}`);
            if (res.success) {
                renderTable(res.data);
                renderPagination(res.pagination);
            } else {
                window.showAlert(res.message, 'danger');
                archiveTableBody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-danger">Failed to load archive.</td></tr>';
            }
        } catch (error) {
            window.showAlert('Network error.', 'danger');
            archiveTableBody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-danger">Network error.</td></tr>';
        }
    };

    const renderTable = (bookings) => {
        if (bookings.length === 0) {
            archiveTableBody.innerHTML = '<tr><td colspan="7" class="text-center py-5 text-muted"><i class="bi bi-folder-x fs-2 d-block mb-2"></i>Tidak ada data booking yang sesuai dengan filter.</td></tr>';
            return;
        }

        archiveTableBody.innerHTML = bookings.map(b => `
            <tr>
                <td class="px-4">${new Date(b.visit_date).toLocaleDateString('id-ID')}</td>
                <td><small class="text-muted fw-bold">${b.booking_code}</small></td>
                <td>${b.patient.name}</td>
                <td>${b.schedule.doctor.name}</td>
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
                    loadArchive();
                }
            });
        });
    };

    filterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        currentPage = 1;
        loadArchive();
    });

    btnReset.addEventListener('click', () => {
        filterSearch.value = '';
        fp.clear();
        filterDoctor.value = '';
        filterStatus.value = '';
        currentPage = 1;
        loadArchive();
    });

    const btnExportCsv = document.getElementById('btnExportCsv');
    const btnExportPdf = document.getElementById('btnExportPdf');

    const getExportQueryString = () => {
        const query = new URLSearchParams();
        if (filterSearch.value) query.append('search', filterSearch.value);
        if (filterDate.value) query.append('date', filterDate.value);
        if (filterDoctor.value) query.append('doctor_id', filterDoctor.value);
        if (filterStatus.value) query.append('status', filterStatus.value);
        return query.toString();
    };

    btnExportCsv.addEventListener('click', () => {
        window.location.href = `/api/archives/export/csv?${getExportQueryString()}`;
    });

    btnExportPdf.addEventListener('click', () => {
        window.location.href = `/api/archives/export/pdf?${getExportQueryString()}`;
    });

    // Init
    loadDoctors().then(loadArchive);
});
