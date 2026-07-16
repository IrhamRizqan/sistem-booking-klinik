document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    if (!registerForm) return;

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const phone = document.getElementById('phone').value;
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        try {
            const res = await window.apiFetch('/api/auth/register', {
                method: 'POST',
                body: JSON.stringify({ name, phone, username, password, confirmPassword })
            });

            if (res.success) {
                window.location.href = '/auth/login';
            } else {
                window.showAlert(res.message, 'danger');
            }
        } catch (err) {
            window.showAlert('A network error occurred. Please try again.', 'danger');
        }
    });
});
