document.addEventListener('DOMContentLoaded', async () => {
    // Load Header & Footer concurrently
    try {
        const [headerText, footerText] = await Promise.all([
            fetch('/pages/partials/header.html').then(res => res.text()),
            fetch('/pages/partials/footer.html').then(res => res.text())
        ]);
        
        document.getElementById('header-placeholder').innerHTML = headerText;
        document.getElementById('footer-placeholder').innerHTML = footerText;

        // Check authentication state
        const authRes = await fetch('/api/auth/me');
        const authData = await authRes.json();
        
        const guestElements = document.querySelectorAll('.role-guest');
        const patientElements = document.querySelectorAll('.role-patient');
        const adminElements = document.querySelectorAll('.role-admin');
        const authElements = document.querySelectorAll('.role-auth');

        if (authData.role === 'admin') {
            guestElements.forEach(el => el.style.display = 'none');
            adminElements.forEach(el => el.style.display = 'block');
            authElements.forEach(el => el.style.display = 'block');
        } else if (authData.role === 'patient') {
            guestElements.forEach(el => el.style.display = 'none');
            patientElements.forEach(el => el.style.display = 'block');
            authElements.forEach(el => el.style.display = 'block');
        } else {
            guestElements.forEach(el => el.style.display = 'block');
        }

        // Highlight active link
        const currentPath = window.location.pathname;
        const links = document.querySelectorAll('.nav__link');
        links.forEach(link => {
            if (link.getAttribute('href') === currentPath) {
                link.classList.add('nav__link--active');
            } else {
                link.classList.remove('nav__link--active');
            }
        });


    } catch (e) {
        console.error('Failed to load layouts', e);
    }
});

// Helper for API calls
window.apiFetch = async (url, options = {}) => {
    options.headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    const response = await fetch(url, options);
    
    if (response.status === 401) {
        window.location.href = '/auth/login';
        return { success: false, message: 'Unauthorized' };
    }

    return response.json();
};

window.showAlert = (message, type = 'danger') => {
    const alertContainer = document.getElementById('alert-container');
    if (!alertContainer) return;
    
    alertContainer.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
};
