const urlParams = new URLSearchParams(window.location.search);
const scheduleId = urlParams.get('id');

document.addEventListener('DOMContentLoaded', async () => {
    if (!scheduleId) {
        window.showAlert('No schedule ID provided', 'danger');
        return;
    }

    // Load doctors first
    try {
        const docRes = await window.apiFetch('/api/doctors?limit=100');
        if (docRes.success) {
            const select = document.getElementById('doctor_id');
            select.innerHTML = '<option value="">Select Doctor</option>';
            docRes.data.doctors.forEach(doc => {
                const opt = document.createElement('option');
                opt.value = doc.id;
                opt.textContent = `${doc.name} (${doc.specialization})`;
                select.appendChild(opt);
            });
        }
    } catch (e) {
        window.showAlert('Failed to load doctors list', 'danger');
    }

    // Load schedule data
    try {
        const res = await window.apiFetch(`/api/schedules/${scheduleId}`);
        if (res.success) {
            document.getElementById('doctor_id').value = res.data.doctor_id;
            document.getElementById('day').value = res.data.day;
            document.getElementById('start_time').value = res.data.start_time;
            document.getElementById('end_time').value = res.data.end_time;
            document.getElementById('quota').value = res.data.quota;
        } else {
            window.showAlert(res.message || 'Failed to fetch schedule details', 'danger');
        }
    } catch(e) {
        window.showAlert('Network error fetching schedule data', 'danger');
    }

    const editForm = document.getElementById('editForm');
    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = {
                doctor_id: document.getElementById('doctor_id').value,
                day: document.getElementById('day').value,
                start_time: document.getElementById('start_time').value,
                end_time: document.getElementById('end_time').value,
                quota: document.getElementById('quota').value
            };

            try {
                const res = await window.apiFetch(`/api/schedules/${scheduleId}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                });

                if (res.success) {
                    window.location.href = '/admin/schedules/index'; 
                } else {
                    window.showAlert(res.message, 'danger');
                }
            } catch (err) {
                window.showAlert('A network error occurred. Please try again.', 'danger');
            }
        });
    }
});
