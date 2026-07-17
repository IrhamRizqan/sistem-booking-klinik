document.addEventListener('DOMContentLoaded', async () => {
    const loadingState = document.getElementById('loadingState');
    const dashboardContent = document.getElementById('dashboardContent');

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

    try {
        const res = await window.apiFetch('/api/dashboard/admin');
        if (res.success) {
            const data = res.data;
            
            // Populate stats
            document.getElementById('statDoctors').textContent = data.stats.totalDoctors;
            document.getElementById('statBookings').textContent = data.stats.todayBookings;
            document.getElementById('statWaiting').textContent = data.stats.waiting;
            document.getElementById('statCalling').textContent = data.stats.calling;
            document.getElementById('statTreatment').textContent = data.stats.onTreatment;
            document.getElementById('statCompleted').textContent = data.stats.completed;
            document.getElementById('statSkipped').textContent = data.stats.skipped;

            // Populate table
            const tbody = document.getElementById('todayQueueBody');
            if (data.todayQueue.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted">No bookings found for today.</td></tr>';
            } else {
                tbody.innerHTML = data.todayQueue.map(q => `
                    <tr>
                        <td class="px-4 fw-bold">${q.queue_number}</td>
                        <td>${q.patient.name}</td>
                        <td>${q.schedule.doctor.name}</td>
                        <td>${q.time_slot}</td>
                        <td class="text-end px-4">${getStatusBadge(q.status)}</td>
                    </tr>
                `).join('');
            }

            loadingState.style.display = 'none';
            dashboardContent.style.display = 'block';
        } else {
            loadingState.style.display = 'none';
            window.showAlert(res.message, 'danger');
        }
    } catch (error) {
        loadingState.style.display = 'none';
        window.showAlert('Failed to load dashboard data', 'danger');
    }
});
