const dashboardService = require('../services/dashboardService');

const getAdminDashboard = async (req, res) => {
  try {
    const data = await dashboardService.getAdminDashboard();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getPatientActiveBooking = async (req, res) => {
  try {
    const patientId = req.session.patientId;
    const data = await dashboardService.getPatientActiveBooking(patientId);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAdminDashboard,
  getPatientActiveBooking
};
