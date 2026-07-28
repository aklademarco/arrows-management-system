const { readFile } = require('node:fs/promises');
const { resolve } = require('node:path');
const { hash } = require('argon2');
const { Client } = require('pg');

async function loadEnvironment() {
  const environment = { ...process.env };
  try {
    const contents = await readFile(
      resolve(__dirname, '..', '..', '..', '.env'),
      'utf8',
    );
    for (const line of contents.split(/\r?\n/)) {
      const match = line.match(/^([^#=\s]+)=(.*)$/);
      if (match && environment[match[1]] === undefined) {
        environment[match[1]] = match[2].trim();
      }
    }
  } catch (error) {
    if (!error || error.code !== 'ENOENT') {
      throw error;
    }
  }
  return environment;
}

function validatePassword(password) {
  return (
    password.length >= 12 &&
    password.length <= 128 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

async function seedAdmin() {
  const environment = await loadEnvironment();
  const connectionString = environment.DATABASE_URL;
  const email = environment.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
  const password = environment.INITIAL_ADMIN_PASSWORD;
  const churchId = environment.DEFAULT_CHURCH_ID;

  if (!connectionString || !churchId || !email || !password) {
    throw new Error(
      'DATABASE_URL, DEFAULT_CHURCH_ID, INITIAL_ADMIN_EMAIL, and INITIAL_ADMIN_PASSWORD are required.',
    );
  }
  if (!validatePassword(password)) {
    throw new Error(
      'INITIAL_ADMIN_PASSWORD must be 12-128 characters and contain uppercase, lowercase, number, and special characters.',
    );
  }

  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query('BEGIN');
    const existing = await client.query(
      `SELECT u.id,
              u.email_verified_at,
              EXISTS (
                SELECT 1
                FROM user_roles ur
                JOIN roles r ON r.id = ur.role_id
                WHERE ur.user_id = u.id AND r.name = 'SUPER_ADMIN'
              ) AS is_super_admin
       FROM users u
       WHERE lower(u.email) = $1
       FOR UPDATE`,
      [email],
    );

    if (existing.rowCount > 0) {
      if (existing.rows[0].is_super_admin) {
        await client.query('COMMIT');
        process.stdout.write(`Super Administrator already configured: ${email}\n`);
        return;
      }
      if (!existing.rows[0].email_verified_at) {
        throw new Error(
          'The existing account must verify its email before it can be promoted.',
        );
      }

      await client.query(
        `UPDATE users
         SET account_status = 'ACTIVE', updated_at = now()
         WHERE id = $1`,
        [existing.rows[0].id],
      );
      await client.query(
        `INSERT INTO user_roles (user_id, role_id)
         SELECT $1, id FROM roles WHERE name = 'SUPER_ADMIN'
         ON CONFLICT (user_id, role_id) DO NOTHING`,
        [existing.rows[0].id],
      );
      await client.query('COMMIT');
      process.stdout.write(
        `Promoted existing account to Super Administrator: ${email}\n`,
      );
      return;
    }

    const passwordHash = await hash(password, {
      type: 2,
      memoryCost: 19_456,
      timeCost: 2,
      parallelism: 1,
    });
    const user = await client.query(
      `INSERT INTO users (
         church_id, email, password_hash, account_status, email_verified_at
       )
       VALUES ($1, $2, $3, 'ACTIVE', now())
       RETURNING id`,
      [churchId, email, passwordHash],
    );
    const userId = user.rows[0].id;

    await client.query(
      `INSERT INTO member_profiles (user_id, first_name, last_name)
       VALUES ($1, 'Bismark', 'Marco')`,
      [userId],
    );
    await client.query(
      `INSERT INTO user_roles (user_id, role_id)
       SELECT $1, id FROM roles WHERE name = 'SUPER_ADMIN'`,
      [userId],
    );
    await client.query('COMMIT');
    process.stdout.write(`Created Super Administrator: ${email}\n`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

seedAdmin().catch((error) => {
  process.stderr.write(
    `Super Administrator bootstrap failed: ${
      error instanceof Error ? error.message : String(error)
    }\n`,
  );
  process.exitCode = 1;
});
