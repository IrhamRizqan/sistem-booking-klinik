let currentDeleteId = null;
document.addEventListener('DOMContentLoaded', () => {
    
    loadSchedules();
    
    document.getElementById('filterForm').addEventListener('submit', (e) => {
        e.preventDefault();
        loadSchedules();
    });

    document.getElementById('confirmDeleteBtn').addEventListener('click', deleteSchedule);
    document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
        document.getElementById('deleteModal').close();
    });
    document.getElementById('closeSlotsBtn').addEventListener('click', () => {
        document.getElementById('slotsModal').close();
    });
});

async function loadSchedules(page = 1) {
    const search = document.getElementById('searchInput').value;
    
    const res = await window.apiFetch(`/api/schedules?page=${page}&search=${encodeURIComponent(search)}`);
    
    if (res.success) {
        renderTable(res.data.schedules);
        renderPagination(res.data.pagination, search);
    } else {
        window.showAlert(res.message || 'Failed to load schedules', 'danger');
    }
}

function renderTable(schedules) {
    const tbody = document.getElementById('schedulesTableBody');
    tbody.innerHTML = '';
    
    if (schedules.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:var(--space-xl); color:var(--color-muted);">Tidak ada jadwal yang ditemukan.</td></tr>`;
        return;
    }

    schedules.forEach(schedule => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight: var(--weight-medium);">
                ${escapeHtml(schedule.doctor.name)}
                <div style="font-size: var(--text-xs); color: var(--color-muted);">${escapeHtml(schedule.doctor.specialization)}</div>
            </td>
            <td><span class="badge badge--success">${escapeHtml(schedule.day)}</span></td>
            <td>
                <div style="font-weight: var(--weight-semi);">${schedule.start_time} - ${schedule.end_time}</div>
                <button class="btn btn--ghost btn--sm" style="margin-top:var(--space-xs); padding:0;" onclick="viewSlots('${encodeURIComponent(JSON.stringify(schedule.slots))}')">
                    Lihat ${schedule.slots.length} Slot
                </button>
            </td>
            <td><span class="badge badge--muted">${schedule.quota}</span></td>
            <td><span class="badge badge--primary">${schedule.status}</span></td>
            <td style="text-align: right;">
                <a href="/admin/schedules/edit?id=${schedule.id}" class="btn btn--outline btn--sm" style="margin-right:var(--space-xs);">Edit</a>
                <button type="button" class="btn btn--danger btn--sm" onclick="confirmDelete(${schedule.id}, '${escapeHtml(schedule.doctor.name)}')">Hapus</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderPagination(pagination, search) {
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
            <a class="page-link" href="#" onclick="loadSchedules(${pagination.currentPage - 1}); return false;">Previous</a>
        </li>
    `;
    
    for(let i = 1; i <= pagination.totalPages; i++) {
        ul.innerHTML += `
            <li class="page-item ${pagination.currentPage === i ? 'active' : ''}">
                <a class="page-link" href="#" onclick="loadSchedules(${i}); return false;">${i}</a>
            </li>
        `;
    }

    ul.innerHTML += `
        <li class="page-item ${pagination.currentPage === pagination.totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="loadSchedules(${pagination.currentPage + 1}); return false;">Next</a>
        </li>
    `;
}

window.viewSlots = function(encodedSlots) {
    try {
        const slots = JSON.parse(decodeURIComponent(encodedSlots));
        const container = document.getElementById('slotsListContainer');
        container.innerHTML = slots.map(slot => `<div style="padding:var(--space-sm); border-bottom:var(--rule-hair) solid var(--color-rule); text-align:center; font-family:var(--font-mono);">${slot}</div>`).join('');
        document.getElementById('slotsModal').showModal();
    } catch(e) {
        console.error("Failed to parse slots", e);
    }
}

window.confirmDelete = function(id, name) {
    currentDeleteId = id;
    document.getElementById('deleteDoctorName').textContent = name;
    document.getElementById('deleteModal').showModal();
}

async function deleteSchedule() {
    if (!currentDeleteId) return;
    const res = await window.apiFetch(`/api/schedules/${currentDeleteId}`, { method: 'DELETE' });
    if (res.success) {
        document.getElementById('deleteModal').close();
        window.showAlert('Jadwal berhasil dihapus', 'success');
        loadSchedules();
    } else {
        document.getElementById('deleteModal').close();
        window.showAlert(res.message || 'Gagal menghapus jadwal', 'danger');
    }
}

function escapeHtml(unsafe) {
    return (unsafe||'').toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

window.loadSchedules = loadSchedules;
