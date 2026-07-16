const urlParams = new URLSearchParams(window.location.search);
const doctorId = urlParams.get('id');

document.addEventListener('DOMContentLoaded', async () => {
    if (!doctorId) {
        window.showAlert('No doctor ID provided', 'danger');
        return;
    }

    try {
        const res = await window.apiFetch(`/api/doctors/${doctorId}`);
        if (res.success) {
            document.getElementById('name').value = res.data.name;
            document.getElementById('specialization').value = res.data.specialization;
        } else {
            window.showAlert(res.message || 'Failed to fetch doctor details', 'danger');
        }
    } catch(e) {
        window.showAlert('Network error fetching doctor data', 'danger');
    }

    const editForm = document.getElementById('editForm');
    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const specialization = document.getElementById('specialization').value;

            try {
                const res = await window.apiFetch(`/api/doctors/${doctorId}`, {
                    method: 'PUT',
                    body: JSON.stringify({ name, specialization })
                });

                if (res.success) {
                    window.location.href = '/admin/doctors/index'; // Redirect back to list
                } else {
                    window.showAlert(res.message, 'danger');
                }
            } catch (err) {
                window.showAlert('A network error occurred. Please try again.', 'danger');
            }
        });
    }
});
