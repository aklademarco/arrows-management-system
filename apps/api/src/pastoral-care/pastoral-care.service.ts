import { Injectable, NotFoundException } from '@nestjs/common';
import type { AdminPrincipal } from '../auth/admin.guard';
import type { CreateFollowUpDto } from './dto/create-follow-up.dto';
import { PastoralCareRepository } from './pastoral-care.repository';

@Injectable()
export class PastoralCareService {
  constructor(private readonly repository: PastoralCareRepository) {}

  async queue(user: AdminPrincipal) {
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - 90);
    const absences = await this.repository.absentRecords(user.churchId, since);
    const grouped = new Map<string, (typeof absences)[number][]>();
    for (const absence of absences) {
      const records = grouped.get(absence.memberId) ?? [];
      records.push(absence);
      grouped.set(absence.memberId, records);
    }
    const candidates = [...grouped.entries()].filter(
      ([, records]) => records.length >= 2,
    );
    const followUps = await this.repository.recentFollowUps(
      user.churchId,
      candidates.map(([memberId]) => memberId),
    );
    const history = new Map<string, typeof followUps>();
    for (const followUp of followUps) {
      const records = history.get(followUp.memberId) ?? [];
      records.push(followUp);
      history.set(followUp.memberId, records);
    }
    return candidates
      .map(([memberId, records]) => ({
        memberId,
        displayName: `${records[0].firstName} ${records[0].lastName}`,
        email: records[0].email,
        phone: records[0].phone,
        profilePhotoUrl: records[0].profilePhotoUrl,
        absenceCount: records.length,
        lastMissedAt: records[0].eventStartsAt.toISOString(),
        missedEvents: records.slice(0, 3).map((record) => ({
          id: record.eventId,
          name: record.eventName,
          startsAt: record.eventStartsAt.toISOString(),
        })),
        followUps: history.get(memberId) ?? [],
      }))
      .sort(
        (a, b) =>
          b.absenceCount - a.absenceCount ||
          a.displayName.localeCompare(b.displayName),
      );
  }

  async record(
    memberId: string,
    input: CreateFollowUpDto,
    user: AdminPrincipal,
  ) {
    if (!(await this.repository.memberInChurch(memberId, user.churchId)))
      throw new NotFoundException('Member was not found.');
    return this.repository.createFollowUp(memberId, input, user);
  }
}
