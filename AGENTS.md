<!-- BEGIN:nextjs-agent-rules -->
# Agents.md

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## Project

Arrows Church Management System (ACMS)

A modern church workforce management platform that manages members, departments, attendance, events, leaderboards, and reporting through secure location-based attendance.

---

## Project Goals

The project prioritizes:

1. Maintainability
2. Security
3. Type safety
4. Accessibility
5. Performance
6. Clean Architecture

---

## Development Principles

- Prefer simple solutions over clever ones.
- Follow SOLID principles where appropriate.
- Avoid unnecessary dependencies.
- Never duplicate business logic.
- Keep functions focused on a single responsibility.
- Write readable code before optimizing.

---

## Frontend

Stack:

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui

Rules:

- Prefer Server Components unless client-side state is required.
- Minimize client-side JavaScript.
- Reusable UI belongs in `components/`.
- Feature-specific code belongs together.

---

## Backend

Stack:

- NestJS
- PostgreSQL
- Drizzle ORM

Rules:

- Business logic belongs in services.
- Controllers should remain thin.
- Validate all inputs.
- Never trust client-provided data.

---

## Database

Rules:

- Use UUID primary keys.
- Never delete important records permanently.
- Use foreign keys.
- Add indexes where necessary.
- Use migrations for every schema change.

---

## Authentication

- JWT Access Token
- Refresh Token
- Argon2 password hashing

Never store plain-text passwords.

---

## Security

Always:

- Validate user input.
- Check permissions.
- Log important actions.
- Protect sensitive routes.

Never:

- Commit secrets.
- Hardcode credentials.
- Trust browser validation.

---

## Git

Commit messages:

feat:
fix:
docs:
refactor:
test:
chore:

Example:

feat: implement attendance check-in endpoint

---

## Documentation

Documentation belongs in `/docs`.

Current documents:

- PRD.md
- SRS.md
- API.md
- ERD.md
- ROADMAP.md

---

## Coding Style

- TypeScript strict mode.
- Use meaningful variable names.
- Avoid `any`.
- Keep files reasonably small.
- Prefer composition over inheritance.

---

## Testing

Every feature should include:

- Unit tests
- Integration tests where appropriate
- Manual verification

---

## Important

This project is intended to be production-quality.

When suggesting code:

- Explain trade-offs.
- Prefer long-term maintainability.
- Avoid overengineering.
<!-- END:nextjs-agent-rules -->
