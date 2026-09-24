# VPS deployment with Docker and NGINX

ACMS runs on one Ubuntu VPS with this topology:

```text
Internet -> NGINX :80/:443 -> 127.0.0.1:3000 (Next.js)
                           -> 127.0.0.1:4000 (NestJS /api/v1)
Docker                         api -> postgres:5432
```

Only NGINX is public. PostgreSQL, the API, and the web server are not exposed
to the internet. Certbot obtains and renews the TLS certificate.

## Requirements

- Ubuntu 24.04 VPS with at least 2 GB RAM
- A domain with an `A` record pointing to the VPS
- Verified Resend sending domain and API key
- Cloudinary credentials
- Optional Moolre credentials if SMS is enabled

## 1. Prepare the server

Run as root:

```bash
apt update && apt upgrade -y
apt install -y ca-certificates curl nginx certbot python3-certbot-nginx \
  ufw fail2ban unattended-upgrades
curl -fsSL https://get.docker.com | sh

adduser --disabled-password --gecos "" deploy
usermod -aG docker deploy
install -d -o deploy -g deploy -m 750 /opt/arrows

ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

systemctl enable --now docker nginx fail2ban unattended-upgrades
```

Install the deployment public key in `/home/deploy/.ssh/authorized_keys`.
Confirm key-based login in another terminal before disabling SSH password and
root login.

For a 2 GB VPS, add swap:

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

## 2. Production environment

Copy `.env.production.example` to `/opt/arrows/.env`, replace every
placeholder, then protect it:

```bash
chown deploy:deploy /opt/arrows/.env
chmod 600 /opt/arrows/.env
```

Generate strong secrets on the server:

```bash
openssl rand -base64 36  # POSTGRES_PASSWORD
openssl rand -base64 48  # JWT_ACCESS_SECRET
```

Important values:

```dotenv
# EMAIL_FROM must use a domain shown as verified in the Resend dashboard.
EMAIL_FROM=Arrows Church <no-reply@your-verified-domain.com>
APP_DOMAIN=church.example.com
WEB_URL=https://church.example.com
CORS_ORIGIN=https://church.example.com
API_URL=http://api:4000/api/v1
POSTGRES_PORT=5432
```

`APP_DOMAIN` has no protocol. The API URL is intentionally private because
Next.js server actions call NestJS over the Docker network.

## 3. Configure NGINX and HTTPS

Copy `deploy/nginx/arrows.conf` to the VPS and replace `YOUR_DOMAIN`:

```bash
sed 's/YOUR_DOMAIN/church.example.com/g' deploy/nginx/arrows.conf \
  > /etc/nginx/sites-available/arrows
ln -s /etc/nginx/sites-available/arrows /etc/nginx/sites-enabled/arrows
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

After DNS points to the VPS, obtain TLS:

```bash
certbot --nginx -d church.example.com --redirect
certbot renew --dry-run
```

The NGINX configuration preserves `/api/v1/...` when proxying to NestJS and
routes all other requests to Next.js. Uploads are limited to 15 MB.

## 4. First application deployment

Copy `docker-compose.yml` to `/opt/arrows/docker-compose.yml`. If the GHCR
packages are private, log in once as `deploy` using a read-only package token:

```bash
docker login ghcr.io
```

Start the application:

```bash
cd /opt/arrows
docker compose --env-file .env --profile production pull
docker compose --env-file .env --profile production up -d
docker compose --env-file .env --profile production ps
```

The API image runs pending SQL migrations before NestJS starts. Migration
execution uses a PostgreSQL advisory lock and is safe to retry.

Verify locally and publicly:

```bash
curl --fail http://127.0.0.1:4000/api/v1/health
curl --fail https://church.example.com/api/v1/health
docker compose --env-file .env --profile production logs --tail=100 api web
```

## 5. Initial administrator

Temporarily add `INITIAL_ADMIN_EMAIL` and `INITIAL_ADMIN_PASSWORD` to the
server `.env`, then run:

```bash
cd /opt/arrows
docker compose --env-file .env --profile production run --rm \
  api node scripts/seed-admin.cjs
```

Remove `INITIAL_ADMIN_PASSWORD` immediately afterward.

## 6. GitHub Actions deployment

The repository contains CI and tag-based deployment workflows. Configure:

| GitHub secret | Value |
| --- | --- |
| `VPS_HOST` | VPS IP or SSH hostname |
| `VPS_USER` | `deploy` |
| `VPS_SSH_KEY` | Private deployment key |
| `VPS_KNOWN_HOSTS` | Verified SSH host-key entry |
| `APP_URL` | `https://church.example.com` |

Ensure `/opt/arrows` belongs to `deploy`. A version tag builds and publishes
both images, uploads the Compose file, activates the exact tag, and checks the
public health endpoint:

```bash
git tag v0.1.0
git push origin v0.1.0
```

## 7. Rollback

Redeploy the preceding image tag:

```bash
cd /opt/arrows
IMAGE_TAG=v0.0.9 docker compose --env-file .env --profile production pull
IMAGE_TAG=v0.0.9 docker compose --env-file .env --profile production up -d
```

Database migrations are forward-only; repair a faulty migration with a new
migration unless a verified database restore is required.

## 8. Backups

Create a daily PostgreSQL dump and copy an encrypted version off the VPS:

```bash
install -d -m 700 /var/backups/arrows
docker exec arrows-postgres pg_dump -U arrows -d arrows_cms -Fc \
  > "/var/backups/arrows/arrows_$(date +%F).dump"
```

Use the actual database user/name from `.env`. Production backups need
encryption, off-server storage, retention rules, monitoring, and a quarterly
test restore.

## 9. Useful commands

```bash
docker compose --env-file .env --profile production ps
docker compose --env-file .env --profile production logs -f api
docker compose --env-file .env --profile production restart web api
docker compose --env-file .env --profile production pull
docker compose --env-file .env --profile production up -d --remove-orphans
nginx -t && systemctl reload nginx
```

Local development continues to start only PostgreSQL because web and API use
the `production` profile:

```bash
docker compose up -d
pnpm dev
```

## 10. Go-live checklist

- DNS points to the VPS and Certbot serves a valid certificate.
- Only ports 22, 80, and 443 are publicly reachable.
- PostgreSQL listens only on `127.0.0.1` and the Docker network.
- `/opt/arrows/.env` is mode `600` with no placeholder secrets.
- Migrations and initial admin creation complete successfully.
- Member and administrator login work through the public domain.
- Phone geolocation and attendance check-in work over HTTPS.
- Resend, Cloudinary, and optional Moolre integrations are tested.
- A database backup has been restored successfully.
- External monitoring checks `/api/v1/health` every five minutes.
