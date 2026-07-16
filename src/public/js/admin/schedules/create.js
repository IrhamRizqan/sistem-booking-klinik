document.addEventListener('DOMContentLoaded', async () => {
    // Load doctors into select dropdown
    try {
        const docRes = await window.apiFetch('/api/doctors?limit=100'); // Fetch enough for dropdown
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

    const createForm = document.getElementById('createForm');
    if (createForm) {
        createForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = {
                doctor_id: document.getElementById('doctor_id').value,
                day: document.getElementById('day').value,
                start_time: document.getElementById('start_time').value,
                end_time: document.getElementById('end_time').value,
                quota: document.getElementById('quota').value
            };

            try {
                const res = await window.apiFetch('/api/schedules', {
                    method: 'POST',
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
