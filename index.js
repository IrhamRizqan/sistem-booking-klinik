require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static(path.join(__dirname, 'src', 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session Middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'super-secret-key-for-dev',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 // 1 day
    }
  })
);

const authRoutes = require('./src/routes/auth.routes');
const doctorRoutes = require('./src/routes/doctor.routes');
const scheduleRoutes = require('./src/routes/schedule.routes');
const bookingRoutes = require('./src/routes/booking.routes');
const bookingOptionsRoutes = require('./src/routes/bookingOptions.routes');
const queueRoutes = require('./src/routes/queue.routes');
const dashboardRoutes = require('./src/routes/dashboard.routes');
const archiveRoutes = require('./src/routes/archive.routes');
const { requirePatientAuth, requireAdminAuth } = require('./src/middlewares/authMiddleware');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/doctors', requireAdminAuth, doctorRoutes);
app.use('/api/schedules', requireAdminAuth, scheduleRoutes);
app.use('/api/bookings', requirePatientAuth, bookingRoutes);
app.use('/api/booking-options', bookingOptionsRoutes);
app.use('/api/queues', requireAdminAuth, queueRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/archives', requireAdminAuth, archiveRoutes);

// Static HTML Fallback Routing
// If a user goes to /auth/login, serve public/pages/auth/login.html
app.get('/:section/:page', (req, res, next) => {
  // Avoid interfering with /api routes
  if (req.params.section === 'api') return next();

  const filePath = path.join(__dirname, 'src', 'public', 'pages', req.params.section, `${req.params.page}.html`);
  const dirIndexPath = path.join(__dirname, 'src', 'public', 'pages', req.params.section, req.params.page, 'index.html');
  
  res.sendFile(filePath, (err) => {
    if (err) {
      res.sendFile(dirIndexPath, (err2) => {
        if (err2) {
          next();
        }
      });
    }
  });
});

app.get('/:section/:subsection/:page', (req, res, next) => {
  if (req.params.section === 'api') return next();

  const filePath = path.join(__dirname, 'src', 'public', 'pages', req.params.section, req.params.subsection, `${req.params.page}.html`);
  res.sendFile(filePath, (err) => {
    if (err) {
      next();
    }
  });
});

// Root route
app.get('/', (req, res) => {
  if (req.session.adminId) {
    return res.redirect('/admin/dashboard');
  }
  if (req.session.userId) {
    return res.redirect('/patient/dashboard');
  }
  res.sendFile(path.join(__dirname, 'src', 'public', 'pages', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
