document.addEventListener('DOMContentLoaded', async () => {
    // Load Header
    try {
        const headerRes = await fetch('/pages/partials/header.html');
        const headerHtml = await headerRes.text();
        document.getElementById('header-placeholder').innerHTML = headerHtml;
    } catch (e) {
        console.error('Failed to load header', e);
    }

    // Load Footer
    try {
        const footerRes = await fetch('/pages/partials/footer.html');
        const footerHtml = await footerRes.text();
        document.getElementById('footer-placeholder').innerHTML = footerHtml;
    } catch (e) {
        console.error('Failed to load footer', e);
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
