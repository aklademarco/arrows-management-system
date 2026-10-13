import { randomUUID } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import * as schema from '../database/schema';
import type { Database } from '../database/database.module';
import { NotificationPublisher } from './notification-publisher.service';
import { PushDevicesRepository } from './push-devices.repository';
import { PushDeliveryRepository } from './push-delivery.repository';
import { EventRemindersRepository } from './event-reminders.repository';
import { EventsRepository } from '../events/events.repository';
import { DepartmentsRepository } from '../departments/departments.repository';
import { MembersRepository } from '../members/members.repository';
import { LeadershipMessagesRepository } from '../leadership-messages/leadership-messages.repository';
import { AdminRegistrationRepository } from '../admin/admin-registration.repository';
import { LiturgiesRepository } from '../liturgies/liturgies.repository';
import { skipPushReason } from './push-delivery-policy';

const databaseUrl = process.env.NOTIFICATION_TEST_DATABASE_URL;
const describeDatabase = databaseUrl ? describe : describe.skip;

describeDatabase('Notification workflows with PostgreSQL', () => {
  let pool: Pool;
  let adminPool: Pool;
  let database: Database;
  let devices: PushDevicesRepository;
  let deliveries: PushDeliveryRepository;
  let events: EventsRepository;
  const publisher = new NotificationPublisher();
  const schemaName = `notification_test_${randomUUID().replaceAll('-', '')}`;
  let churchId: string;
  let otherChurchId: string;
  let actor: Awaited<ReturnType<typeof createMember>>;
  let member: Awaited<ReturnType<typeof createMember>>;
  let outsider: Awaited<ReturnType<typeof createMember>>;
  let departmentId: string;

  async function createMember(
    church: string,
    status: 'ACTIVE' | 'PENDING_APPROVAL' | 'SUSPENDED' = 'ACTIVE',
  ) {
    const [user] = await database
      .insert(schema.users)
      .values({
        churchId: church,
        email: `${randomUUID()}@example.test`,
        passwordHash: 'test-only-hash',
        accountStatus: status,
        emailVerifiedAt: new Date(),
      })
      .returning();
    const [profile] = await database
      .insert(schema.memberProfiles)
      .values({ userId: user.id, firstName: 'Test', lastName: 'Member' })
      .returning();
    return {
      id: user.id,
      churchId: church,
      email: user.email,
      roles: ['MEMBER'],
      memberId: profile.id,
    };
  }
  async function createEvent(
    requiredDepartmentIds: string[] = [],
    startsAt = new Date(Date.now() + 26 * 3600000),
  ) {
    return events.create(
      {
        name: 'Service',
        eventType: 'SERVICE',
        startsAt: startsAt.toISOString(),
        endsAt: new Date(startsAt.getTime() + 7200000).toISOString(),
        attendanceOpensAt: new Date(startsAt.getTime() - 3600000).toISOString(),
        attendanceClosesAt: new Date(
          startsAt.getTime() + 7200000,
        ).toISOString(),
        lateAfter: new Date(startsAt.getTime() + 600000).toISOString(),
        latitude: 5.6,
        longitude: -0.2,
        geofenceRadiusMeters: 100,
        maximumAccuracyMeters: 50,
        requiredDepartmentIds,
      },
      actor,
    );
  }
  async function notices() {
    return database.select().from(schema.notifications);
  }
  async function clearNotices() {
    await pool.query(
      'TRUNCATE push_deliveries, notifications, event_reminder_runs CASCADE',
    );
  }
  async function subscribe(
    who = member,
    token: string = randomUUID(),
    approvalOnly = false,
  ) {
    const secret = await devices.update(token, true, who, approvalOnly);
    return { token, secret: secret! };
  }
  async function publish(who = member) {
    await database.transaction((tx) =>
      publisher.toUsers(tx, [who.id], {
        churchId: who.churchId,
        type: 'LEADERSHIP_MESSAGE',
        title: 'Message',
        body: 'Private body',
      }),
    );
    await deliveries.enqueue();
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
    devices = new PushDevicesRepository(database);
    deliveries = new PushDeliveryRepository(database);
    events = new EventsRepository(database, publisher);
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
    const churches = await database
      .insert(schema.churches)
      .values([
        { name: 'One', slug: 'one' },
        { name: 'Two', slug: 'two' },
      ])
      .returning();
    churchId = churches[0].id;
    otherChurchId = churches[1].id;
    actor = await createMember(churchId);
    member = await createMember(churchId);
    outsider = await createMember(otherChurchId);
    const [department] = await database
      .insert(schema.departments)
      .values({ churchId, name: 'Choir', slug: 'choir' })
      .returning();
    departmentId = department.id;
  });

  it('keeps notices atomic with the business transaction', async () => {
    await expect(
      database.transaction(async (tx) => {
        await publisher.toUsers(tx, [member.id], {
          churchId,
          type: 'TEST',
          title: 'Rolled back',
          body: 'test',
        });
        throw new Error('rollback');
      }),
    ).rejects.toThrow('rollback');
    expect(await notices()).toHaveLength(0);
  });
  it('notifies only eligible members of new department events, changes and cancellation', async () => {
    await database.insert(schema.departmentMembers).values({
      departmentId,
      memberId: member.memberId,
      assignedBy: actor.id,
      joinedAt: '2020-01-01',
    });
    const event = await createEvent([departmentId]);
    expect((await notices()).map((notice) => notice.recipientUserId)).toEqual([
      member.id,
    ]);
    await events.update(
      event.id,
      churchId,
      { name: 'Updated service' },
      actor.id,
    );
    await events.update(
      event.id,
      churchId,
      { name: 'Updated service' },
      actor.id,
    );
    await events.cancel(event.id, churchId, actor.id, 'Weather');
    await events.cancel(event.id, churchId, actor.id, 'Weather');
    expect((await notices()).map((notice) => notice.type).sort()).toEqual([
      'EVENT_CANCELLED',
      'EVENT_CREATED',
      'EVENT_UPDATED',
    ]);
  });
  it('queues both reminders once and skips missed 24-hour reminders inside the final hour', async () => {
    const event = await createEvent();
    await clearNotices();
    const reminders = new EventRemindersRepository(database, publisher);
    const at24 = new Date(event.startsAt.getTime() - 24 * 3600000);
    await Promise.all([reminders.queueDue(at24), reminders.queueDue(at24)]);
    expect(await notices()).toHaveLength(2);
    const at1 = new Date(event.startsAt.getTime() - 3600000);
    await reminders.queueDue(at1);
    await reminders.queueDue(at1);
    expect(await notices()).toHaveLength(4);
    await reminders.queueDue(event.startsAt);
    expect(await notices()).toHaveLength(4);
    await clearNotices();
    await reminders.queueDue(at1);
    expect(await notices()).toHaveLength(2);
  });
  it('reschedules reminders and does not remind about cancelled events', async () => {
    const event = await createEvent();
    await clearNotices();
    const reminders = new EventRemindersRepository(database, publisher);
    await reminders.queueDue(new Date(event.startsAt.getTime() - 3600000));
    const moved = new Date(event.startsAt.getTime() + 86400000);
    await events.update(
      event.id,
      churchId,
      {
        startsAt: moved.toISOString(),
        endsAt: new Date(moved.getTime() + 7200000).toISOString(),
      },
      actor.id,
    );
    await reminders.queueDue(new Date(moved.getTime() - 3600000));
    expect(
      (await notices()).filter((notice) => notice.type === 'EVENT_REMINDER'),
    ).toHaveLength(4);
    await events.cancel(event.id, churchId, actor.id, 'Cancelled');
    const count = (await notices()).length;
    await reminders.queueDue(new Date(moved.getTime() - 10000));
    expect(await notices()).toHaveLength(count);
  });
  it('delivers pastor/leader messages to their existing scoped recipient set', async () => {
    await database.insert(schema.departmentMembers).values({
      departmentId,
      memberId: member.memberId,
      assignedBy: actor.id,
      joinedAt: '2020-01-01',
    });
    await subscribe();
    const messages = new LeadershipMessagesRepository(database);
    await messages.create({
      churchId,
      senderUserId: actor.id,
      audience: 'DEPARTMENT',
      title: 'Choir practice',
      body: 'Private details',
      departmentIds: [departmentId],
      smsRequested: false,
    });
    expect((await notices()).map((notice) => notice.recipientUserId)).toEqual([
      member.id,
    ]);
    await deliveries.enqueue();
    expect(await database.select().from(schema.pushDeliveries)).toHaveLength(1);
  });
  it('notifies the applicant on approval using an approval-only device', async () => {
    const applicant = await createMember(churchId, 'PENDING_APPROVAL');
    await subscribe(applicant, 'pending-device', true);
    await new AdminRegistrationRepository(database, publisher).review({
      userId: applicant.id,
      reviewerId: actor.id,
      reviewerChurchId: churchId,
      approve: true,
      primaryDepartmentId: departmentId,
    });
    expect((await notices()).map((notice) => notice.type)).toEqual([
      'ACCOUNT_APPROVED',
    ]);
    await deliveries.enqueue();
    expect(await database.select().from(schema.pushDeliveries)).toHaveLength(1);
    await publish(applicant);
    expect(await database.select().from(schema.pushDeliveries)).toHaveLength(1);
  });
  it('notifies affected members on membership, leadership and primary assignment changes', async () => {
    const departments = new DepartmentsRepository(database, publisher);
    const membership = await departments.addMember({
      departmentId,
      churchId,
      actorUserId: actor.id,
      memberId: member.memberId,
      makePrimary: true,
      joinedAt: '2020-01-01',
    });
    const leadership = await departments.assignLeader({
      departmentId,
      churchId,
      actorUserId: actor.id,
      memberId: member.memberId,
      startsAt: '2020-01-02',
    });
    await departments.revokeLeader({
      departmentId,
      assignmentId: leadership.id,
      churchId,
      actorUserId: actor.id,
      reason: 'Term ended',
    });
    await new MembersRepository(database, publisher).setPrimaryDepartment({
      memberId: member.memberId,
      churchId,
      actorUserId: actor.id,
      departmentMembershipId: null,
      reason: 'Updated',
    });
    await departments.endMembership({
      departmentId,
      membershipId: membership.id,
      churchId,
      actorUserId: actor.id,
      reason: 'Moved',
    });
    expect(await notices()).toHaveLength(5);
    expect(
      (await notices()).every((notice) => notice.recipientUserId === member.id),
    ).toBe(true);
  });
  it('notifies new and previous service assignees, rejects cross-church members, and ignores unchanged assignments', async () => {
    const event = await createEvent();
    await clearNotices();
    const [liturgy] = await database
      .insert(schema.eventLiturgies)
      .values({ eventId: event.id, createdBy: actor.id })
      .returning();
    const [item] = await database
      .insert(schema.eventLiturgyItems)
      .values({
        liturgyId: liturgy.id,
        position: 1,
        title: 'Prayers',
        plannedStartAt: event.startsAt,
        plannedDurationMinutes: 20,
      })
      .returning();
    const duties = new LiturgiesRepository(database, publisher);
    const input = {
      itemId: item.id,
      churchId,
      actorUserId: actor.id,
      memberId: member.memberId,
    };
    await duties.assignDuty(input);
    await duties.assignDuty(input);
    await expect(
      duties.assignDuty({ ...input, memberId: outsider.memberId }),
    ).rejects.toThrow('Eligible active member');
    await duties.assignDuty({ ...input, memberId: actor.memberId });
    expect((await notices()).map((notice) => notice.type).sort()).toEqual([
      'DUTY_ASSIGNED',
      'DUTY_ASSIGNED',
      'DUTY_REMOVED',
    ]);
  });
  it('deduplicates fan-out, leases atomically, and fences an expired worker', async () => {
    await subscribe();
    await publish();
    await Promise.all([deliveries.enqueue(), deliveries.enqueue()]);
    const claims = await Promise.all([
      deliveries.claimNext(),
      deliveries.claimNext(),
    ]);
    const claim = claims.find((value) => value)!;
    expect(claims.filter(Boolean)).toHaveLength(1);
    await database
      .update(schema.pushDeliveries)
      .set({ leaseUntil: new Date(0) });
    const replacement = (await deliveries.claimNext())!;
    await deliveries.finish(claim.id, claim.leaseId, 'SENT');
    expect(
      (await database.select().from(schema.pushDeliveries))[0].status,
    ).toBe('QUEUED');
    await deliveries.finish(replacement.id, replacement.leaseId, 'SENT');
    expect(
      (await database.select().from(schema.pushDeliveries))[0].status,
    ).toBe('SENT');
  });
  it('prevents old-owner delivery after browser account switching and capability revocation', async () => {
    const device = await subscribe();
    await publish();
    const claim = (await deliveries.claimNext())!;
    const old = (await deliveries.load(claim.id, claim.leaseId))!;
    const otherSecret = await devices.update(device.token, true, outsider);
    const moved = (await deliveries.load(claim.id, claim.leaseId))!;
    expect(skipPushReason(moved, new Date())).toBe('RECIPIENT_UNAVAILABLE');
    await devices.revokeBySecret(device.secret);
    expect(
      (await database.select().from(schema.pushDevices))[0].revokedAt,
    ).toBeNull();
    await deliveries.finish(
      claim.id,
      claim.leaseId,
      'FAILED',
      'UNREGISTERED',
      undefined,
      { id: old.device.id, generation: old.device.generation },
    );
    expect(
      (await database.select().from(schema.pushDevices))[0].revokedAt,
    ).toBeNull();
    await devices.revokeBySecret(otherSecret!);
    expect(
      (await database.select().from(schema.pushDevices))[0].revokedAt,
    ).not.toBeNull();
  });
  it('refreshes and rotates browser tokens without losing revocation credentials', async () => {
    const device = await subscribe();
    const [initial] = await database.select().from(schema.pushDevices);
    const refreshed = await devices.update(
      device.token,
      true,
      member,
      false,
      device.secret,
    );
    const [after] = await database.select().from(schema.pushDevices);
    expect(refreshed).toBe(device.secret);
    expect(after.generation).toBe(initial.generation);
    expect(after.subscribedAt).toEqual(initial.subscribedAt);
    const rotated = await devices.update(
      'rotated-token',
      true,
      member,
      false,
      refreshed,
    );
    expect(rotated).toBe(device.secret);
    const active = await database
      .select()
      .from(schema.pushDevices)
      .where(eq(schema.pushDevices.token, 'rotated-token'));
    expect(active[0].revokedAt).toBeNull();
    await devices.revokeBySecret(device.secret);
    expect(
      (await database.select().from(schema.pushDevices)).every(
        (row) => row.revokedAt,
      ),
    ).toBe(true);
  });

  it('suppresses delivery after suspension, cancellation and rescheduling', async () => {
    await subscribe();
    const event = await createEvent();
    await deliveries.enqueue();
    const claim = (await deliveries.claimNext())!;
    await database
      .update(schema.events)
      .set({
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelledBy: actor.id,
        cancellationReason: 'Test cancellation',
      })
      .where(eq(schema.events.id, event.id));
    expect(
      skipPushReason(
        (await deliveries.load(claim.id, claim.leaseId))!,
        new Date(),
      ),
    ).toBe('EVENT_UNAVAILABLE');
    await database
      .update(schema.events)
      .set({
        status: 'SCHEDULED',
        cancelledAt: null,
        cancelledBy: null,
        cancellationReason: null,
        startsAt: new Date(event.startsAt.getTime() + 1000),
      })
      .where(eq(schema.events.id, event.id));
    expect(
      skipPushReason(
        (await deliveries.load(claim.id, claim.leaseId))!,
        new Date(),
      ),
    ).toBe('EVENT_RESCHEDULED');
    await database
      .update(schema.users)
      .set({ accountStatus: 'SUSPENDED' })
      .where(eq(schema.users.id, member.id));
    expect(
      skipPushReason(
        (await deliveries.load(claim.id, claim.leaseId))!,
        new Date(),
      ),
    ).toBe('RECIPIENT_UNAVAILABLE');
  });
});
