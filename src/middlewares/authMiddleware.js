const requirePatientAuth = (req, res, next) => {
  if (!req.session.patientId) {
    return res.status(401).json({ success: false, message: 'Unauthorized. Please login.' });
  }
  next();
};

const requireAdminAuth = (req, res, next) => {
  // Stub for now. Admin auth will be fully implemented in a later phase.
  // if (!req.session.adminId) return res.status(401).json({ success: false, message: 'Unauthorized' });
  next();
};

module.exports = {
  requirePatientAuth,
  requireAdminAuth
};
