const queueService = require('../services/queueService');

const index = async (req, res) => {
  try {
    const { date, doctor_id, time_slot, sort } = req.query;

    const filters = {};
    if (date) filters.visit_date = date;
    if (doctor_id) filters.doctor_id = doctor_id;
    if (time_slot) filters.time_slot = time_slot;

    const queues = await queueService.getQueues(filters, sort);
    return res.status(200).json({ success: true, data: queues });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    const updatedBooking = await queueService.updateQueueStatus(req.params.id, status);
    return res.status(200).json({
      success: true,
      message: 'Status updated successfully',
      data: updatedBooking
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  index,
  updateStatus
};
