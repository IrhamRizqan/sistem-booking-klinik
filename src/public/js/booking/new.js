document.addEventListener('DOMContentLoaded', () => {
    // Check authentication simply by relying on API responses later or session locally if available, 
    // but the backend handles unauthorized access explicitly.

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

    // Slots
    const slotsContainer = document.getElementById('slots-container');
    const scheduleIdInput = document.getElementById('selectedScheduleId');
    const timeSlotInput = document.getElementById('selectedTimeSlot');
    const btnNext4 = document.getElementById('btnNext4');

    // Complaint
    const complaintInput = document.getElementById('complaint');
    const btnNext5 = document.getElementById('btnNext5');

    // Setup Date Constraints
    const today = new Date();
    const minDateStr = today.toISOString().split('T')[0];
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    const maxDateStr = maxDate.toISOString().split('T')[0];

    visitDateInput.setAttribute('min', minDateStr);
    visitDateInput.setAttribute('max', maxDateStr);

    // Navigation functions (exposed to global for inline onclick, but safer to bind here)
    window.goToStep = (step) => {
        document.querySelectorAll('.step-container').forEach(el => el.classList.remove('active'));
        document.getElementById(`step-${step}`).classList.add('active');
    };

    // Step 1 -> 2 (Date selected)
    visitDateInput.addEventListener('change', () => {
        btnNext1.disabled = !visitDateInput.value;
        
        // Reset dependents
        specSelect.innerHTML = '<option value="" selected disabled>Loading...</option>';
        btnNext2.disabled = true;
        doctorSelect.innerHTML = '<option value="" selected disabled>Choose Specialization first</option>';
        btnNext3.disabled = true;
        slotsContainer.innerHTML = '<p class="text-muted">Loading available slots...</p>';
        scheduleIdInput.value = '';
        timeSlotInput.value = '';
        btnNext4.disabled = true;
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

    // Step 2 -> 3 (Specialization selected)
    specSelect.addEventListener('change', () => {
        btnNext2.disabled = !specSelect.value;
        
        // Reset dependents
        doctorSelect.innerHTML = '<option value="" selected disabled>Choose Specialization first</option>';
        btnNext3.disabled = true;
        slotsContainer.innerHTML = '<p class="text-muted">Loading available slots...</p>';
        scheduleIdInput.value = '';
        timeSlotInput.value = '';
        btnNext4.disabled = true;
    });

    btnNext2.addEventListener('click', async () => {
        btnNext2.disabled = true;
        const originalText = btnNext2.textContent;
        btnNext2.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';
        
        try {
            const res = await window.apiFetch(`/api/booking-options/doctors?specialization=${encodeURIComponent(specSelect.value)}`);
            if (res.success) {
                doctorSelect.innerHTML = '<option value="" selected disabled>Select Doctor</option>';
                if (res.data.length === 0) {
                    doctorSelect.innerHTML = '<option value="" disabled>No doctors found</option>';
                } else {
                    res.data.forEach(doc => {
                        const opt = document.createElement('option');
                        opt.value = doc.id;
                        opt.textContent = `${doc.name} (${doc.specialization})`;
                        doctorSelect.appendChild(opt);
                    });
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

    // Step 3 -> 4 (Doctor selected)
    doctorSelect.addEventListener('change', () => {
        btnNext3.disabled = !doctorSelect.value;
        
        // Reset dependents
        slotsContainer.innerHTML = '<p class="text-muted">Loading available slots...</p>';
        scheduleIdInput.value = '';
        timeSlotInput.value = '';
        btnNext4.disabled = true;
    });

    btnNext3.addEventListener('click', async () => {
        btnNext3.disabled = true;
        const originalText = btnNext3.textContent;
        btnNext3.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';
        
        try {
            const date = visitDateInput.value;
            const docId = doctorSelect.value;
            const res = await window.apiFetch(`/api/booking-options/schedules?doctor_id=${docId}&date=${date}`);
            
            if (res.success) {
                slotsContainer.innerHTML = '';
                scheduleIdInput.value = '';
                timeSlotInput.value = '';
                btnNext4.disabled = true;

                if (res.data.length === 0) {
                    slotsContainer.innerHTML = '<div class="alert alert-warning w-100 text-center"><i class="bi bi-exclamation-triangle"></i> Doctor has no schedule for the selected date.</div>';
                } else {
                    let hasSlots = false;
                    let allFull = true;
                    res.data.forEach(schedule => {
                        schedule.slots.forEach(slot => {
                            hasSlots = true;
                            if (!slot.is_full) allFull = false;
                            
                            const btn = document.createElement('button');
                            btn.type = 'button';
                            btn.className = `btn slot-btn ${slot.is_full ? 'btn-outline-secondary disabled' : 'btn-outline-primary'}`;
                            
                            if (slot.is_full) {
                                btn.innerHTML = `<strong>${slot.time}</strong><br><small>Full</small>`;
                                btn.disabled = true;
                            } else {
                                btn.innerHTML = `<strong>${slot.time}</strong><br><small>Available</small>`;
                                btn.onclick = () => {
                                    document.querySelectorAll('.slot-btn').forEach(b => {
                                        if(!b.disabled) {
                                            b.classList.remove('btn-primary', 'text-white');
                                            b.classList.add('btn-outline-primary');
                                        }
                                    });
                                    btn.classList.remove('btn-outline-primary');
                                    btn.classList.add('btn-primary', 'text-white');
                                    
                                    scheduleIdInput.value = schedule.id;
                                    timeSlotInput.value = slot.time;
                                    btnNext4.disabled = false;
                                };
                            }
                            slotsContainer.appendChild(btn);
                        });
                    });
                    
                    if (!hasSlots) {
                        slotsContainer.innerHTML = '<div class="alert alert-secondary w-100 text-center">No time slots generated.</div>';
                    } else if (allFull) {
                        const alertDiv = document.createElement('div');
                        alertDiv.className = 'alert alert-danger w-100 text-center mt-3';
                        alertDiv.innerHTML = '<i class="bi bi-x-circle"></i> All time slots are full for this date.';
                        slotsContainer.appendChild(alertDiv);
                    }
                }
                goToStep(4);
            } else {
                window.showAlert(res.message, 'danger');
            }
        } catch (error) {
            window.showAlert('Failed to fetch schedule slots.', 'danger');
        } finally {
            btnNext3.disabled = false;
            btnNext3.textContent = originalText;
        }
    });

    // Step 4 -> 5 (Slot selected)
    btnNext4.addEventListener('click', () => {
        goToStep(5);
    });

    // Step 5 -> 6 (Complaint)
    complaintInput.addEventListener('input', () => {
        btnNext5.disabled = complaintInput.value.trim().length === 0;
    });

    btnNext5.addEventListener('click', () => {
        // Populate Summary
        document.getElementById('summaryDate').textContent = visitDateInput.value;
        document.getElementById('summarySpec').textContent = specSelect.options[specSelect.selectedIndex].text;
        document.getElementById('summaryDoctor').textContent = doctorSelect.options[doctorSelect.selectedIndex].text;
        document.getElementById('summaryTime').textContent = timeSlotInput.value;
        document.getElementById('summaryComplaint').textContent = complaintInput.value;
        goToStep(6);
    });

    // Step 6 (Submit Booking)
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
            complaint: complaintInput.value,
            doctor_id: doctorSelect.value, // Passed just in case backend wants it
            specialization: specSelect.value // Passed just in case backend wants it
        };

        try {
            const res = await window.apiFetch('/api/bookings', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            if (res.success) {
                // Hide form, show success
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
                    window.location.href = '/auth/login'; // Redirect to login if unauth
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
