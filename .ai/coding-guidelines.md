# Coding Guidelines

---

# General Principles

Write simple and readable code.

Prefer clarity over cleverness.

Keep implementation suitable for a university project.

Avoid unnecessary abstraction.

Avoid over-engineering.

---

# Architecture

Use MVC Architecture.

Routes

↓

Controllers

↓

Services

↓

Prisma

↓

MySQL

Controllers should remain thin.

Business logic belongs in Services.

Never access Prisma directly inside Routes.

Never place SQL or Prisma queries inside Views.

---

# Naming Convention

Variables

camelCase

Functions

camelCase

Classes

PascalCase

Controllers

bookingController.js

Services

bookingService.js

Routes

booking.routes.js

Views

kebab-case

Example

booking-history.ejs

---

# Folder Rules

Controllers

Only request handling.

Services

Business logic only.

Helpers

Reusable utility functions.

Middlewares

Authentication and authorization.

Validations

Input validation only.

Views

Presentation only.

No business logic.

---

# Database

Use Prisma ORM only.

Always use Prisma migrations.

Never hardcode IDs.

Always use foreign keys.

Use snake_case for database tables.

Use snake_case for columns.

---

# Bootstrap

Bootstrap 5 only.

Bootstrap Icons only.

Prefer Bootstrap utility classes.

Avoid unnecessary custom CSS.

Create reusable partials.

Navbar

Sidebar

Footer

Modal

Alerts

---

# JavaScript

Use async/await.

Avoid nested callbacks.

Keep functions small.

Return early.

Avoid duplicate code.

---

# Error Handling

Always validate user input.

Always catch errors.

Show friendly error messages.

Never expose internal errors.

---

# Security

Hash passwords using bcrypt.

Never store plaintext passwords.

Validate all request input.

Protect admin routes.

Protect patient routes.

---

# Code Style

Keep files small.

Prefer reusable components.

Prefer descriptive variable names.

Comment only when necessary.

Avoid dead code.

Avoid console.log in production.

Keep formatting consistent.