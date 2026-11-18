import { randomUUID } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { count, eq } from 'drizzle-orm';
import * as schema from '../database/schema';
import type { Database } from '../database/database.module';
import type { MembersRepository } from '../members/members.repository';
import { AnnouncementsRepository } from './announcements.repository';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { ListAnnouncementsDto } from './dto/list-announcements.dto';
import { PublisherAccessService } from './publisher-access.service';

/** Opt-in: runs against a throwaway schema in this PostgreSQL database. */
const databaseUrl =
  process.env.EVENTS_TEST_DATABASE_URL ?? process.env.FEED_TEST_DATABASE_URL;
const describeDatabase = databaseUrl ? describe : describe.skip;

describeDatabase('Informational church events with PostgreSQL', () => {
  let adminPool: Pool;
  let pool: Pool;
  let database: Database;
  let service: AnnouncementsService;
  const schemaName = `events_test_${randomUUID().replaceAll('-', '')}`;
  let admin: { id: string; churchId: string; email: string; roles: string[] };

  /** Rows in every table an attendance event would write to. */
  async function attendanceFootprint() {
    const tables = [
      schema.events,
      schema.eventDepartments,
      schema.attendanceRecords,
      schema.absenceRequests,
      schema.leaderboardEntries,
    ];
    return Promise.all(
      tables.map(async (table) => {
        const [row] = await database.select({ total: count() }).from(table);
        return row.total;
      }),
    );
  }

  beforeAll(async () => {
    adminPool = new Pool({ connectionString: databaseUrl });
    await adminPool.query('CREATE EXTENSION IF NOT EXISTS btree_gist');
    await adminPool.query(`CREATE SCHEMA "${schemaName}"`);
    pool = new Pool({
      connectionString: databaseUrl,
      options: `-c search_path=${schemaName},public`,
    });
    const files = (await readdir(resolve(__dirname, '../../drizzle')))
      .filter((file) => file.endsWith('.sql'))
      .sort();
    for (const file of files)
      await pool.query(
        await readFile(resolve(__dirname, '../../drizzle', file), 'utf8'),
      );
    database = drizzle(pool, { schema });
    // Admins never need the leadership lookup.
    const members = { findLedDepartmentIds: jest.fn().mockResolvedValue([]) };
    service = new AnnouncementsService(
      new AnnouncementsRepository(database),
      new PublisherAccessService(members as unknown as MembersRepository),
    );
  }, 60000);

  afterAll(async () => {
    await pool?.end();
    if (adminPool) {
      await adminPool.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
      await adminPool.end();
    }
  });

  beforeEach(async () => {
    await pool.query('TRUNCATE churches CASCADE');
    const [church] = await database
      .insert(schema.churches)
      .values({ name: 'One', slug: 'one', timezone: 'Africa/Accra' })
      .returning();
    const [user] = await database
      .insert(schema.users)
      .values({
        churchId: church.id,
        email: `${randomUUID()}@example.test`,
        passwordHash: 'test-only-hash',
        accountStatus: 'ACTIVE',
        emailVerifiedAt: new Date(),
      })
      .returning();
    admin = {
      id: user.id,
      churchId: church.id,
      email: user.email,
      roles: ['ADMIN'],
    };
  });

  function newEvent() {
    return service.create(
      Object.assign(new CreateAnnouncementDto(), {
        kind: 'EVENT',
        title: 'Youth Night',
        locationName: 'Main auditorium',
        onlineUrl: 'https://youtube.com/live/abc',
        startsAt: '2026-12-05T18:00:00.000Z',
        endsAt: '2026-12-05T21:00:00.000Z',
      }),
      admin,
    );
  }

  it('publishes, edits, cancels, and exports with no attendance side effects', async () => {
    const before = await attendanceFootprint();

    const created = await newEvent();
    await service.update(
      created.id,
      Object.assign(new UpdateAnnouncementDto(), { title: 'Youth Night 2026' }),
      admin,
    );
    await service.eventCalendarFile(created.id, admin);
    await service.list(new ListAnnouncementsDto(), admin);
    await service.cancelEvent(created.id, { reason: 'Heavy rain' }, admin);
    await service.eventCalendarFile(created.id, admin);

    expect(await attendanceFootprint()).toEqual(before);
  });

  it('keeps the church timezone and bumps the revision on each change', async () => {
    const created = await newEvent();
    expect(created.timeZone).toBe('Africa/Accra');
    expect(created.revision).toBe(0);

    const updated = await service.update(
      created.id,
      Object.assign(new UpdateAnnouncementDto(), { title: 'Changed' }),
      admin,
    );
    expect(updated.revision).toBe(1);

    const cancelled = await service.cancelEvent(
      created.id,
      { reason: 'Heavy rain' },
      admin,
    );
    expect(cancelled.revision).toBe(2);
    expect(cancelled.cancellationReason).toBe('Heavy rain');

    const file = await service.eventCalendarFile(created.id, admin);
    expect(file.content).toContain('SEQUENCE:2');
    expect(file.content).toContain('STATUS:CANCELLED');
  });

  it('records an audit log when an event is cancelled', async () => {
    const created = await newEvent();
    await service.cancelEvent(created.id, {}, admin);

    const logs = await database
      .select()
      .from(schema.auditLogs)
      .where(eq(schema.auditLogs.action, 'EVENT_CANCELLED'));
    expect(logs).toHaveLength(1);
    expect(logs[0].entityId).toBe(created.id);
  });

  it('keeps a cancelled event visible and clearly marked in the list', async () => {
    const created = await newEvent();
    await service.cancelEvent(created.id, {}, admin);

    const page = await service.list(new ListAnnouncementsDto(), admin);
    const listed = page.items.find((item) => item.id === created.id);
    expect(listed?.cancelledAt).not.toBeNull();
    expect(listed?.googleCalendarUrl).toBeNull();
  });

  it('refuses to cancel a feed announcement at the database level', async () => {
    const post = await service.create(
      Object.assign(new CreateAnnouncementDto(), {
        kind: 'ANNOUNCEMENT',
        title: 'Notice',
      }),
      admin,
    );
    await expect(
      database
        .update(schema.announcements)
        .set({ cancelledAt: new Date(), cancelledBy: admin.id })
        .where(eq(schema.announcements.id, post.id)),
    ).rejects.toThrow();
  });
});
