import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AdminPrincipal } from '../auth/admin.guard';
import type { CreatePointsAdjustmentDto } from './dto/create-points-adjustment.dto';
import type { AuthenticatedPrincipal } from '../auth/authenticated.guard';
import type { LeaderboardQueryDto } from './dto/leaderboard-query.dto';
import { LeaderboardsRepository } from './leaderboards.repository';

const attendedStatuses = new Set(['EARLY', 'ON_TIME', 'LATE']);
const round = (value: number) => Math.round(value * 100) / 100;

function periodRange(period: LeaderboardQueryDto['period'], value?: string) {
  const anchor = value ? new Date(`${value}T12:00:00Z`) : new Date();
  const year = anchor.getUTCFullYear(),
    month = anchor.getUTCMonth(),
    day = anchor.getUTCDate();
  let start: Date;
  if (period === 'WEEKLY') {
    const mondayOffset = (anchor.getUTCDay() + 6) % 7;
    start = new Date(Date.UTC(year, month, day - mondayOffset));
  } else if (period === 'QUARTERLY') {
    start = new Date(Date.UTC(year, Math.floor(month / 3) * 3, 1));
  } else if (period === 'YEARLY') {
    start = new Date(Date.UTC(year, 0, 1));
  } else {
    start = new Date(Date.UTC(year, month, 1));
  }
  const end = new Date(start);
  if (period === 'WEEKLY') end.setUTCDate(end.getUTCDate() + 7);
  else if (period === 'MONTHLY') end.setUTCMonth(end.getUTCMonth() + 1);
  else if (period === 'QUARTERLY') end.setUTCMonth(end.getUTCMonth() + 3);
  else end.setUTCFullYear(end.getUTCFullYear() + 1);
  return { start, end };
}

@Injectable()
export class LeaderboardsService {
  constructor(private readonly repository: LeaderboardsRepository) {}

  async individual(query: LeaderboardQueryDto, user: AuthenticatedPrincipal) {
    const { start, end } = periodRange(query.period, query.date);
    const { rows, points } = await this.repository.individual({
      churchId: user.churchId,
      startsAt: start,
      endsAt: end,
      departmentId: query.departmentId,
    });
    const grouped = new Map<string, typeof rows>();
    for (const row of rows)
      grouped.set(row.memberId, [...(grouped.get(row.memberId) ?? []), row]);
    const pointMap = new Map(
      points.map((row) => [row.memberId, Number(row.points)]),
    );
    const items = [...grouped.entries()].map(([memberId, history]) => {
      const scored = history.filter((row) => row.status !== 'EXCUSED');
      const attended = scored.filter((row) => attendedStatuses.has(row.status));
      const known = attended.filter(
        (row) =>
          row.punctualityStatus ||
          ['EARLY', 'ON_TIME', 'LATE'].includes(row.status),
      );
      const punctual = known.filter(
        (row) => (row.punctualityStatus ?? row.status) !== 'LATE',
      );
      const attendanceRate = scored.length
        ? (attended.length / scored.length) * 100
        : 0;
      const punctualityRate = known.length
        ? (punctual.length / known.length) * 100
        : null;
      const score =
        punctualityRate === null
          ? attendanceRate
          : attendanceRate * 0.7 + punctualityRate * 0.3;
      let current = 0,
        longest = 0,
        run = 0;
      for (const row of history) {
        if (row.status === 'EXCUSED') continue;
        if (attendedStatuses.has(row.status)) {
          run += 1;
          longest = Math.max(longest, run);
        } else run = 0;
      }
      for (let index = history.length - 1; index >= 0; index -= 1) {
        const status = history[index].status;
        if (status === 'EXCUSED') continue;
        if (attendedStatuses.has(status)) current += 1;
        else break;
      }
      const first = history[0];
      return {
        rank: null as number | null,
        memberId,
        displayName: `${first.firstName} ${first.lastName[0]}.`,
        profilePhotoUrl: first.profilePhotoUrl,
        expectedEvents: scored.length,
        attendedEvents: attended.length,
        attendanceRate: round(attendanceRate),
        knownPunctualityAttendances: known.length,
        punctualAttendances: punctual.length,
        punctualityRate:
          punctualityRate === null ? null : round(punctualityRate),
        score: round(score),
        qualified: scored.length >= 3,
        currentAttendanceStreak: current,
        longestAttendanceStreak: longest,
        secondaryPoints: pointMap.get(memberId) ?? 0,
      };
    });
    items.sort(
      (a, b) =>
        Number(b.qualified) - Number(a.qualified) ||
        b.score - a.score ||
        (b.punctualityRate ?? -1) - (a.punctualityRate ?? -1) ||
        b.attendanceRate - a.attendanceRate ||
        a.displayName.localeCompare(b.displayName),
    );
    let rank = 0;
    for (const item of items) if (item.qualified) item.rank = ++rank;
    return {
      period: query.period,
      startsOn: start.toISOString().slice(0, 10),
      endsOn: new Date(end.getTime() - 86400000).toISOString().slice(0, 10),
      minimumQualifyingEvents: 3,
      items: items.slice(0, query.limit),
    };
  }

  async departments(query: LeaderboardQueryDto, user: AuthenticatedPrincipal) {
    const { start, end } = periodRange(query.period, query.date);
    const rows = await this.repository.departments({
      churchId: user.churchId,
      startsAt: start,
      endsAt: end,
    });
    const grouped = new Map<string, typeof rows>();
    for (const row of rows)
      grouped.set(row.departmentId, [
        ...(grouped.get(row.departmentId) ?? []),
        row,
      ]);
    const items = [...grouped.entries()].map(([departmentId, slots]) => {
      const expected = slots.filter((slot) => slot.status !== 'EXCUSED');
      const attended = expected.filter(
        (slot) => slot.status !== null && attendedStatuses.has(slot.status),
      );
      const known = attended.filter(
        (slot) =>
          slot.punctualityStatus ||
          (slot.status && ['EARLY', 'ON_TIME', 'LATE'].includes(slot.status)),
      );
      const punctual = known.filter(
        (slot) => (slot.punctualityStatus ?? slot.status) !== 'LATE',
      );
      const attendanceRate = expected.length
        ? (attended.length / expected.length) * 100
        : 0;
      const punctualityRate = known.length
        ? (punctual.length / known.length) * 100
        : null;
      const score =
        punctualityRate === null
          ? attendanceRate
          : attendanceRate * 0.7 + punctualityRate * 0.3;
      const applicableEvents = new Set(expected.map((slot) => slot.eventId))
        .size;
      return {
        rank: null as number | null,
        departmentId,
        departmentName: slots[0].departmentName,
        applicableEvents,
        expectedAttendanceSlots: expected.length,
        attendedSlots: attended.length,
        attendanceRate: round(attendanceRate),
        punctualityRate:
          punctualityRate === null ? null : round(punctualityRate),
        score: round(score),
        qualified: applicableEvents >= 3,
      };
    });
    items.sort(
      (a, b) =>
        Number(b.qualified) - Number(a.qualified) ||
        b.score - a.score ||
        (b.punctualityRate ?? -1) - (a.punctualityRate ?? -1) ||
        b.attendanceRate - a.attendanceRate ||
        a.departmentName.localeCompare(b.departmentName),
    );
    let rank = 0;
    for (const item of items) if (item.qualified) item.rank = ++rank;
    return {
      period: query.period,
      startsOn: start.toISOString().slice(0, 10),
      endsOn: new Date(end.getTime() - 86400000).toISOString().slice(0, 10),
      minimumQualifyingEvents: 3,
      items: items.slice(0, query.limit),
    };
  }

  async adjustMemberPoints(
    memberId: string,
    body: CreatePointsAdjustmentDto,
    admin: AdminPrincipal,
  ) {
    if (body.points === 0)
      throw new BadRequestException('Point adjustment cannot be zero.');
    const entry = await this.repository.createAdjustment({
      memberId,
      churchId: admin.churchId,
      actorUserId: admin.id,
      points: body.points,
      reason: body.reason.trim(),
    });
    if (!entry) throw new NotFoundException('Member not found.');
    return entry;
  }

  memberAdjustments(memberId: string, admin: AdminPrincipal) {
    return this.repository.memberAdjustments(memberId, admin.churchId);
  }
}
