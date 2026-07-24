# Database Operations

## Local development

Development uses PostgreSQL 17 in Docker. The database listens only on
`127.0.0.1`, so it is not exposed to other devices on the network.

```bash
cp .env.example .env
pnpm db:start
pnpm db:migrate
```

The named Docker volume `arrows_cms_postgres_data` preserves data when the
container is stopped or recreated.

Check the container and API:

```bash
docker compose ps
curl http://localhost:4000/api/v1/health
```

Stop PostgreSQL without deleting its data:

```bash
pnpm db:stop
```

Do not run `docker compose down --volumes` unless the local database should be
permanently erased.

## Migrations

`pnpm db:migrate` applies unapplied SQL files from `apps/api/drizzle` in
filename order. Applied filenames are recorded in `schema_migrations`.
Migrations are transactional and protected by a PostgreSQL advisory lock.

Never edit a migration after it has been applied to a shared or production
database. Add a new migration instead.

## Moving to a VPS

The application does not depend on Neon. When a VPS is available:

1. Install PostgreSQL on the VPS or run it in a private Docker network.
2. Create a dedicated database and application user with a strong password.
3. Keep PostgreSQL port `5432` blocked from the public internet.
4. Set the production `DATABASE_URL` in the API environment.
5. Run `pnpm db:migrate` from the deployed application.
6. Configure daily encrypted backups to storage outside the VPS.
7. Test database restoration before accepting real member data.

If the API and database share one VPS, connect over `127.0.0.1` or a private
Docker network. If they use different servers, require TLS and permit network
access only from the API server.

## Backup example

This creates a custom-format backup:

```bash
pg_dump --format=custom --file=arrows_cms.backup "$DATABASE_URL"
```

Production backups should be automated, encrypted, retained outside the VPS,
and periodically restored into a temporary database to confirm they work.
