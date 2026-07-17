document.addEventListener('DOMContentLoaded', async () => {
  // Hero Banner Carousel
  const track = document.getElementById('carouselTrack');
  const dots = document.querySelectorAll('.home-carousel__dot');
  let currentSlide = 0;
  const slideCount = dots.length;
  let carouselInterval;

  function updateCarousel(index) {
    if (!track) return;
    currentSlide = index;
    track.style.transform = `translateX(-${index * 100}%)`;
    
    dots.forEach((dot, idx) => {
      if (idx === index) {
        dot.classList.add('home-carousel__dot--active');
      } else {
        dot.classList.remove('home-carousel__dot--active');
      }
    });
  }

  function startCarousel() {
    carouselInterval = setInterval(() => {
      let nextSlide = (currentSlide + 1) % slideCount;
      updateCarousel(nextSlide);
    }, 5000);
  }

  if (track) {
    dots.forEach((dot) => {
      dot.addEventListener('click', (e) => {
        clearInterval(carouselInterval);
        const targetIndex = parseInt(e.target.dataset.slide);
        updateCarousel(targetIndex);
        startCarousel();
      });
    });
    startCarousel();
  }

  // Search Form Widget Date Bounds
  const dateField = document.getElementById('datefield');
  if (dateField) {
    const today = new Date();
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 30);
    
    if (typeof flatpickr !== 'undefined') {
      flatpickr(dateField, {
        dateFormat: "Y-m-d",
        altInput: true,
        altFormat: "d/m/Y",
        minDate: today,
        maxDate: maxDate,
        defaultDate: today,
        onChange: function() {
          dateField.dispatchEvent(new Event('change'));
        }
      });
    } else {
      const todayStr = today.toISOString().split('T')[0];
      const maxDateStr = maxDate.toISOString().split('T')[0];
      dateField.min = todayStr;
      dateField.max = maxDateStr;
      dateField.value = todayStr;
    }
  }

  // Populate Specializations Dropdown
  const specSelect = document.getElementById('specializationSelect');
  const docSelect = document.getElementById('doctorSelect');
  const doctorGrid = document.getElementById('doctorGrid');

  async function loadSpecialistsAndDoctors() {
    try {
      const res = await window.apiFetch('/api/booking-options/specializations');
      if (res.success && res.data.length > 0) {
        // Clear select
        specSelect.innerHTML = '<option value="" disabled selected>Pilih Spesialisasi</option>';
        res.data.forEach(spec => {
          const opt = document.createElement('option');
          opt.value = spec;
          opt.textContent = spec;
          specSelect.appendChild(opt);
        });

        // Enable listener for doctor dropdown
        specSelect.addEventListener('change', async () => {
          const selectedSpec = specSelect.value;
          const selectedDate = dateField.value;
          
          docSelect.disabled = true;
          docSelect.innerHTML = '<option value="" disabled selected>Memuat dokter...</option>';
          
          try {
            const docRes = await window.apiFetch(`/api/booking-options/doctors?specialization=${encodeURIComponent(selectedSpec)}&date=${selectedDate}`);
            if (docRes.success) {
              docSelect.innerHTML = '<option value="" disabled selected>Pilih Dokter</option>';
              if (docRes.data.length === 0) {
                docSelect.innerHTML = '<option value="" disabled>Tidak ada dokter praktik</option>';
              } else {
                docSelect.disabled = false;
                docRes.data.forEach(doc => {
                  const opt = document.createElement('option');
                  opt.value = doc.id;
                  opt.textContent = doc.name;
                  docSelect.appendChild(opt);
                });
              }
            }
          } catch (e) {
            docSelect.innerHTML = '<option value="" disabled>Gagal memuat dokter</option>';
          }
        });

        // Load All Doctors to Homepage Grid
        async function loadGridDoctors() {
          if (!doctorGrid) return;
          doctorGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: var(--space-xl);">
              <i class="bi bi-arrow-repeat spin" style="font-size: 2rem; color: var(--color-muted);"></i>
            </div>
          `;
          
          let doctorsFound = [];
          for (const spec of res.data) {
            const dateStr = dateField ? dateField.value : new Date().toISOString().split('T')[0];
            const dRes = await window.apiFetch(`/api/booking-options/doctors?specialization=${encodeURIComponent(spec)}&date=${dateStr}`);
            if (dRes.success) {
              dRes.data.forEach(d => {
                doctorsFound.push({ ...d, specialization: spec });
              });
            }
          }

          if (doctorsFound.length === 0) {
            doctorGrid.innerHTML = `
              <div style="grid-column: 1/-1; text-align: center; color: var(--color-muted); padding: var(--space-xl);">
                <i class="bi bi-info-circle" style="font-size: 2rem;"></i>
                <p style="margin-top: 10px;">Tidak ada dokter yang bertugas pada tanggal ini.</p>
              </div>
            `;
          } else {
            doctorGrid.innerHTML = '';
            doctorsFound.forEach(doc => {
              const card = document.createElement('div');
              card.className = 'doctor-card';
              
              const schedText = doc.schedules && doc.schedules.length > 0 
                ? `${doc.schedules[0].start_time} - ${doc.schedules[0].end_time}` 
                : 'Jadwal tidak tersedia';

              card.innerHTML = `
                <div class="doctor-card__body">
                  <div style="margin-bottom: var(--space-xs);">
                    <span class="doctor-card__specialty-badge">${doc.specialization}</span>
                  </div>
                  <h3 class="doctor-card__name" style="margin-bottom: var(--space-xs);">${doc.name}</h3>
                  <div class="doctor-card__schedule" style="margin-bottom: var(--space-md);">
                    <i class="bi bi-clock"></i>
                    <span>${schedText}</span>
                  </div>
                  <button class="doctor-card__btn" data-doctor-id="${doc.id}" data-spec="${doc.specialization}">
                    <i class="bi bi-calendar-plus"></i> Reservasi Kunjungan
                  </button>
                </div>
              `;
              doctorGrid.appendChild(card);
            });

            // Add click listeners to Doctor Card buttons
            document.querySelectorAll('.doctor-card__btn').forEach(btn => {
              btn.addEventListener('click', async (e) => {
                const target = e.currentTarget;
                const docId = target.dataset.doctorId;
                const spec = target.dataset.spec;
                const date = dateField.value;
                await searchAndShowModal(docId, spec, date);
              });
            });
          }
        }
        
        await loadGridDoctors();

        if (dateField) {
          dateField.addEventListener('change', () => {
            if (specSelect.value) {
              specSelect.dispatchEvent(new Event('change'));
            }
            loadGridDoctors();
          });
        }

      } else {
        if (doctorGrid) {
          doctorGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; color: var(--color-muted); padding: var(--space-xl);">
              <i class="bi bi-info-circle" style="font-size: 2rem;"></i>
              <p style="margin-top: 10px;">Belum ada spesialisasi dokter yang tersedia saat ini.</p>
            </div>
          `;
        }
      }
    } catch (e) {
      console.error(e);
      if (doctorGrid) {
        doctorGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--color-danger); padding: var(--space-xl);">Gagal memuat data dokter. Silakan muat ulang halaman.</div>';
      }
    }
  }

  await loadSpecialistsAndDoctors();

  // Handle Schedule Search
  const searchForm = document.getElementById('searchForm');
  const resultsModal = document.getElementById('resultsModal');
  const modalClose = document.getElementById('modalClose');
  const modalBody = document.getElementById('modalBody');
  const modalTitle = document.getElementById('modalTitle');

  async function searchAndShowModal(doctorId, specialization, date) {
    if (!resultsModal || !modalBody) return;
    
    modalBody.innerHTML = `
      <div style="text-align: center; padding: var(--space-lg);">
        <i class="bi bi-arrow-repeat spin" style="font-size: 2rem; display: inline-block; animation: spin 1.5s linear infinite;"></i>
        <p style="margin-top: 10px;">Mencari slot jadwal dokter...</p>
      </div>
    `;
    resultsModal.classList.add('search-results-modal--active');

    try {
      const res = await window.apiFetch(`/api/booking-options/schedules?doctor_id=${doctorId}&date=${date}`);
      
      // Let's get the doctor's name
      const docRes = await window.apiFetch(`/api/booking-options/doctors?specialization=${encodeURIComponent(specialization)}&date=${date}`);
      const doctorObj = docRes.success ? docRes.data.find(d => d.id == doctorId) : null;
      const doctorName = doctorObj ? doctorObj.name : 'Dokter';

      modalTitle.textContent = `Jadwal: ${doctorName}`;

      if (res.success && res.data.length > 0) {
        modalBody.innerHTML = '';
        res.data.forEach(sched => {
          const item = document.createElement('div');
          item.className = 'search-result-item';
          
          let slotsHtml = '';
          sched.slots.forEach(slot => {
            if (slot.is_full) {
              slotsHtml += `<span class="search-result-item__slot search-result-item__slot--full">${slot.time} (Penuh)</span>`;
            } else {
              slotsHtml += `<button class="search-result-item__slot" data-schedule-id="${sched.id}" data-time-slot="${slot.time}">${slot.time}</button>`;
            }
          });

          item.innerHTML = `
            <div style="font-weight: var(--weight-bold); margin-bottom: var(--space-xs); display:flex; align-items:center; gap:var(--space-2xs); color:var(--home-primary);">
              <i class="bi bi-calendar-check"></i> Hari ${translateDay(sched.day)} (${sched.start_time} - ${sched.end_time})
            </div>
            <div class="search-result-item__time-grid">
              ${slotsHtml}
            </div>
          `;
          modalBody.appendChild(item);
        });

        // Add listeners to active slots
        document.querySelectorAll('.search-result-item__slot:not(.search-result-item__slot--full)').forEach(slotBtn => {
          slotBtn.addEventListener('click', async (e) => {
            const schedId = e.target.dataset.scheduleId;
            const timeSlot = e.target.dataset.timeSlot;

            // Check if patient is authenticated
            try {
              const authMe = await window.apiFetch('/api/auth/me');
              const targetUrl = `/booking/new?date=${date}&specialty=${encodeURIComponent(specialization)}&doctor=${doctorId}&schedule_id=${schedId}&time_slot=${encodeURIComponent(timeSlot)}`;
              
              if (authMe && authMe.role === 'patient') {
                window.location.href = targetUrl;
              } else {
                // Not logged in, redirect to login page with redirect URL back to target
                window.location.href = `/auth/login?redirect=${encodeURIComponent(targetUrl)}`;
              }
            } catch (err) {
              window.location.href = '/auth/login';
            }
          });
        });

      } else {
        modalBody.innerHTML = `
          <div style="text-align: center; padding: var(--space-lg); color: var(--color-muted);">
            <i class="bi bi-calendar-x" style="font-size: 2rem;"></i>
            <p style="margin-top: 10px;">Tidak ada jadwal praktik yang tersedia pada tanggal ini.</p>
          </div>
        `;
      }
    } catch (e) {
      modalBody.innerHTML = '<div style="text-align: center; padding: var(--space-lg); color: var(--color-danger);">Terjadi kesalahan saat memuat jadwal.</div>';
    }
  }

  if (searchForm) {
    searchForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const spec = specSelect.value;
      const doctorId = docSelect.value;
      const date = dateField.value;
      
      if (!spec || !doctorId || !date) return;
      await searchAndShowModal(doctorId, spec, date);
    });
  }

  // Close Modal
  if (modalClose) {
    modalClose.addEventListener('click', () => {
      resultsModal.classList.remove('search-results-modal--active');
    });
  }

  window.addEventListener('click', (e) => {
    if (e.target === resultsModal) {
      resultsModal.classList.remove('search-results-modal--active');
    }
  });

  // Helper function to translate day name to Indonesian
  function translateDay(englishDay) {
    const translation = {
      'Monday': 'Senin',
      'Tuesday': 'Selasa',
      'Wednesday': 'Rabu',
      'Thursday': 'Kamis',
      'Friday': 'Jumat',
      'Saturday': 'Sabtu',
      'Sunday': 'Minggu'
    };
    return translation[englishDay] || englishDay;
  }
});
