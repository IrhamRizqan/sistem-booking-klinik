document.addEventListener('DOMContentLoaded', () => {
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const skippedState = document.getElementById('skippedState');
    const activeState = document.getElementById('activeState');
    const btnRefresh = document.getElementById('btnRefresh');

    let pollingInterval = null;

    const getStatusIndonesian = (status) => {
        switch (status) {
            case 'Confirmed': return 'Menunggu';
            case 'Calling': return 'Dipanggil';
            case 'On Treatment': return 'Sedang Diperiksa';
            case 'Completed': return 'Selesai';
            case 'Skipped': return 'Dilewati';
            default: return status;
        }
    };

    const fetchDashboard = async (isManual = false) => {
        if (isManual) {
            btnRefresh.disabled = true;
            btnRefresh.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
        }

        try {
            const res = await window.apiFetch('/api/dashboard/patient/active');
            
            // First time loading removal
            if (!isManual) loadingState.style.display = 'none';

            if (res.success) {
                const data = res.data;

                if (!data) {
                    // No active booking found
                    activeState.style.display = 'none';
                    skippedState.style.display = 'none';
                    emptyState.style.display = 'block';
                    stopPolling();
                    return;
                }

                if (data.booking.status === 'Skipped') {
                    // Skipped
                    activeState.style.display = 'none';
                    emptyState.style.display = 'none';
                    skippedState.style.display = 'block';
                    stopPolling();
                    return;
                }

                // Active Booking
                emptyState.style.display = 'none';
                skippedState.style.display = 'none';
                activeState.style.display = 'block';

                // Populate Details
                document.getElementById('detailBookingCode').textContent = data.booking.booking_code;
                document.getElementById('detailVisitDate').textContent = new Date(data.booking.visit_date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                document.getElementById('detailTimeSlot').textContent = data.booking.time_slot;
                document.getElementById('detailDoctor').textContent = data.booking.doctor_name;
                document.getElementById('detailSpec').textContent = data.booking.specialization;

                // Populate Queue Monitor
                document.getElementById('myQueueNumber').textContent = data.booking.queue_number;
                
                // If there's an active queue being processed
                if (data.current_queue) {
                    document.getElementById('currentQueueNumber').textContent = data.current_queue;
                } else {
                    document.getElementById('currentQueueNumber').textContent = '-';
                }

                // Status formatting
                const badgeEl = document.getElementById('myQueueStatusBadge');
                badgeEl.textContent = getStatusIndonesian(data.booking.status);
                
                if (data.booking.status === 'Calling') {
                    badgeEl.className = 'badge badge--warning';
                } else if (data.booking.status === 'On Treatment') {
                    badgeEl.className = 'badge badge--success';
                } else {
                    badgeEl.className = 'badge badge--muted';
                }

                startPolling();

            } else {
                window.showAlert(res.message, 'danger');
            }
        } catch (error) {
            if (!isManual) loadingState.style.display = 'none';
            window.showAlert('Gagal mengambil data dashboard.', 'danger');
        } finally {
            if (isManual) {
                btnRefresh.disabled = false;
                btnRefresh.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Segarkan';
            }
        }
    };

    const startPolling = () => {
        if (!pollingInterval) {
            // Poll every 30 seconds
            pollingInterval = setInterval(() => {
                fetchDashboard(false);
            }, 30000);
        }
    };

    const stopPolling = () => {
        if (pollingInterval) {
            clearInterval(pollingInterval);
            pollingInterval = null;
        }
    };

    btnRefresh.addEventListener('click', () => fetchDashboard(true));

    // Initial load
    fetchDashboard(false);
});
