# Database Rules

Entities

Admin

Patient

Doctor

Schedule

Booking

Rules

Patient can only have one booking per visit date.

Doctor can have multiple schedules.

Schedule can have multiple bookings.

Booking stores generated queue number.

Booking stores generated booking code.

Do not duplicate data unnecessarily.

Use foreign keys consistently.

Use snake_case for database tables and columns.

Always use Prisma migrations.