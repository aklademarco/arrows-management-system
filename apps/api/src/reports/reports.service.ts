import { BadRequestException, Injectable } from '@nestjs/common';
import type { AdminPrincipal } from '../auth/admin.guard';
import type { AttendanceReportQueryDto } from './dto/attendance-report-query.dto';
import { ReportsRepository } from './reports.repository';

const attendedStatuses = new Set(['EARLY', 'ON_TIME', 'LATE']);
const round = (value: number) => Math.round(value * 100) / 100;

function reportRange(query: AttendanceReportQueryDto) {
  const now = new Date();
  const defaultFrom = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-01`;
  const defaultTo = now.toISOString().slice(0, 10);
  const from = query.from ?? defaultFrom;
  const to = query.to ?? defaultTo;
  const start = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  end.setUTCDate(end.getUTCDate() + 1);
  if (start >= end)
    throw new BadRequestException('From date must be on or before to date.');
  const days = (end.getTime() - start.getTime()) / 86400000;
  if (days > 366)
    throw new BadRequestException('Report range cannot exceed 366 days.');
  return { from, to, start, end };
}

@Injectable()
export class ReportsService {
  constructor(private readonly repository: ReportsRepository) {}

  async attendanceSummary(
    query: AttendanceReportQueryDto,
    admin: AdminPrincipal,
  ) {
    const range = reportRange(query);
    const rows = await this.repository.attendance({
      churchId: admin.churchId,
      startsAt: range.start,
      endsAt: range.end,
      departmentId: query.departmentId,
    });
    const scored = rows.filter((row) => row.status !== 'EXCUSED');
    const attended = scored.filter((row) => attendedStatuses.has(row.status));
    const punctual = attended.filter(
      (row) => (row.punctualityStatus ?? row.status) !== 'LATE',
    );
    const manual = rows.filter((row) => row.method === 'MANUAL');
    const events = new Map<
      string,
      {
        eventId: string;
        eventName: string;
        startsAt: string;
        total: number;
        attended: number;
        absent: number;
        excused: number;
      }
    >();
    const members = new Map<
      string,
      {
        memberId: string;
        displayName: string;
        records: number;
        attended: number;
        absent: number;
        excused: number;
        manual: number;
        punctual: number;
      }
    >();
    for (const row of rows) {
      const item = events.get(row.eventId) ?? {
        eventId: row.eventId,
        eventName: row.eventName,
        startsAt: row.eventStartsAt.toISOString(),
        total: 0,
        attended: 0,
        absent: 0,
        excused: 0,
      };
      item.total += 1;
      if (attendedStatuses.has(row.status)) item.attended += 1;
      else if (row.status === 'ABSENT') item.absent += 1;
      else if (row.status === 'EXCUSED') item.excused += 1;
      events.set(row.eventId, item);

      const member = members.get(row.memberId) ?? {
        memberId: row.memberId,
        displayName: `${row.firstName} ${row.lastName}`,
        records: 0,
        attended: 0,
        absent: 0,
        excused: 0,
        manual: 0,
        punctual: 0,
      };
      member.records += 1;
      if (attendedStatuses.has(row.status)) {
        member.attended += 1;
        if ((row.punctualityStatus ?? row.status) !== 'LATE')
          member.punctual += 1;
      } else if (row.status === 'ABSENT') member.absent += 1;
      else if (row.status === 'EXCUSED') member.excused += 1;
      if (row.method === 'MANUAL') member.manual += 1;
      members.set(row.memberId, member);
    }
    return {
      from: range.from,
      to: range.to,
      departmentId: query.departmentId ?? null,
      totals: {
        events: events.size,
        records: rows.length,
        attended: attended.length,
        absent: scored.length - attended.length,
        excused: rows.length - scored.length,
        manual: manual.length,
        attendanceRate: scored.length
          ? round((attended.length / scored.length) * 100)
          : 0,
        punctualityRate: attended.length
          ? round((punctual.length / attended.length) * 100)
          : 0,
      },
      events: [...events.values()].reverse(),
      members: [...members.values()]
        .map((member) => {
          const expected = member.records - member.excused;
          return {
            ...member,
            attendanceRate: expected
              ? round((member.attended / expected) * 100)
              : 0,
            punctualityRate: member.attended
              ? round((member.punctual / member.attended) * 100)
              : 0,
          };
        })
        .sort(
          (a, b) =>
            a.attendanceRate - b.attendanceRate ||
            b.absent - a.absent ||
            a.displayName.localeCompare(b.displayName),
        ),
    };
  }
}
