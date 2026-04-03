# Enable SPA Project

This repository contains two main sub-projects:

- **enable-device**: A modern web application for device management and volunteer coordination.
- **functions/backend**: A Node.js backend with serverless functions for business logic, authentication, and integrations.

---

## 1. enable-device

A Vite + React TypeScript web application for managing device requests, volunteer activities, and administrative tasks.

### Features
- User authentication (login, registration, password management)
- Device request and tracking system
- Volunteer dashboard and profile management
- Admin dashboard with statistics, logs, and request management
- Timeline and shipment tracking
- Responsive layout and modern UI
- Integration with Firebase for authentication and data storage

### Structure
- `src/pages/` — Main pages (Home, Login, Register, Admin, Volunteer, etc.)
- `src/components/` — UI components (tables, layouts, timelines)
- `src/helpers/` — Utility functions and data (provinces, status helpers)
- `src/services/` — Security and API integrations (reCAPTCHA, secure calls)
- `src/shared/` — Shared types and utilities

### Getting Started
1. `cd enable-device`
2. `npm install`
3. `npm run dev` to start the development server

---

## 2. functions/backend

A Node.js backend (intended for serverless deployment, e.g., Firebase Functions) providing API endpoints and business logic.

### Features
- User registration and authentication logic
- Device request creation and management
- Volunteer assignment and management
- Security features (rate limiting, reCAPTCHA, security logs)
- Shipment request handling
- Utility scripts for data processing

### Structure
- `src/` — TypeScript source code (auth, device, security, shipments, volunteer)
- `lib/` — Compiled JavaScript output (mirrors `src/` structure)
- `package.json` — Backend dependencies and scripts

### Getting Started
1. `cd functions/backend`
2. `npm install`
3. Deploy or run locally as per your serverless platform (e.g., Firebase Functions)

---

## License

- **Code**: Licensed under the [MIT License](LICENSE).
- **Documentation** (including this README): Licensed under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/).
