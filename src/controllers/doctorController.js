const doctorService = require('../services/doctorService');

const index = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const specialization = req.query.specialization || '';

    const data = await doctorService.getPaginatedDoctors(page, limit, search, specialization);
    const specializations = await doctorService.getSpecializations();

    return res.status(200).json({
      success: true,
      message: 'Doctors retrieved successfully',
      data: {
        doctors: data.doctors,
        pagination: {
          currentPage: data.currentPage,
          totalPages: data.totalPages,
          totalItems: data.totalItems,
          limit
        },
        filters: {
          search,
          specialization,
          availableSpecializations: specializations
        }
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const show = async (req, res) => {
  try {
    const doctor = await doctorService.getDoctorById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    return res.status(200).json({ success: true, message: 'Doctor retrieved', data: doctor });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const store = async (req, res) => {
  const { name, specialization } = req.body;
  if (!name || !specialization) {
    return res.status(400).json({ success: false, message: 'Name and Specialization are required' });
  }
  
  try {
    const doctor = await doctorService.createDoctor({ name, specialization });
    return res.status(201).json({ success: true, message: 'Doctor created successfully', data: doctor });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const update = async (req, res) => {
  const { name, specialization } = req.body;
  const id = req.params.id;

  if (!name || !specialization) {
    return res.status(400).json({ success: false, message: 'Name and Specialization are required' });
  }

  try {
    const doctor = await doctorService.updateDoctor(id, { name, specialization });
    return res.status(200).json({ success: true, message: 'Doctor updated successfully', data: doctor });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const destroy = async (req, res) => {
  try {
    await doctorService.deleteDoctor(req.params.id);
    return res.status(200).json({ success: true, message: 'Doctor deleted successfully' });
  } catch (error) {
    return res.status(400).json({ success: false, message: 'Failed to delete doctor' });
  }
};

module.exports = {
  index,
  show,
  store,
  update,
  destroy
};
