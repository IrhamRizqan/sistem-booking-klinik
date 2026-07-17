document.addEventListener('DOMContentLoaded', () => {
    const filterForm = document.getElementById('filterForm');
    const filterDate = document.getElementById('filterDate');
    const filterDoctor = document.getElementById('filterDoctor');
    const filterSlot = document.getElementById('filterSlot');
    const queueTableBody = document.getElementById('queueTableBody');

    // Default to today
    filterDate.value = new Date().toISOString().split('T')[0];

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

    const loadQueues = async () => {
        const query = new URLSearchParams();
        if (filterDate.value) query.append('date', filterDate.value);
        if (filterDoctor.value) query.append('doctor_id', filterDoctor.value);
        if (filterSlot.value) query.append('time_slot', filterSlot.value);

        queueTableBody.innerHTML = '<tr><td colspan="7" class="text-center py-4"><span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading queues...</td></tr>';

        try {
            const res = await window.apiFetch(`/api/queues?${query.toString()}`);
            if (res.success) {
                renderQueues(res.data);
            } else {
                window.showAlert(res.message, 'danger');
                queueTableBody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-danger">Failed to load queues.</td></tr>';
            }
        } catch (error) {
            window.showAlert('Failed to fetch queues.', 'danger');
            queueTableBody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-danger">Network error.</td></tr>';
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

    const getActionButtons = (queue) => {
        const id = queue.id;
        switch (queue.status) {
            case 'Confirmed':
                return `<button class="btn btn-sm btn-primary action-btn" data-id="${id}" data-status="Calling">Panggil</button>`;
            case 'Calling':
                return `
                    <button class="btn btn-sm btn-success action-btn mb-1" data-id="${id}" data-status="On Treatment">Mulai Pemeriksaan</button>
                    <button class="btn btn-sm btn-outline-danger action-btn" data-id="${id}" data-status="Skipped">Lewati</button>
                `;
            case 'On Treatment':
                return `<button class="btn btn-sm btn-success action-btn" data-id="${id}" data-status="Completed">Selesai</button>`;
            case 'Completed':
            case 'Skipped':
                return '<span class="text-muted small">No action</span>';
            default:
                return '';
        }
    };

    const renderQueues = (queues) => {
        if (queues.length === 0) {
            queueTableBody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">No queues found for the selected filters.</td></tr>';
            return;
        }

        queueTableBody.innerHTML = queues.map(q => `
            <tr>
                <td class="px-4 fw-bold">${q.queue_number}</td>
                <td><small class="text-muted">${q.booking_code}</small></td>
                <td>${q.patient.name}</td>
                <td>${q.schedule.doctor.name}</td>
                <td>${q.time_slot}</td>
                <td>${getStatusBadge(q.status)}</td>
                <td class="text-end px-4">
                    <div class="d-flex flex-column align-items-end">
                        ${getActionButtons(q)}
                    </div>
                </td>
            </tr>
        `).join('');

        // Attach listeners to buttons
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.getAttribute('data-id');
                const status = e.target.getAttribute('data-status');
                await updateStatus(id, status, e.target);
            });
        });
    };

    const updateStatus = async (id, status, btn) => {
        const originalHtml = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';

        try {
            const res = await window.apiFetch(`/api/queues/${id}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status })
            });

            if (res.success) {
                // Reload list to get updated state
                loadQueues();
            } else {
                window.showAlert(res.message, 'danger');
                btn.disabled = false;
                btn.innerHTML = originalHtml;
            }
        } catch (error) {
            window.showAlert('Network error updating status.', 'danger');
            btn.disabled = false;
            btn.innerHTML = originalHtml;
        }
    };

    filterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        loadQueues();
    });

    // Init
    loadDoctors().then(loadQueues);
});
