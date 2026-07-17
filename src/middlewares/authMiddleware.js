const requirePatientAuth = (req, res, next) => {
  if (!req.session.patientId) {
    return res.status(401).json({ success: false, message: 'Unauthorized. Please login.' });
  }
  next();
};

const requireAdminAuth = (req, res, next) => {
  if (!req.session.adminId) {
    return res.status(401).json({ success: false, message: 'Unauthorized. Admin access required.' });
  }
  next();
};

module.exports = {
  requirePatientAuth,
  requireAdminAuth
};
