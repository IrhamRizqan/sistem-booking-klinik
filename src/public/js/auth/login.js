document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const res = await window.apiFetch('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({ username, password })
            });

            if (res.success) {
                const urlParams = new URLSearchParams(window.location.search);
                const redirectUrl = urlParams.get('redirect');
                window.location.href = redirectUrl ? redirectUrl : '/patient/dashboard';
            } else {
                window.showAlert(res.message, 'danger');
            }
        } catch (err) {
            window.showAlert('A network error occurred. Please try again.', 'danger');
        }
    });
});
