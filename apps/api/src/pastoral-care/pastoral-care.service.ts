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
    const today = new Date().toISOString().slice(0, 10);
    return candidates
      .map(([memberId, records]) => {
        const memberFollowUps = history.get(memberId) ?? [];
        const latest = memberFollowUps[0];
        let careStatus:
          | 'NEEDS_CONTACT'
          | 'FOLLOW_UP_DUE'
          | 'FOLLOW_UP_SCHEDULED'
          | 'CONTACTED'
          | 'CARE_COMPLETED' = 'NEEDS_CONTACT';
        if (latest?.outcome === 'CARE_COMPLETED') careStatus = 'CARE_COMPLETED';
        else if (latest?.nextFollowUpOn && latest.nextFollowUpOn <= today)
          careStatus = 'FOLLOW_UP_DUE';
        else if (latest?.nextFollowUpOn) careStatus = 'FOLLOW_UP_SCHEDULED';
        else if (latest) careStatus = 'CONTACTED';
        return {
          memberId,
          displayName: `${records[0].firstName} ${records[0].lastName}`,
          email: records[0].email,
          phone: records[0].phone,
          profilePhotoUrl: records[0].profilePhotoUrl,
          absenceCount: records.length,
          lastMissedAt: records[0].eventStartsAt.toISOString(),
          careStatus,
          missedEvents: records.slice(0, 3).map((record) => ({
            id: record.eventId,
            name: record.eventName,
            startsAt: record.eventStartsAt.toISOString(),
          })),
          followUps: memberFollowUps,
        };
      })
      .sort(
        (a, b) =>
          this.statusPriority(a.careStatus) -
            this.statusPriority(b.careStatus) ||
          b.absenceCount - a.absenceCount ||
          a.displayName.localeCompare(b.displayName),
      );
  }

  private statusPriority(status: string) {
    return (
      {
        FOLLOW_UP_DUE: 0,
        NEEDS_CONTACT: 1,
        CONTACTED: 2,
        FOLLOW_UP_SCHEDULED: 3,
        CARE_COMPLETED: 4,
      }[status] ?? 5
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
