document.addEventListener('DOMContentLoaded', () => {
    const createForm = document.getElementById('createForm');
    if (!createForm) return;

    createForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const specialization = document.getElementById('specialization').value;

        try {
            const res = await window.apiFetch('/api/doctors', {
                method: 'POST',
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
});
