# Architecture

Pattern

MVC

Flow

Browser

↓

Route

↓

Controller

↓

Service

↓

Prisma

↓

MySQL

Controllers

Controllers should stay thin.

Business logic belongs inside services.

Database access belongs inside Prisma.

Never place business logic inside routes.

Never place SQL inside controllers.

Folder Structure

src/

controllers/

services/

routes/

middlewares/

helpers/

validations/

config/

views/

public/