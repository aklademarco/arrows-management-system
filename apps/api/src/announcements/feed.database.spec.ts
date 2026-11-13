import { randomUUID } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import * as schema from '../database/schema';
import type { Database } from '../database/database.module';
import { NotificationPublisher } from '../notifications/notification-publisher.service';
import { AnnouncementsRepository } from './announcements.repository';
import { FeedRepository } from './feed.repository';

/** Opt-in: runs against a throwaway schema in this PostgreSQL database. */
const databaseUrl = process.env.FEED_TEST_DATABASE_URL;
const describeDatabase = databaseUrl ? describe : describe.skip;

describeDatabase('Church feed with PostgreSQL', () => {
  let adminPool: Pool;
  let pool: Pool;
  let database: Database;
  let posts: AnnouncementsRepository;
  let feed: FeedRepository;
  const schemaName = `feed_test_${randomUUID().replaceAll('-', '')}`;
  let churchId: string;
  let otherChurchId: string;
  let author: string;
  let member: string;
  let pastor: string;

  async function createUser(church: string) {
    const [user] = await database
      .insert(schema.users)
      .values({
        churchId: church,
        email: `${randomUUID()}@example.test`,
        passwordHash: 'test-only-hash',
        accountStatus: 'ACTIVE',
        emailVerifiedAt: new Date(),
      })
      .returning();
    await database
      .insert(schema.memberProfiles)
      .values({ userId: user.id, firstName: 'Test', lastName: 'Member' });
    return user.id;
  }

  async function createPost(title = 'Choir rehearsal moved') {
    return posts.create({
      churchId,
      actorUserId: author,
      values: {
        kind: 'ANNOUNCEMENT',
        title,
        theme: null,
        description: 'Now on Friday.',
        locationName: null,
        startsAt: null,
        endsAt: null,
        flyerUrl: null,
        flyerPublicId: null,
      },
    });
  }

  const notices = () => database.select().from(schema.notifications);

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
    const publisher = new NotificationPublisher();
    posts = new AnnouncementsRepository(database);
    feed = new FeedRepository(database, publisher);
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
    author = await createUser(churchId);
    member = await createUser(churchId);
    pastor = await createUser(churchId);
  });

  it('keeps one reaction per member across retries and changes', async () => {
    const post = await createPost();
    const react = (reaction: 'LIKE' | 'AMEN') =>
      feed.upsertReaction({
        churchId,
        postId: post.id,
        userId: member,
        reaction,
      });

    await Promise.all([react('LIKE'), react('LIKE')]);
    await react('AMEN');

    const rows = await database.select().from(schema.announcementReactions);
    expect(rows).toHaveLength(1);
    expect(rows[0].reaction).toBe('AMEN');

    await feed.removeReaction(post.id, member);
    expect(
      await database.select().from(schema.announcementReactions),
    ).toHaveLength(0);
  });

  it('hides deleted and moderated comments from lists, counts, and lookups', async () => {
    const post = await createPost();
    const keep = await feed.createComment({
      churchId,
      post,
      authorUserId: member,
      body: 'Amen',
    });
    const removed = await feed.createComment({
      churchId,
      post,
      authorUserId: member,
      body: 'Typo',
    });
    const reported = await feed.createComment({
      churchId,
      post,
      authorUserId: member,
      body: 'Rude words',
    });

    await feed.deleteComment(removed.id, member);
    await feed.reportComment({
      churchId,
      commentId: reported.id,
      reporterUserId: pastor,
      reason: 'Abusive',
    });
    // A repeated report from the same member is ignored.
    await feed.reportComment({
      churchId,
      commentId: reported.id,
      reporterUserId: pastor,
      reason: 'Abusive again',
    });
    const queue = await feed.listOpenReports(churchId);
    expect(queue).toHaveLength(1);
    expect(Number(queue[0].reportCount)).toBe(1);

    await feed.hideComment({
      churchId,
      commentId: reported.id,
      actorUserId: pastor,
      reason: 'Abusive language',
    });

    const list = await feed.listComments(post.id, 1, 30);
    expect(list.items.map((comment) => comment.id)).toEqual([keep.id]);
    expect(list.total).toBe(1);
    const { comments } = await feed.engagement([post.id], member);
    expect(comments[0].total).toBe(1);
    await expect(
      feed.findComment(reported.id, post.id, churchId),
    ).rejects.toThrow('Comment not found.');
    await expect(
      feed.findComment(removed.id, post.id, churchId),
    ).rejects.toThrow('Comment not found.');

    const [report] = await database
      .select()
      .from(schema.announcementCommentReports);
    expect(report.status).toBe('HIDDEN');
    expect(await feed.listOpenReports(churchId)).toHaveLength(0);
    const audit = await database
      .select()
      .from(schema.auditLogs)
      .where(eq(schema.auditLogs.action, 'FEED_COMMENT_HIDDEN'));
    expect(audit).toHaveLength(1);
  });

  it('makes archived posts and other churches’ posts unreachable', async () => {
    const post = await createPost();
    await expect(feed.findPost(post.id, otherChurchId)).rejects.toThrow(
      'Post not found.',
    );
    await posts.archive({ id: post.id, churchId, actorUserId: author });
    await expect(feed.findPost(post.id, churchId)).rejects.toThrow(
      'Post not found.',
    );
    expect((await feed.listPosts(churchId, 1, 10)).total).toBe(0);
  });

  it('lists pinned notices first and notifies the church once per pin', async () => {
    const older = await createPost('Older notice');
    await createPost('Newer notice');

    await feed.setPinned({
      churchId,
      post: older,
      actorUserId: pastor,
      pinned: true,
    });
    await feed.setPinned({
      churchId,
      post: older,
      actorUserId: pastor,
      pinned: false,
    });
    await feed.setPinned({
      churchId,
      post: older,
      actorUserId: pastor,
      pinned: true,
    });

    const { items } = await feed.listPosts(churchId, 1, 10);
    expect(items.map((item) => item.title)).toEqual([
      'Older notice',
      'Newer notice',
    ]);
    const pinNotices = (await notices()).filter(
      (notice) => notice.type === 'FEED_PINNED_NOTICE',
    );
    // Everyone except the pastor who pinned it, exactly once.
    expect(pinNotices.map((notice) => notice.recipientUserId).sort()).toEqual(
      [author, member].sort(),
    );
  });

  it('groups comment notifications for the post author', async () => {
    const post = await createPost();
    for (const body of ['First', 'Second', 'Third']) {
      await feed.createComment({ churchId, post, authorUserId: member, body });
    }
    // The author's own comment does not notify them.
    await feed.createComment({
      churchId,
      post,
      authorUserId: author,
      body: 'Thanks',
    });

    const commentNotices = (await notices()).filter(
      (notice) => notice.type === 'FEED_COMMENT',
    );
    expect(commentNotices).toHaveLength(1);
    expect(commentNotices[0].recipientUserId).toBe(author);
    expect(commentNotices[0].link).toBe(`/feed/${post.id}`);
  });
});
