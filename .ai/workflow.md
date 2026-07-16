# Workflow

This document describes the business workflow of the Clinic Queue & Booking System.

---

# Patient Workflow

## Register

Patient creates an account.

↓

Login.

---

## Login

Patient enters username and password.

If authentication succeeds:

↓

Patient Dashboard.

---

## Booking Flow

Patient Dashboard

↓

Click "Book Appointment"

↓

Choose Visit Date

↓

Choose Specialization

↓

Choose Doctor

↓

Choose Available Time Slot

↓

Write Complaint

↓

Submit Booking

↓

System validates:

- Maximum one booking per visit date.
- Visit date cannot exceed 30 days.
- Slot must still have available quota.

↓

Booking Created

↓

Generate Booking Code

↓

Generate Queue Number

↓

Status = Confirmed

↓

Booking appears in Booking History.

---

# Queue Status Flow

Confirmed

↓

Calling

↓

On Treatment

↓

Completed

or

↓

Skipped

Skipped bookings cannot be resumed.

Patients must create a new booking if another slot is still available.

---

# Admin Workflow

Admin Login

↓

Dashboard

↓

Manage Doctors

↓

Manage Schedules

↓

Manage Bookings

---

# Queue Management

Confirmed

↓

Click "Call"

↓

Status = Calling

↓

Patient arrives

↓

Click "Start Treatment"

↓

Status = On Treatment

↓

Click "Complete"

↓

Status = Completed

---

If patient does not arrive

↓

Click "Skip"

↓

Status = Skipped

Queue continues to next patient.

---

# Schedule Workflow

Admin creates doctor schedule.

Doctor schedule contains:

- Day
- Start Time
- End Time
- Quota Per Slot

The system automatically generates one-hour booking slots.

Example:

09:00–15:00

becomes

09:00–10:00

10:00–11:00

11:00–12:00

12:00–13:00

13:00–14:00

14:00–15:00

Patients never create slots manually.

---

# Booking Rules

Maximum one booking per patient per visit date.

Maximum booking period:

30 days ahead.

Queue numbers are generated automatically.

Queue numbers reset every day.

Queue numbers are unique per doctor and time slot.