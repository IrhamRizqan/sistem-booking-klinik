const requirePatientAuth = (req, res, next) => {
  if (!req.session.patientId) {
    return res.redirect('/auth/login');
  }
  next();
};

module.exports = {
  requirePatientAuth
};
