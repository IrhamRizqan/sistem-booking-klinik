# Project Context

Project Name

Clinic Queue & Booking System

Purpose

A web application for clinic booking and queue management.

Target

University SPKL Project.

Development Time

Approximately two weeks.

Tech Stack

- Node.js
- Express.js
- Bootstrap 5
- EJS
- Prisma ORM
- MySQL
- Express Session

Architecture

MVC

Roles

Admin

Patient

There are NO other login roles.

Entities

- Admin
- Patient
- Doctor
- Schedule
- Booking

Booking Flow

Patient

↓

Choose Visit Date

↓

Choose Specialization

↓

Choose Doctor

↓

Choose Time Slot

↓

Write Complaint

↓

Booking Created

↓

Queue Number Generated

Admin Queue Flow

Confirmed

↓

Calling

↓

On Treatment

↓

Completed

or

Skipped

Business Rules

- Maximum one booking per patient per day.
- Maximum booking period is 30 days ahead.
- Queue number generated automatically.
- Queue number resets every day.
- Queue number is unique per doctor and time slot.
- Skipped bookings cannot be resumed.