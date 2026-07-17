document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const bookingForm = document.getElementById('bookingForm');
    if (!bookingForm) return;

    // Date
    const visitDateInput = document.getElementById('visitDate');
    const btnNext1 = document.getElementById('btnNext1');

    // Specialization
    const specSelect = document.getElementById('specialization');
    const btnNext2 = document.getElementById('btnNext2');

    // Doctor
    const doctorSelect = document.getElementById('doctor');
    const btnNext3 = document.getElementById('btnNext3');

    // Hidden inputs
    const scheduleIdInput = document.getElementById('selectedScheduleId');
    const timeSlotInput = document.getElementById('selectedTimeSlot');

    // Setup Date Constraints
    const today = new Date();
    const minDateStr = today.toISOString().split('T')[0];
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    const maxDateStr = maxDate.toISOString().split('T')[0];

    visitDateInput.setAttribute('min', minDateStr);
    visitDateInput.setAttribute('max', maxDateStr);

    window.goToStep = (step) => {
        document.querySelectorAll('.step-container').forEach(el => el.classList.remove('active'));
        document.getElementById(`step-${step}`).classList.add('active');
    };

    // Step 1 -> 2
    visitDateInput.addEventListener('change', () => {
        btnNext1.disabled = !visitDateInput.value;
        
        specSelect.innerHTML = '<option value="" selected disabled>Loading...</option>';
        btnNext2.disabled = true;
        doctorSelect.innerHTML = '<option value="" selected disabled>Choose Specialization first</option>';
        btnNext3.disabled = true;
        scheduleIdInput.value = '';
        timeSlotInput.value = '';
    });

    btnNext1.addEventListener('click', async () => {
        btnNext1.disabled = true;
        const originalText = btnNext1.textContent;
        btnNext1.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';
        
        try {
            const res = await window.apiFetch('/api/booking-options/specializations');
            if (res.success) {
                specSelect.innerHTML = '<option value="" selected disabled>Select Specialization</option>';
                if (res.data.length === 0) {
                    specSelect.innerHTML = '<option value="" disabled>No specializations available</option>';
                } else {
                    res.data.forEach(spec => {
                        const opt = document.createElement('option');
                        opt.value = spec;
                        opt.textContent = spec;
                        specSelect.appendChild(opt);
                    });
                }
                goToStep(2);
            } else {
                window.showAlert(res.message, 'danger');
            }
        } catch (error) {
            window.showAlert('Failed to fetch specializations. Please try again.', 'danger');
        } finally {
            btnNext1.disabled = false;
            btnNext1.textContent = originalText;
        }
    });

    // Step 2 -> 3
    specSelect.addEventListener('change', () => {
        btnNext2.disabled = !specSelect.value;
        
        doctorSelect.innerHTML = '<option value="" selected disabled>Choose Specialization first</option>';
        btnNext3.disabled = true;
        scheduleIdInput.value = '';
        timeSlotInput.value = '';
    });

    btnNext2.addEventListener('click', async () => {
        btnNext2.disabled = true;
        const originalText = btnNext2.textContent;
        btnNext2.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';
        
        try {
            const date = visitDateInput.value;
            const res = await window.apiFetch(`/api/booking-options/doctors?specialization=${encodeURIComponent(specSelect.value)}&date=${date}`);
            if (res.success) {
                doctorSelect.innerHTML = '<option value="" selected disabled>Select Doctor</option>';
                if (res.data.length === 0) {
                    doctorSelect.innerHTML = '<option value="" disabled>No doctors available on this date</option>';
                } else {
                    res.data.forEach(doc => {
                        if (doc.schedules && doc.schedules.length > 0) {
                            const sched = doc.schedules[0];
                            const opt = document.createElement('option');
                            opt.value = doc.id;
                            opt.dataset.scheduleId = sched.id;
                            opt.dataset.timeSlot = `${sched.start_time}-${sched.end_time}`;
                            opt.textContent = `${doc.name} (${sched.start_time} - ${sched.end_time})`;
                            doctorSelect.appendChild(opt);
                        }
                    });
                    
                    if(doctorSelect.options.length === 1) { // Only the placeholder
                        doctorSelect.innerHTML = '<option value="" disabled>No doctors available on this date</option>';
                    }
                }
                goToStep(3);
            } else {
                window.showAlert(res.message, 'danger');
            }
        } catch (error) {
            window.showAlert('Failed to fetch doctors.', 'danger');
        } finally {
            btnNext2.disabled = false;
            btnNext2.textContent = originalText;
        }
    });

    // Step 3 -> 4
    doctorSelect.addEventListener('change', () => {
        btnNext3.disabled = !doctorSelect.value;
    });

    btnNext3.addEventListener('click', () => {
        const selectedOption = doctorSelect.options[doctorSelect.selectedIndex];
        
        document.getElementById('summaryDate').textContent = visitDateInput.value;
        document.getElementById('summarySpec').textContent = specSelect.options[specSelect.selectedIndex].text;
        document.getElementById('summaryDoctor').textContent = selectedOption.text;
        
        scheduleIdInput.value = selectedOption.dataset.scheduleId;
        timeSlotInput.value = selectedOption.dataset.timeSlot;

        goToStep(4);
    });

    // Step 4 (Submit Booking)
    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const btnConfirm = document.getElementById('btnConfirm');
        const originalText = btnConfirm.textContent;
        btnConfirm.disabled = true;
        btnConfirm.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';

        const payload = {
            schedule_id: scheduleIdInput.value,
            visit_date: visitDateInput.value,
            time_slot: timeSlotInput.value,
            complaint: "",
            doctor_id: doctorSelect.value, 
            specialization: specSelect.value 
        };

        try {
            const res = await window.apiFetch('/api/bookings', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            if (res.success) {
                bookingForm.style.display = 'none';
                const successDiv = document.getElementById('booking-success');
                successDiv.style.display = 'block';

                document.getElementById('success-code').textContent = res.data.booking_code;
                document.getElementById('success-queue').textContent = res.data.queue_number;
                document.getElementById('success-date').textContent = res.data.visit_date.split('T')[0];
                document.getElementById('success-time').textContent = res.data.time_slot;
                document.getElementById('success-doctor').textContent = doctorSelect.options[doctorSelect.selectedIndex].text;
            } else {
                if (res.message === 'Unauthorized') {
                    window.location.href = '/auth/login';
                } else {
                    window.showAlert(res.message || 'Validation error occurred.', 'danger');
                }
            }
        } catch (error) {
            window.showAlert('A network error occurred while booking. Please try again.', 'danger');
        } finally {
            btnConfirm.disabled = false;
            btnConfirm.textContent = originalText;
        }
    });

});
