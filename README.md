# Arrows Church Management System (ACMS)

A modern church management platform designed for **Arrows Youth Ministry** to streamline attendance, department management, event coordination, and volunteer engagement through secure location-based check-ins.

> **Project Status:** 🚧 Planning & Development

---

## Overview

The **Arrows Church Management System (ACMS)** is a web-based platform built to help **Arrows Youth Ministry** efficiently manage its members, workers, departments, and church activities.

Rather than relying on paper attendance sheets and manual record-keeping, the platform provides a secure digital solution for managing attendance, departments, events, member engagement, and operational reporting.

The long-term vision is to build a complete church management platform that can grow from serving the Arrows Youth Ministry to supporting the entire church, including multiple ministries, departments, and future branches.

---

## Core Features

### Authentication & User Management

* Public account registration
* Administrator approval workflow
* Role-based access control (RBAC)
* Secure authentication
* User profile management

### Member Management

* Member profiles
* Department assignment
* Leadership roles
* Membership status management

### Department Management

* Create departments
* Assign department leaders
* Manage department members
* Department analytics

### Event Management

* Create church services
* Youth meetings
* Special events
* Attendance windows
* Geofence configuration

### Attendance

* Browser geolocation
* Secure location verification
* Early / On-Time / Late attendance
* Manual attendance override
* Attendance history

### Leaderboards

* Individual rankings
* Department rankings
* Attendance streaks
* Achievement system (planned)

### Reporting

* Attendance reports
* Department reports
* Monthly summaries
* CSV/PDF export (planned)

---

## Technology Stack

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* shadcn/ui

### Backend

* NestJS
* PostgreSQL
* Drizzle ORM
* JWT Authentication
* Docker

---

## Project Structure

```text
.
├── apps/
│   ├── web/                 # Next.js application
│   └── api/                 # NestJS REST API
├── packages/
│   └── shared/              # Shared TypeScript contracts
├── docs/
├── docker/
├── .github/
├── AGENTS.md
├── README.md
├── package.json
├── pnpm-workspace.yaml
└── docker-compose.yml
```

---

## Documentation

Project documentation is located in the `docs/` directory.

Current documents include the product requirements, software requirements,
database design and DBML schema, API specification, architecture, security
model, and development roadmap.

---

## Getting Started

Prerequisites:

* Node.js 20.9 or newer
* pnpm 11

Install all workspace dependencies from the repository root:

```bash
pnpm install
```

Start both applications:

```bash
pnpm dev
```

Or start either application independently:

```bash
pnpm dev:web
pnpm dev:api
```

The web application runs at `http://localhost:3000`. The API runs at
`http://localhost:4000`.

Run repository checks:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```
```

---

## Roadmap

* [x] Project planning
* [x] Product Requirements Document (PRD)
* [x] Software Requirements Specification (SRS)
* [x] Database Design
* [x] Backend Architecture
* [ ] Authentication Module
* [ ] Member Management
* [ ] Department Management
* [ ] Event Management
* [ ] Attendance System
* [ ] Leaderboards
* [ ] Reporting
* [ ] Production Deployment

---

## Contributing

This project is currently under active development. Contributions, suggestions, and issue reports are welcome once the project reaches its first public release.

---

## License

This project is licensed under the MIT License.
