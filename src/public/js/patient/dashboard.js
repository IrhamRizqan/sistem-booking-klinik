document.addEventListener('DOMContentLoaded', () => {
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const skippedState = document.getElementById('skippedState');
    const activeState = document.getElementById('activeState');
    const btnRefresh = document.getElementById('btnRefresh');
    const btnCancelBooking = document.getElementById('btnCancelBooking');
    const cancelModal = document.getElementById('cancelModal');
    const cancelModalCloseBtn = document.getElementById('cancelModalCloseBtn');
    const cancelModalConfirmBtn = document.getElementById('cancelModalConfirmBtn');

    // Redesign elements
    const welcomeName = document.getElementById('welcomeName');
    const todayDoctorsContainer = document.getElementById('todayDoctorsContainer');
    const metricTotal = document.getElementById('metricTotal');
    const metricCompleted = document.getElementById('metricCompleted');
    const metricSkipped = document.getElementById('metricSkipped');
    const metricActive = document.getElementById('metricActive');

    let pollingInterval = null;
    let currentBookingCode = null;

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

    const renderCalendar = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const todayDate = now.getDate();

        const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        document.getElementById('calendarMonthYear').textContent = `${monthNames[month]} ${year}`;

        const grid = document.getElementById('calendarGrid');
        grid.innerHTML = '';

        const dayLabels = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
        dayLabels.forEach(lbl => {
            const el = document.createElement('div');
            el.className = 'calendar-day-label';
            el.textContent = lbl;
            grid.appendChild(el);
        });

        const firstDay = new Date(year, month, 1).getDay();
        const numDays = new Date(year, month + 1, 0).getDate();

        for (let i = 0; i < firstDay; i++) {
            const empty = document.createElement('div');
            empty.className = 'calendar-day calendar-day--empty';
            grid.appendChild(empty);
        }

        for (let day = 1; day <= numDays; day++) {
            const el = document.createElement('div');
            el.className = 'calendar-day';
            if (day === todayDate) {
                el.classList.add('calendar-day--today');
            }
            el.textContent = day;
            grid.appendChild(el);
        }
    };

    const fetchDashboard = async (isManual = false) => {
        if (isManual) {
            btnRefresh.disabled = true;
            btnRefresh.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
        }

        try {
            const res = await window.apiFetch('/api/dashboard/patient/active');
            
            if (!isManual) loadingState.style.display = 'none';

            if (res.success) {
                const data = res.data;

                // Populate Name
                welcomeName.textContent = data.patientName;

                // Populate Metrics
                metricTotal.textContent = data.stats.total;
                metricCompleted.textContent = data.stats.completed;
                metricSkipped.textContent = data.stats.skipped;
                metricActive.textContent = data.booking ? 1 : 0;

                // Populate Today's Doctors
                todayDoctorsContainer.innerHTML = '';
                if (data.todayDoctors.length === 0) {
                    todayDoctorsContainer.innerHTML = '<p class="text-muted text-center" style="grid-column: 1/-1; padding: var(--space-md);">Tidak ada dokter yang praktik hari ini.</p>';
                } else {
                    data.todayDoctors.forEach(doc => {
                        const card = document.createElement('div');
                        card.className = 'doctor-card';
                        card.innerHTML = `
                            <div>
                                <span class="doctor-card__spec">${doc.specialization}</span>
                                <h4 class="doctor-card__name">${doc.name}</h4>
                                <div class="doctor-card__time">
                                    <i class="bi bi-clock"></i> ${doc.time_slot || 'Jam Praktik N/A'}
                                </div>
                            </div>
                            <a href="/booking/new" class="btn btn--outline btn--sm" style="margin-top: var(--space-sm); text-align: center; width: 100%;">
                                Buat Booking
                            </a>
                        `;
                        todayDoctorsContainer.appendChild(card);
                    });
                }

                // Handle active booking states
                if (!data.booking) {
                    activeState.style.display = 'none';
                    skippedState.style.display = 'none';
                    emptyState.style.display = 'block';
                    currentBookingCode = null;
                    stopPolling();
                    return;
                }

                if (data.booking.status === 'Skipped') {
                    activeState.style.display = 'none';
                    emptyState.style.display = 'none';
                    skippedState.style.display = 'block';
                    currentBookingCode = null;
                    stopPolling();
                    return;
                }

                // Active Booking
                emptyState.style.display = 'none';
                skippedState.style.display = 'none';
                activeState.style.display = 'block';
                currentBookingCode = data.booking.booking_code;

                // Populate Details
                document.getElementById('detailBookingCode').textContent = data.booking.booking_code;
                document.getElementById('detailVisitDate').textContent = new Date(data.booking.visit_date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                document.getElementById('detailTimeSlot').textContent = data.booking.time_slot;
                document.getElementById('detailDoctor').textContent = data.booking.doctor_name;
                document.getElementById('detailSpec').textContent = data.booking.specialization;

                // Populate Queue Monitor
                document.getElementById('myQueueNumber').textContent = data.booking.queue_number;
                
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

                if (['Confirmed', 'Calling'].includes(data.booking.status)) {
                    btnCancelBooking.style.display = 'inline-flex';
                } else {
                    btnCancelBooking.style.display = 'none';
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

    btnCancelBooking.addEventListener('click', () => {
        if (cancelModal) {
            cancelModal.showModal();
        }
    });

    cancelModalCloseBtn.addEventListener('click', () => {
        if (cancelModal) {
            cancelModal.close();
        }
    });

    cancelModalConfirmBtn.addEventListener('click', async () => {
        if (!currentBookingCode) return;
        
        if (cancelModal) {
            cancelModal.close();
        }

        try {
            const res = await window.apiFetch('/api/bookings/cancel', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ booking_code: currentBookingCode })
            });

            if (res.success) {
                window.showAlert('Booking berhasil dibatalkan.', 'success');
                fetchDashboard(false);
            } else {
                window.showAlert(res.message || 'Gagal membatalkan booking.', 'danger');
            }
        } catch (err) {
            window.showAlert('Gagal menghubungi server.', 'danger');
        }
    });

    // Render static components & Initial load
    renderCalendar();
    fetchDashboard(false);
});
