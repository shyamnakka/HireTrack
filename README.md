# 🚀 HireTrack — Job Application Tracking System

HireTrack is a full-stack web application designed to help users manage their job search in one centralized platform.

It allows users to track job applications, schedule interview rounds, manage reminders, and maintain their profile from a responsive dashboard.

---

## 📌 Overview

During a job search, it can become difficult to keep track of:

- Job applications
- Application statuses
- Interview rounds
- Interview dates and times
- Meeting links
- Important reminders
- Company and role information

HireTrack solves this problem by providing a centralized platform where all of this information can be managed in one place.

---

## ✨ Features

### 🔐 Authentication

- User registration
- User login
- JWT-based authentication
- Secure password hashing using bcrypt
- Protected routes
- Logout functionality
- Automatic session restoration
- Unauthorized request handling

### 📊 Dashboard

- Total applications count
- Active applications count
- Upcoming interviews
- Pending reminders
- Recent applications
- Upcoming interview timeline
- Pending reminder list

### 💼 Application Management

Users can:

- Create applications
- View applications
- View application details
- Edit applications
- Delete applications
- Track application status
- Store company and job role information
- Store location and package information
- Store application notes

Supported application statuses include:

- Applied
- Selected
- Rejected
- Withdrawn

### 📅 Interview Management

Users can:

- Schedule interview rounds
- View interview history
- Edit interview details
- Delete interviews
- Store interview round names
- Store interview date and time
- Select interview mode
- Track interview result
- Add interview notes/feedback
- Add meeting links

Interview modes:

- Online
- In-Person
- Telephonic

Interview results:

- Pending
- Cleared
- Failed
- Cancelled

### ⏰ Reminder Management

Users can:

- Create reminders
- Edit reminders
- Delete reminders
- Mark reminders as completed
- Associate reminders with applications
- Convert linked reminders into general reminders

Reminders can be:

- General reminders
- Application-specific reminders

### 👤 Profile Management

Users can:

- View profile information
- Update name
- Update email
- Change password
- Delete their account

Account deletion safely removes the user's associated data.

---

# 🏗️ System Architecture

```text
                    ┌─────────────────────┐
                    │      User           │
                    │   Web Browser       │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   React Frontend    │
                    │   JavaScript        │
                    │   Tailwind CSS      │
                    └──────────┬──────────┘
                               │
                               │ Axios / HTTP
                               ▼
                    ┌─────────────────────┐
                    │   FastAPI Backend   │
                    │      Python         │
                    └──────────┬──────────┘
                               │
                ┌──────────────┼──────────────┐
                ▼              ▼              ▼
          Authentication   Services        CRUD
                │              │              │
                └──────────────┼──────────────┘
                               ▼
                    ┌─────────────────────┐
                    │    SQLAlchemy ORM   │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │     PostgreSQL      │
                    └─────────────────────┘
