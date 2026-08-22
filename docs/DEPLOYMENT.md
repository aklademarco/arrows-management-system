# VPS Deployment & CI/CD Runbook

Production hosting for ACMS on a single small VPS (e.g. HostHatch NVMe 2 GB,
Ubuntu 24.04 LTS), with GitHub Actions for CI/CD.

This document supersedes nothing in `DATABASE.md` — it implements its
"Moving to a VPS" section concretely.

---

## 1. Topology

```
Internet ──▶ :443 Caddy (auto-TLS)
                ├── /api/v1/* ──▶ 127.0.0.1:4000  (NestJS API, systemd)
                └── /*        ──▶ 127.0.0.1:3000  (Next.js web, systemd)

Postgres 17 (Docker) ──▶ 127.0.0.1:<POSTGRES_PORT>   ← never exposed publicly
API ──▶ Postgres over loopback
Humans/CI ──▶ Postgres ONLY via SSH tunnel
```

Decisions and why:

| Decision | Rationale |
| --- | --- |
| One VPS hosts DB + API + web | Single church scale; matches `DATABASE.md`; ~$5/mo |
| Docker **only** for Postgres | Reuses existing `docker-compose.yml`; apps run as plain systemd services — fewer moving parts than full containerization |
| Path-based routing (`/api/v1`) under one domain | The API already sets the global prefix `api/v1` (`apps/api/src/main.ts`); keeps `CORS_ORIGIN` and `WEB_URL` identical and simple |
| Caddy instead of Nginx | Automatic Let's Encrypt issuance/renewal; ~10-line config |
| systemd instead of pm2 | Zero extra dependencies; logs land in journald |
| Builds happen in CI, never on the VPS | `next build` can OOM-kill on 2 GB RAM |

---

## 2. Server provisioning (one-time)

```bash
# As root on a fresh Ubuntu 24.04 box
adduser acms                 # app owner: runs services, owns /opt/acms
adduser deploy               # CI login: owns nothing, writes only /opt/acms/releases
usermod -aG docker acms      # manage the postgres container

apt update && apt upgrade -y
apt install -y ca-certificates curl git ufw fail2ban unattended-upgrades \
               age rclone jq

# --- SSH hardening ---
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' \
  /etc/ssh/sshd_config.d/*.conf /etc/ssh/sshd_config 2>/dev/null || true
printf 'PasswordAuthentication no\nPermitRootLogin no\n' \
  > /etc/ssh/sshd_config.d/99-hardening.conf
systemctl restart ssh

# Copy your laptop pubkey BEFORE disabling password auth!
install -d -m 700 -o acms -g acms /home/acms/.ssh
cp /home/deploy/.ssh/authorized_keys /home/acms/.ssh/  # after keys exist

# --- Firewall: 22/80/443 only. Note there is NO rule for 5432/5433. ---
ufw default deny incoming
ufw allow OpenSSH
ufw allow 80,443/tcp
ufw enable

systemctl enable --now fail2ban unattended-upgrades

# --- Swap safety net for the 2 GB box ---
fallocate -l 2G /swapfile && chmod 600 /swapfile \
  && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
sysctl vm.swappiness=10
echo 'vm.swappiness=10' > /etc/sysctl.d/99-acms.conf
```

Install Docker (official convenience script is fine):

```bash
curl -fsSL https://get.docker.com | sh
```

Install Node 22 LTS + pnpm (as `acms`):

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && apt install -y nodejs
corepack enable && corepack prepare pnpm@11.15.1 --activate
node -v   # >= 22 (repo requires >= 20.9)
```

---

## 3. Directory layout on the VPS

```
/opt/acms/
├── bin/                  # backup.sh, deploy helpers
├── releases/
│   ├── <git-sha>/        # immutable release trees
│   └── <git-sha>/
├── current -> releases/<git-sha>   # symlink flipped by deploys
└── shared/
    └── .env              # real secrets, chmod 600, owned by acms — never overwritten
```

The API resolves migrations relative to itself (`apps/api/scripts/migrate.cjs`),
and the web app optionally loads the workspace-root `.env`. Keeping
`shared/.env` outside releases means secrets survive every deploy.

---

## 4. The database: running it, and "exposing" it correctly

### 4.1 Run Postgres bound to loopback only

Use the repo's compose file on the server. It already binds
`127.0.0.1:${POSTGRES_PORT:-5432}:5432` (`docker-compose.yml:11`) — keep that.

Maintain the server-side `/opt/acms/shared/.env` with the Postgres variables
**plus** the app variables (see §8). Then:

```bash
sudo -u acms docker compose -f /opt/acms/current/docker-compose.yml \
  --env-file /opt/acms/shared/.env up -d postgres
```

For production, generate a strong password — do **not** ship
`arrows_local_password`:

```bash
openssl rand -base64 32   # → POSTGRES_PASSWORD
```

### 4.2 What "expose the DB" must mean here

**Expose it to exactly one consumer: the API, over loopback.**
`DATABASE_URL=postgresql://acms_app:<password>@127.0.0.1:5432/arrows_cms`.

Everything else reaches the DB through an SSH tunnel — admins doing `psql`,
`pg_dump`, or a one-off migration from a laptop:

```bash
ssh -N -L 5433:127.0.0.1:5432 deploy@acms.example.com
# in another terminal:
psql "postgresql://acms_app:<password>@127.0.0.1:5433/arrows_cms"
pg_dump --format=custom --file=local-copy.backup \
  "postgresql://acms_app:<password>@127.0.0.1:5433/arrows_cms"
```

CI does not need the tunnel at all — deploys execute migrations *on* the server
(§7.3). Never add a `ufw allow 5432`. Verify exposure honestly:

```bash
ss -ltnp | grep 5432          # must show 127.0.0.1:5432, NOT 0.0.0.0
ufw status                    # no postgres rules
```

If you later split DB onto its own host, do **not** open 5432 either — put
WireGuard between the boxes and point `DATABASE_URL` at the WG address.

---

## 5. systemd units

`/etc/systemd/system/acms-api.service`:

```ini
[Unit]
Description=ACMS API (NestJS)
After=docker.service network-online.target
Wants=network-online.target

[Service]
User=acms
Group=acms
WorkingDirectory=/opt/acms/current/apps/api
EnvironmentFile=/opt/acms/shared/.env
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/main
Restart=always
RestartSec=3
NoNewPrivileges=true
ProtectSystem=strict
ReadWritePaths=/opt/acms/current/apps/api

[Install]
WantedBy=multi-user.target
```

`/etc/systemd/system/acms-web.service`:

```ini
[Unit]
Description=ACMS Web (Next.js)
After=network-online.target
Wants=network-online.target

[Service]
User=acms
Group=acms
WorkingDirectory=/opt/acms/current/apps/web
EnvironmentFile=/opt/acms/shared/.env
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/node /opt/acms/current/node_modules/.bin/next start
Restart=always
RestartSec=3
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
```

Enable both:

```bash
systemctl daemon-reload
systemctl enable --now acms-api acms-web
journalctl -u acms-api -f     # logs
```

---

## 6. Reverse proxy (Caddy)

`/etc/caddy/Caddyfile`:

```caddy
acms.example.com {
    encode gzip

    handle /api/v1/* {
        reverse_proxy 127.0.0.1:4000
    }

    handle {
        reverse_proxy 127.0.0.1:3000
    }
}
```

Caddy obtains/renews certificates automatically. DNS: point an A record at the
VPS before first start.

Resulting URLs:

| Var | Value |
| --- | --- |
| `WEB_URL` | `https://acms.example.com` |
| `CORS_ORIGIN` | `https://acms.example.com` |
| Public API base | `https://acms.example.com/api/v1` |

Note `validate-environment.ts` hard-fails boot unless `CORS_ORIGIN`/`WEB_URL`
are `https://` and `JWT_ACCESS_SECRET` is ≥ 32 chars — the values above comply.

---

## 7. GitHub Actions CI/CD

Two workflows: PR quality gate, and tag-triggered deploy.

### 7.1 `.github/workflows/ci.yml` — pull requests

```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4       # reads packageManager from package.json
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test                   # jest units (db is mocked in specs)
      - run: pnpm build                  # proves nest + next compile
```

### 7.2 `.github/workflows/deploy.yml` — tagged releases

```yaml
name: Deploy
on:
  push:
    tags: ["v*"]

concurrency:
  group: production-deploy
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint && pnpm typecheck && pnpm test
      - run: pnpm build                  # apps/api/dist + apps/web/.next built OFF-box

      # Clean source tree (no .git, no node_modules) + build outputs
      - name: Assemble release tree
        run: |
          mkdir -p /tmp/rel
          git archive HEAD | tar -x -C /tmp/rel
          rsync -a --exclude node_modules \
            apps/api/dist apps/api/drizzle apps/api/scripts /tmp/rel/apps/api/

      - name: Upload release
        uses: easingthemes/ssh-deploy@v5
        env:
          SSH_PRIVATE_KEY: ${{ secrets.DEPLOY_SSH_KEY }}
          ARGS: "-rlgoDz --delete"
          SOURCE: "/tmp/rel/"
          REMOTE_HOST: ${{ secrets.VPS_HOST }}
          REMOTE_USER: deploy
          TARGET: "/opt/acms/incoming/"

  activate:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Migrate, switch, restart, health-gate (with auto-rollback)
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: deploy
          key: ${{ secrets.DEPLOY_SSH_KEY }}
          script: |
            set -euo pipefail
            SHA="${GITHUB_SHA}"
            PREV=$(readlink -f /opt/acms/current || true)
            sudo /opt/acms/bin/release.sh "$SHA"
            sudo /opt/acms/bin/activate.sh "$SHA" "$PREV"
```

`/opt/acms/bin/release.sh` (on the VPS, owned by root, executed via sudoers by
`deploy`):

```bash
#!/usr/bin/env bash
set -euo pipefail
SHA="$1"
DEST="/opt/acms/releases/$SHA"
mv /opt/acms/incoming "$DEST"
chown -R acms:acms "$DEST"
sudo -u acms bash -lc "cd '$DEST' && pnpm install --frozen-lockfile --prod"
sudo -u acms bash -lc "cd '$DEST' && pnpm db:migrate"   # reads shared .env? see §7.3
```

`/opt/acms/bin/activate.sh` — symlink flip + restart + health gate + rollback:

```bash
#!/usr/bin/env bash
set -euo pipefail
SHA="$1"; PREV="${2:-}"
ln -sfn "/opt/acms/releases/$SHA" /opt/acms/current
systemctl restart acms-api acms-web
for i in $(seq 1 30); do
  if curl -fsS https://acms.example.com/api/v1/health | grep -q connected; then
    echo "Deploy healthy"; exit 0
  fi
  sleep 2
done
echo "Health check failed — rolling back"
if [ -n "$PREV" ]; then ln -sfn "$PREV" /opt/acms/current; fi
systemctl restart acms-api acms-web
exit 1
```

Sudoers for the deploy user (`/etc/sudoers.d/deploy-acms`):

```
deploy ALL=(root) NOPASSWD: /opt/acms/bin/release.sh, /opt/acms/bin/activate.sh
```

### 7.3 How the remote migration finds `DATABASE_URL`

`apps/api/scripts/migrate.cjs` accepts `DATABASE_URL` directly, falling back to
the workspace-root `.env`. Releases have no root `.env` (secrets live in
`shared/`). In `release.sh`, export it explicitly instead:

```bash
set -a; source /opt/acms/shared/.env; set +a
sudo -u acms -E bash -lc "cd '$DEST' && pnpm db:migrate"
```

The runner already takes a `pg_advisory_lock`
(`migrate.cjs:52`) and records applied files in `schema_migrations`, so reruns
and concurrent deploys are idempotent and race-free.

### 7.4 Required repository secrets

| Secret | Value |
| --- | --- |
| `DEPLOY_SSH_KEY` | Private half of a dedicated ed25519 deploy keypair |
| `VPS_HOST` | `acms.example.com` |

One-time key setup:

```bash
ssh-keygen -t ed25519 -f acms_deploy_key -C "github-actions-deploy"
# pub key → /home/deploy/.ssh/authorized_keys on the VPS
ssh-keyscan acms.example.com >> ~/.ssh/known_hosts   # pin on runners if desired
```

Tag to ship: `git tag v0.1.0 && git push origin v0.1.0`.

---

## 8. Production environment file

`/opt/acms/shared/.env` (chmod 600, owner `acms`). Everything here is required
by `validate-environment.ts` in production:

```bash
NODE_ENV=production
API_PORT=4000

# Database (loopback only — see §4)
POSTGRES_DB=arrows_cms
POSTGRES_USER=acms_app
POSTGRES_PASSWORD=<openssl rand -base64 32>
POSTGRES_PORT=5432
DATABASE_URL=postgresql://acms_app:<same-password>@127.0.0.1:5432/arrows_cms

# URLs (https enforced by validate-environment.ts)
CORS_ORIGIN=https://acms.example.com
WEB_URL=https://acms.example.com
API_URL=https://acms.example.com/api/v1

# Auth
JWT_ACCESS_SECRET=<openssl rand -base64 48>   # ≥32 chars, rotate quarterly

# Mail (provider SMTP, e.g. Resend/Postmark relay)
SMTP_HOST=<relay-host>
SMTP_PORT=587
SMTP_FROM=Arrows CMS <no-reply@your-domain.org>

# Media
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Optional SMS (enables the 30s dispatch poller)
SMS_ENABLED=true
MOOLRE_SMS_VAS_KEY=<Moolre SMS service VAS key>
MOOLRE_SENDER_ID=ARROWS            # ≤11 chars, enforced
# Integer Moolre reports for delivered messages; verify with one test send
# against /open/sms/status before launch (docs do not publish the legend).
MOOLRE_DELIVERED_STATUS=2
DEFAULT_CHURCH_ID=<uuid-of-church>
```

First boot after migrating:

```bash
cd /opt/acms/current
set -a; source /opt/acms/shared/.env; set +a
pnpm admin:seed     # INITIAL_ADMIN_EMAIL / INITIAL_ADMIN_PASSWORD come from .env
```

---

## 9. Backups (non-negotiable)

`/opt/acms/bin/backup.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
STAMP=$(date +%F)
DIR=/var/backups/acms
mkdir -p "$DIR"
source /opt/acms/shared/.env

docker exec arrows-cms-postgres-1 \
  pg_dump --format=custom "$DATABASE_URL" > "$DIR/acms_$STAMP.dump"

# Encrypt with age (recipient key generated once: `age-keygen > /root/backup_age_key.txt`,
# share only the .pub half with whoever must be able to restore)
age -R /root/backup_age_key.pub -o "$DIR/acms_$STAMP.dump.age" \
  "$DIR/acms_$STAMP.dump"
rm "$DIR/acms_$STAMP.dump"

# Off-box: B2/S3/GDrive configured once via `rclone config`
rclone copy "$DIR/acms_$STAMP.dump.age" acms-backups:postgres/ --max-age 48h
find "$DIR" -name '*.age' -mtime +14 -delete

# Dead-man's ping (free healthchecks.io check)
curl -fsS -m 10 "https://hc-ping.com/<backup-check-uuid>"
```

Crontab (`crontab -e` as root):

```cron
30 2 * * * /opt/acms/bin/backup.sh >> /var/log/acms-backup.log 2>&1
```

Retention at the provider: keep 7 daily, 4 weekly, 6 monthly
(`rclone delete --min-age 30d` on a weekly cron, or lifecycle rules).

**A backup that hasn't been restored is a rumour.** Quarterly: download the
newest dump, restore into a scratch Postgres, boot the API against it, log in.
Document the result.

---

## 10. Monitoring

- Uptime: healthchecks.io (or UptimeRobot) pinging
  `GET https://acms.example.com/api/v1/health` every 5 min — the endpoint
  returns `database: connected` only when Postgres answers (`select 1`).
- Disk pressure is the realistic killer on 10 GB: weekly alert at 75%
  (`ncdu`/`df` cron mailer, or healthchecks’ integration).
- Logs: `journalctl -u acms-api --since today`; Docker Postgres logs via
  `docker compose logs postgres`.
- Review `audit_logs` growth occasionally — jsonb columns grow fastest.

Housekeeping to keep the 10 GB disk sane:

```dockerfile
# docker system prune monthly; pnpm store prune after installs;
# keep only the last 3 entries in /opt/acms/releases
ls -1dt /opt/acms/releases/*/ | tail -n +4 | xargs rm -rf
```

---

## 11. Rollback

Application code: flip the symlink back and restart —
`activate.sh` already automates this on failed health checks; manually:

```bash
ln -sfn /opt/acms/releases/<previous-sha> /opt/acms/current
systemctl restart acms-api acms-web
```

Database: **migrations are forward-only** (`schema_migrations` never forgets).
Rolling back code does not roll back schema. A bad migration requires a new
forward-fix migration, or a point-in-time restore from backups (last resort —
data loss window applies). This is why §7 gates deploys on health checks.

---

## 12. Go-live checklist

- [ ] DNS A record → VPS; Caddy serving valid certs for both routes
- [ ] `ss -ltnp`: Postgres on `127.0.0.1` only; `ufw status`: 22/80/443 only
- [ ] Password auth disabled for SSH; root login disabled
- [ ] `shared/.env` chmod 600; secrets generated with `openssl rand`, none reused from `.env.example`
- [ ] `pnpm db:migrate` applied cleanly; `admin:seed` created the initial admin
- [ ] `GET /api/v1/health` green through Caddy (real TLS)
- [ ] Login + geofence check-in verified end-to-end from a phone
- [ ] First `backup.sh` ran; dump restored successfully into scratch DB
- [ ] healthchecks.io checks active for uptime + backup
- [ ] Deploy pipeline exercised twice (tag → healthy release; second tag → rollback drill)

---

## 13. When to revisit this setup

Move beyond this topology when any of these become true:

1. Second church tenant appears (multi-tenancy pressure) → managed Postgres
   (Neon/Supabase) or a second box becomes worth the cost.
2. No one on the team can operate the VPS → managed platform wins regardless
   of price.
3. Downtime during Sunday service becomes intolerable → HA Postgres + blue-green
   deploys; budget changes accordingly.
