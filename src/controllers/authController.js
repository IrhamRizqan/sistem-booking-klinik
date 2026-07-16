const authService = require('../services/authService');

const getLogin = (req, res) => {
  res.render('auth/login', { error: null });
};

const postLogin = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.render('auth/login', { error: 'Username and password are required' });
  }

  try {
    const patient = await authService.loginPatient(username, password);
    req.session.patientId = patient.id;
    res.redirect('/');
  } catch (error) {
    res.render('auth/login', { error: error.message });
  }
};

const getRegister = (req, res) => {
  res.render('auth/register', { error: null, formData: {} });
};

const postRegister = async (req, res) => {
  const { name, phone, username, password, confirmPassword } = req.body;

  if (!name || !username || !password || !confirmPassword) {
    return res.render('auth/register', { 
      error: 'All fields except phone are required', 
      formData: req.body 
    });
  }

  if (password !== confirmPassword) {
    return res.render('auth/register', { 
      error: 'Passwords do not match', 
      formData: req.body 
    });
  }

  try {
    await authService.registerPatient({ name, phone, username, password });
    // Registration successful, redirect to login
    res.redirect('/auth/login');
  } catch (error) {
    res.render('auth/register', { 
      error: error.message, 
      formData: req.body 
    });
  }
};

const logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/auth/login');
  });
};

module.exports = {
  getLogin,
  postLogin,
  getRegister,
  postRegister,
  logout
};
