# TrackPay – Employee Monitoring & Automated Payroll Management System

**TrackPay** is a MERN-stack web application developed to simplify workforce management and automate payroll operations. It combines employee management, GPS-based attendance tracking, salary calculation, leave management, task monitoring and payroll processing in one platform.

## 🎯 Project Objective

The main objective of TrackPay is to reduce manual HR operations, improve employee attendance monitoring and simplify salary processing through an integrated workforce management system.

## ✨ Key Features

### 1. Authentication & Role Management
- Secure user login and authentication.
- Role-based access for Admin, Manager and Employee.
- JWT-based authentication.
- Protected application routes.

### 2. Employee Management
- Add and manage employee records.
- View employee details.
- Update employee information.
- Manage departments and designations.
- Activate or deactivate employee records.

### 3. Salary Structure Management
- Configure individual employee salary structures.
- Manage basic salary and allowances.
- Configure incentives and deductions.
- Set salary effective dates.

### 4. Automated Payroll Management
- Generate monthly payroll.
- Calculate gross and net salary.
- Include attendance and overtime information.
- Calculate applicable deductions.
- View payroll history.
- Approve or reject payroll.
- Mark payroll as paid.

### 5. GPS-Based Attendance Monitoring
- Employee check-in and check-out.
- Capture GPS location through browser geolocation.
- Verify attendance using geofencing.
- Monitor attendance records.
- Calculate working hours.
- View attendance history.

### 6. Leave Management
- Submit employee leave requests.
- Review leave applications.
- Approve or reject requests.
- View leave status and history.

### 7. Task Management
- Create and assign employee tasks.
- Set task priorities and deadlines.
- Monitor task progress.
- Update task status.
- Track completed tasks.

### 8. Manager Dashboard
- View assigned team members.
- Monitor team attendance.
- Track assigned tasks and progress.

### 9. Notifications
- View system notifications.
- Receive updates related to application activities.

### 10. Analytics Dashboard
- View payroll statistics.
- Monitor employee and attendance information.
- Track completed tasks.
- View leave statistics.

### 11. Audit Logs
- Maintain records of important system activities.
- Track employee and payroll operations.
- Review administrative actions.
- Filter activity records by module and action.

### 12. Payslips & Reports
- View employee payroll history.
- Download payslips in PDF format.
- Filter attendance reports by date.
- Export attendance reports as CSV files.

## 🛠️ Technology Stack

| Category | Technologies |
|---|---|
| Frontend | React.js, JavaScript, CSS |
| Development Server | Vite |
| Backend | Node.js, Express.js |
| Database | MongoDB |
| ODM | Mongoose |
| Authentication | JSON Web Token (JWT) |
| API Testing | Postman |
| Database Management | MongoDB Compass |
| Version Control | Git and GitHub |

## 🏗️ Project Architecture

TrackPay follows a client-server architecture using the MERN stack.

- **Frontend:** React.js provides the user interface and communicates with backend APIs.
- **Backend:** Node.js and Express.js handle business logic, authentication and API requests.
- **Database:** MongoDB stores employee, attendance, payroll, leave, task and other application records.

## 📁 Project Structure

```text
TrackPay/
│
├── client/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── hooks/
│       ├── pages/
│       ├── services/
│       └── ...
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── ...
│   └── server.js
│
└── README.md
```

## ⚙️ Installation & Setup

### Prerequisites

Install the following before running the project:

- Node.js and npm
- MongoDB
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/keerthana07-kizz/TrackPay.git
```

### 2. Set Up the Backend

```bash
cd TrackPay/server
npm install
```

Create a `.env` file inside the `server` folder and configure the MongoDB connection URI and JWT secret using the variable names expected by the backend configuration.

Start the backend:

```bash
npm run dev
```

### 3. Set Up the Frontend

Open another terminal:

```bash
cd TrackPay/client
npm install
npm run dev
```

Open the local frontend address displayed by Vite in your browser.

## 🔄 Application Workflow

1. Admin logs into the application.
2. Admin creates and manages employee records.
3. Salary structures are configured for employees.
4. Employees use GPS-based attendance check-in and check-out.
5. Managers assign and monitor employee tasks.
6. Employees submit leave requests.
7. Admin reviews attendance and generates payroll.
8. Payroll is approved and marked as paid.
9. Employees view their payroll history and download payslips.
10. Admin monitors analytics and audit logs.

## 🔐 Security

- JWT-based authentication.
- Role-based access control.
- Protected backend routes.
- Environment variables for sensitive configuration.
- Location permission required for GPS-based attendance.

## 🚀 Future Enhancements

- Native Excel (`.xlsx`) export for payroll and other reports.
- Advanced payroll analytics and visual reports.
- Automated email notifications.
- Enhanced GPS tracking and attendance insights.
- Additional HR reporting capabilities.

## 👩‍💻 Developer

**Keerthy**

GitHub: [pkeerthy9](https://github.com/pkeerthy9)

## 📌 Project Information

**Project Name:** TrackPay

**Project Title:** Monitoring Marketing Employees with Automated Payroll Using GPS Tracking

**Technology:** MERN Stack

**Project Type:** Full-Stack Web Application

---

*TrackPay – Simplifying Workforce Management and Payroll Operations.*
