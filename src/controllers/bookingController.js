const bookingService = require('../services/bookingService');

const store = async (req, res) => {
  const { schedule_id, visit_date, time_slot, complaint, doctor_id, specialization } = req.body;
  const patientId = req.session.patientId; // Injected via requirePatientAuth middleware

  // 1. Validate required fields
  if (!schedule_id || !visit_date || !time_slot || !complaint) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: schedule_id, visit_date, time_slot, complaint'
    });
  }

  if (!patientId) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Patient ID not found in session'
    });
  }

  // 2. Delegate to Service
  try {
    const booking = await bookingService.createBooking(patientId, {
      schedule_id,
      visit_date,
      time_slot,
      complaint
    });

    return res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: booking
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const history = async (req, res) => {
  try {
    const patientId = req.session.patientId;
    const { page = 1, limit = 10, date, status, doctor_id } = req.query;

    const filters = { date, status, doctor_id };
    
    const result = await bookingService.getHistory(patientId, filters, parseInt(page), parseInt(limit));
    
    return res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  store,
  history
};
