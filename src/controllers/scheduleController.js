const scheduleService = require('../services/scheduleService');

const validateScheduleInput = (doctor_id, day, start_time, end_time, quota) => {
  if (!doctor_id) return 'Doctor is required';
  if (!day) return 'Day is required';
  if (!start_time || !end_time) return 'Start time and end time are required';
  
  if (parseInt(quota) < 1) return 'Quota must be at least 1';

  // Basic time validation HH:mm
  const [startH, startM] = start_time.split(':').map(Number);
  const [endH, endM] = end_time.split(':').map(Number);
  
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (endMinutes <= startMinutes) {
    return 'End time must be strictly greater than start time';
  }
  
  return null; // Valid
};

const index = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';

    const data = await scheduleService.getAllSchedules(page, limit, search);
    return res.status(200).json({
      success: true,
      message: 'Schedules retrieved successfully',
      data: {
        schedules: data.schedules,
        pagination: {
          currentPage: data.currentPage,
          totalPages: data.totalPages,
          totalItems: data.totalItems,
          limit
        }
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const show = async (req, res) => {
  try {
    const schedule = await scheduleService.getScheduleById(req.params.id);
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }
    return res.status(200).json({ success: true, message: 'Schedule retrieved', data: schedule });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const store = async (req, res) => {
  const { doctor_id, day, start_time, end_time, quota } = req.body;
  
  if (Array.isArray(day)) {
    if (day.length === 0) return res.status(400).json({ success: false, message: 'Please select at least one day' });
    
    for (const d of day) {
      const validationError = validateScheduleInput(doctor_id, d, start_time, end_time, quota);
      if (validationError) return res.status(400).json({ success: false, message: `Validation failed for ${d}: ${validationError}` });
    }
    
    try {
      const createdSchedules = [];
      for (const d of day) {
        const schedule = await scheduleService.createSchedule({ doctor_id, day: d, start_time, end_time, quota });
        createdSchedules.push(schedule);
      }
      return res.status(201).json({ success: true, message: 'Schedules created successfully', data: createdSchedules });
    } catch (error) {
      return res.status(400).json({ success: false, message: 'Failed to create schedules. ' + error.message });
    }
  }

  const validationError = validateScheduleInput(doctor_id, day, start_time, end_time, quota);
  if (validationError) {
    return res.status(400).json({ success: false, message: validationError });
  }

  try {
    const schedule = await scheduleService.createSchedule({ doctor_id, day, start_time, end_time, quota });
    return res.status(201).json({ success: true, message: 'Schedule created successfully', data: schedule });
  } catch (error) {
    return res.status(400).json({ success: false, message: 'Failed to create schedule. ' + error.message });
  }
};

const update = async (req, res) => {
  const { doctor_id, day, start_time, end_time, quota } = req.body;
  
  const validationError = validateScheduleInput(doctor_id, day, start_time, end_time, quota);
  if (validationError) {
    return res.status(400).json({ success: false, message: validationError });
  }

  try {
    const schedule = await scheduleService.updateSchedule(req.params.id, { doctor_id, day, start_time, end_time, quota });
    return res.status(200).json({ success: true, message: 'Schedule updated successfully', data: schedule });
  } catch (error) {
    return res.status(400).json({ success: false, message: 'Failed to update schedule. ' + error.message });
  }
};

const destroy = async (req, res) => {
  try {
    await scheduleService.deleteSchedule(req.params.id);
    return res.status(200).json({ success: true, message: 'Schedule deleted successfully' });
  } catch (error) {
    return res.status(400).json({ success: false, message: 'Failed to delete schedule' });
  }
};

module.exports = {
  index,
  show,
  store,
  update,
  destroy
};
