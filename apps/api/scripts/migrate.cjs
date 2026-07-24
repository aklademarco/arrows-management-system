const { readdir, readFile } = require('node:fs/promises');
const { resolve } = require('node:path');
const { Client } = require('pg');

async function getDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  try {
    const environmentFile = await readFile(
      resolve(__dirname, '..', '..', '..', '.env'),
      'utf8',
    );
    const databaseUrlLine = environmentFile
      .split(/\r?\n/)
      .find((line) => line.startsWith('DATABASE_URL='));
    return databaseUrlLine?.slice('DATABASE_URL='.length).trim();
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'ENOENT'
    ) {
      return undefined;
    }
    throw error;
  }
}

async function migrate() {
  const connectionString = await getDatabaseUrl();
  if (!connectionString) {
    throw new Error('DATABASE_URL is required');
  }

  const migrationsDirectory = resolve(__dirname, '..', 'drizzle');
  const migrationFiles = (await readdir(migrationsDirectory))
    .filter((file) => file.endsWith('.sql'))
    .sort();
  const client = new Client({ connectionString });

  await client.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await client.query('SELECT pg_advisory_lock($1)', [73920418]);

    for (const migrationFile of migrationFiles) {
      const existing = await client.query(
        'SELECT 1 FROM schema_migrations WHERE name = $1',
        [migrationFile],
      );
      if (existing.rowCount > 0) {
        process.stdout.write(`Already applied: ${migrationFile}\n`);
        continue;
      }

      const sql = await readFile(
        resolve(migrationsDirectory, migrationFile),
        'utf8',
      );
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [
          migrationFile,
        ]);
        await client.query('COMMIT');
        process.stdout.write(`Applied: ${migrationFile}\n`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
  } finally {
    await client.query('SELECT pg_advisory_unlock($1)', [73920418]);
    await client.end();
  }
}

migrate().catch((error) => {
  process.stderr.write(
    `Database migration failed: ${
      error instanceof Error ? error.message : String(error)
    }\n`,
  );
  process.exitCode = 1;
});
