let currentDeleteId = null;
document.addEventListener('DOMContentLoaded', () => {
    loadDoctors();
    
    document.getElementById('filterForm').addEventListener('submit', (e) => {
        e.preventDefault();
        loadDoctors();
    });

    document.getElementById('confirmDeleteBtn').addEventListener('click', deleteDoctor);
    document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
        document.getElementById('deleteModal').close();
    });
});

async function loadDoctors(page = 1) {
    const search = document.getElementById('searchInput').value;
    const spec = document.getElementById('specializationSelect').value;
    
    const res = await window.apiFetch(`/api/doctors?page=${page}&search=${encodeURIComponent(search)}&specialization=${encodeURIComponent(spec)}`);
    
    if (res.success) {
        renderTable(res.data.doctors);
        renderPagination(res.data.pagination, search, spec);
        renderSpecializations(res.data.filters.availableSpecializations, spec);
    } else {
        window.showAlert(res.message || 'Failed to load doctors', 'danger');
    }
}

function renderTable(doctors) {
    const tbody = document.getElementById('doctorsTableBody');
    tbody.innerHTML = '';
    
    if (doctors.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:var(--space-xl); color:var(--color-muted);">Tidak ada dokter yang ditemukan.</td></tr>`;
        return;
    }

    doctors.forEach(doctor => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight: var(--weight-medium);">${escapeHtml(doctor.name)}</td>
            <td><span class="badge badge--muted">${escapeHtml(doctor.specialization)}</span></td>
            <td style="text-align: right;">
                <a href="/admin/doctors/edit?id=${doctor.id}" class="btn btn--outline btn--sm" style="margin-right:var(--space-xs);">Edit</a>
                <button type="button" class="btn btn--danger btn--sm" onclick="confirmDelete(${doctor.id}, '${escapeHtml(doctor.name)}')">Hapus</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderSpecializations(specializations, selectedSpec) {
    const select = document.getElementById('specializationSelect');
    if (select.options.length <= 1 && specializations.length > 0) {
        select.innerHTML = '<option value="">All Specializations</option>';
        specializations.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s;
            opt.textContent = s;
            if (s === selectedSpec) opt.selected = true;
            select.appendChild(opt);
        });
    }
}

function renderPagination(pagination, search, spec) {
    const nav = document.getElementById('paginationNav');
    const ul = document.getElementById('paginationList');
    
    if (pagination.totalPages <= 1) {
        nav.style.display = 'none';
        return;
    }
    
    nav.style.display = 'block';
    ul.innerHTML = '';

    ul.innerHTML += `
        <li class="page-item ${pagination.currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="loadDoctors(${pagination.currentPage - 1}); return false;">Previous</a>
        </li>
    `;
    
    for(let i = 1; i <= pagination.totalPages; i++) {
        ul.innerHTML += `
            <li class="page-item ${pagination.currentPage === i ? 'active' : ''}">
                <a class="page-link" href="#" onclick="loadDoctors(${i}); return false;">${i}</a>
            </li>
        `;
    }

    ul.innerHTML += `
        <li class="page-item ${pagination.currentPage === pagination.totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="loadDoctors(${pagination.currentPage + 1}); return false;">Next</a>
        </li>
    `;
}

window.confirmDelete = function(id, name) {
    currentDeleteId = id;
    document.getElementById('deleteDoctorName').textContent = name;
    document.getElementById('deleteModal').showModal();
}

async function deleteDoctor() {
    if (!currentDeleteId) return;
    const res = await window.apiFetch(`/api/doctors/${currentDeleteId}`, { method: 'DELETE' });
    if (res.success) {
        document.getElementById('deleteModal').close();
        window.showAlert('Dokter berhasil dihapus', 'success');
        loadDoctors();
    } else {
        document.getElementById('deleteModal').close();
        window.showAlert(res.message || 'Gagal menghapus dokter', 'danger');
    }
}

function escapeHtml(unsafe) {
    return (unsafe||'').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
// Attach loadDoctors to window so pagination links can call it
window.loadDoctors = loadDoctors;
