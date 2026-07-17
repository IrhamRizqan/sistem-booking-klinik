const archiveService = require('../services/archiveService');

const getArchive = async (req, res) => {
  try {
    const { page = 1, limit = 10, date, status, doctor_id, specialization, time_slot, search } = req.query;

    const filters = { date, status, doctor_id, specialization, time_slot, search };
    
    const result = await archiveService.getArchive(filters, parseInt(page), parseInt(limit));
    
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
  getArchive
};
