import { BadRequestException, Injectable } from '@nestjs/common';
import type { AdminPrincipal } from '../auth/admin.guard';
import type { CreateEventDto } from './dto/create-event.dto';
import { EventsRepository } from './events.repository';

@Injectable()
export class EventsService {
  constructor(private readonly repository: EventsRepository) {}

  list(admin: AdminPrincipal) {
    return this.repository.list(admin.churchId);
  }

  create(dto: CreateEventDto, admin: AdminPrincipal) {
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);
    const opensAt = new Date(dto.attendanceOpensAt);
    const closesAt = new Date(dto.attendanceClosesAt);
    const lateAfter = new Date(dto.lateAfter);
    const earlyUntil = dto.earlyUntil ? new Date(dto.earlyUntil) : null;
    if (endsAt <= startsAt)
      throw new BadRequestException('Event end must be after its start.');
    if (closesAt <= opensAt)
      throw new BadRequestException(
        'Attendance close must be after attendance open.',
      );
    if (lateAfter < opensAt || lateAfter > closesAt)
      throw new BadRequestException(
        'Late threshold must fall within the attendance window.',
      );
    if (earlyUntil && (earlyUntil < opensAt || earlyUntil > closesAt))
      throw new BadRequestException(
        'Early threshold must fall within the attendance window.',
      );
    return this.repository.create(dto, admin);
  }
}
