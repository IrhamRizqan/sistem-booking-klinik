document.addEventListener('DOMContentLoaded', () => {
    const adminLoginForm = document.getElementById('adminLoginForm');
    if (!adminLoginForm) return;

    adminLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            // Placeholder endpoint for admin login
            const res = await window.apiFetch('/api/auth/admin-login', {
                method: 'POST',
                body: JSON.stringify({ username, password })
            });

            if (res.success) {
                window.location.href = '/admin/doctors';
            } else {
                window.showAlert(res.message, 'danger');
            }
        } catch (err) {
            window.showAlert('A network error occurred. Please try again.', 'danger');
        }
    });
});
