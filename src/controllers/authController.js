const authService = require('../services/authService');

const postLogin = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required' });
  }

  try {
    const patient = await authService.loginPatient(username, password);
    req.session.patientId = patient.id;
    return res.status(200).json({ success: true, message: 'Login successful', data: { id: patient.id, username: patient.username, name: patient.name } });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const postRegister = async (req, res) => {
  const { name, phone, username, password, confirmPassword } = req.body;

  if (!name || !username || !password || !confirmPassword) {
    return res.status(400).json({ success: false, message: 'All fields except phone are required' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ success: false, message: 'Passwords do not match' });
  }

  try {
    const patient = await authService.registerPatient({ name, phone, username, password });
    return res.status(201).json({ success: true, message: 'Registration successful', data: { id: patient.id, username: patient.username } });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const logout = (req, res) => {
  req.session.destroy(() => {
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  });
};

module.exports = {
  postLogin,
  postRegister,
  logout
};
