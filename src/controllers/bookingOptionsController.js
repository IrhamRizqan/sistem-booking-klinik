const bookingOptionsService = require('../services/bookingOptionsService');

const getSpecializations = async (req, res) => {
  try {
    const specializations = await bookingOptionsService.getSpecializations();
    return res.status(200).json({ success: true, data: specializations });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getDoctors = async (req, res) => {
  try {
    const { specialization } = req.query;
    if (!specialization) {
      return res.status(400).json({ success: false, message: 'Specialization is required' });
    }
    const doctors = await bookingOptionsService.getDoctorsBySpecialization(specialization);
    return res.status(200).json({ success: true, data: doctors });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getSchedules = async (req, res) => {
  try {
    const { doctor_id, date } = req.query;
    if (!doctor_id || !date) {
      return res.status(400).json({ success: false, message: 'doctor_id and date are required' });
    }
    
    // Basic date validation
    const visitDateObj = new Date(`${date}T00:00:00.000Z`);
    const todayStr = new Date().toISOString().split('T')[0];
    const today = new Date(`${todayStr}T00:00:00.000Z`);
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setUTCDate(today.getUTCDate() + 30);

    if (visitDateObj < today) {
      return res.status(400).json({ success: false, message: 'Cannot query past dates' });
    }
    if (visitDateObj > thirtyDaysFromNow) {
      return res.status(400).json({ success: false, message: 'Cannot query dates more than 30 days ahead' });
    }

    const schedules = await bookingOptionsService.getSchedulesForBooking(doctor_id, date);
    return res.status(200).json({ success: true, data: schedules });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getSpecializations,
  getDoctors,
  getSchedules
};
