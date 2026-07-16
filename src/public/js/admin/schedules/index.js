let currentDeleteId = null;
let deleteModalInstance = null;
let slotsModalInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    deleteModalInstance = new bootstrap.Modal(document.getElementById('deleteModal'));
    slotsModalInstance = new bootstrap.Modal(document.getElementById('slotsModal'));
    
    loadSchedules();
    
    document.getElementById('filterForm').addEventListener('submit', (e) => {
        e.preventDefault();
        loadSchedules();
    });

    document.getElementById('confirmDeleteBtn').addEventListener('click', deleteSchedule);
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
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-5 text-muted"><i class="bi bi-calendar-x fs-1 d-block mb-3"></i>No schedules found matching your criteria.</td></tr>`;
        return;
    }

    schedules.forEach(schedule => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="fw-semibold">
                ${escapeHtml(schedule.doctor.name)}
                <div class="small text-muted">${escapeHtml(schedule.doctor.specialization)}</div>
            </td>
            <td><span class="badge bg-primary text-white rounded-pill px-3 py-2">${escapeHtml(schedule.day)}</span></td>
            <td>
                <div class="fw-bold text-dark">${schedule.start_time} - ${schedule.end_time}</div>
                <button class="btn btn-sm btn-link text-decoration-none p-0 mt-1" onclick="viewSlots('${encodeURIComponent(JSON.stringify(schedule.slots))}')">
                    <i class="bi bi-list-ul"></i> View ${schedule.slots.length} Slots
                </button>
            </td>
            <td><span class="badge bg-secondary rounded-pill">${schedule.quota}</span></td>
            <td><span class="badge bg-success rounded-pill px-3 py-2">${schedule.status}</span></td>
            <td class="text-end">
                <a href="/admin/schedules/edit?id=${schedule.id}" class="btn btn-sm btn-outline-primary me-2"><i class="bi bi-pencil-fill"></i> Edit</a>
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="confirmDelete(${schedule.id}, '${escapeHtml(schedule.doctor.name)}')"><i class="bi bi-trash-fill"></i> Delete</button>
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
        container.innerHTML = slots.map(slot => `<div class="p-2 border-bottom text-center fw-semibold font-monospace">${slot}</div>`).join('');
        slotsModalInstance.show();
    } catch(e) {
        console.error("Failed to parse slots", e);
    }
}

window.confirmDelete = function(id, name) {
    currentDeleteId = id;
    document.getElementById('deleteDoctorName').textContent = name;
    deleteModalInstance.show();
}

async function deleteSchedule() {
    if (!currentDeleteId) return;
    const res = await window.apiFetch(`/api/schedules/${currentDeleteId}`, { method: 'DELETE' });
    if (res.success) {
        deleteModalInstance.hide();
        window.showAlert('Schedule deleted successfully', 'success');
        loadSchedules();
    } else {
        deleteModalInstance.hide();
        window.showAlert(res.message || 'Failed to delete schedule', 'danger');
    }
}

function escapeHtml(unsafe) {
    return (unsafe||'').toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

window.loadSchedules = loadSchedules;
