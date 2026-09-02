import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import type { AdminPrincipal } from '../auth/admin.guard';
import type { CreateEventDto } from './dto/create-event.dto';
import type { CancelEventDto } from './dto/cancel-event.dto';
import type { UpdateEventDto } from './dto/update-event.dto';
import { EventsRepository } from './events.repository';
import type { ListEventsDto } from './dto/list-events.dto';
import { sundayAttendanceWindow } from './sunday-attendance-window';

@Injectable()
export class EventsService {
  constructor(private readonly repository: EventsRepository) {}

  list(query: ListEventsDto, admin: AdminPrincipal) {
    if (query.from && query.to && query.to < query.from) {
      throw new BadRequestException(
        'The event filter end date cannot precede its start date.',
      );
    }
    return this.repository.list(admin.churchId, query);
  }

  listRecurringDefaults(admin: AdminPrincipal) {
    return this.repository.listRecurringDefaults(admin.churchId);
  }

  findById(eventId: string, admin: AdminPrincipal) {
    return this.repository.findById(eventId, admin.churchId);
  }

  create(dto: CreateEventDto, admin: AdminPrincipal) {
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);
    const sundayWindow = sundayAttendanceWindow(startsAt, endsAt);
    const normalizedDto = sundayWindow
      ? {
          ...dto,
          attendanceOpensAt: sundayWindow.opensAt.toISOString(),
          attendanceClosesAt: sundayWindow.closesAt.toISOString(),
        }
      : dto;
    const opensAt = new Date(normalizedDto.attendanceOpensAt);
    const closesAt = new Date(normalizedDto.attendanceClosesAt);
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
    return this.repository.create(normalizedDto, admin);
  }

  async update(eventId: string, dto: UpdateEventDto, admin: AdminPrincipal) {
    if (Object.keys(dto).length === 0)
      throw new BadRequestException('Provide at least one event field.');
    const current = await this.repository.findById(eventId, admin.churchId);
    if (!['DRAFT', 'SCHEDULED'].includes(current.status))
      throw new ConflictException(
        'Only draft or scheduled events can be edited.',
      );
    const startsAt = new Date(dto.startsAt ?? current.startsAt.toISOString());
    const endsAt = new Date(dto.endsAt ?? current.endsAt.toISOString());
    const sundayWindow = sundayAttendanceWindow(startsAt, endsAt);
    const normalizedDto: UpdateEventDto = sundayWindow
      ? {
          ...dto,
          attendanceOpensAt: sundayWindow.opensAt.toISOString(),
          attendanceClosesAt: sundayWindow.closesAt.toISOString(),
        }
      : dto;
    this.validateTiming({
      startsAt: dto.startsAt ?? current.startsAt.toISOString(),
      endsAt: dto.endsAt ?? current.endsAt.toISOString(),
      attendanceOpensAt:
        normalizedDto.attendanceOpensAt ??
        current.attendanceOpensAt.toISOString(),
      attendanceClosesAt:
        normalizedDto.attendanceClosesAt ??
        current.attendanceClosesAt.toISOString(),
      earlyUntil: dto.earlyUntil ?? current.earlyUntil?.toISOString(),
      lateAfter: dto.lateAfter ?? current.lateAfter.toISOString(),
    });
    return this.repository.update(
      eventId,
      admin.churchId,
      normalizedDto,
      admin.id,
    );
  }

  async cancel(eventId: string, dto: CancelEventDto, admin: AdminPrincipal) {
    const current = await this.repository.findById(eventId, admin.churchId);
    if (current.status === 'COMPLETED')
      throw new ConflictException('Completed events cannot be cancelled.');
    return this.repository.cancel(
      eventId,
      admin.churchId,
      admin.id,
      dto.reason.trim(),
    );
  }

  private validateTiming(
    dto: Pick<
      CreateEventDto,
      | 'startsAt'
      | 'endsAt'
      | 'attendanceOpensAt'
      | 'attendanceClosesAt'
      | 'earlyUntil'
      | 'lateAfter'
    >,
  ) {
    const startsAt = new Date(dto.startsAt),
      endsAt = new Date(dto.endsAt),
      opensAt = new Date(dto.attendanceOpensAt),
      closesAt = new Date(dto.attendanceClosesAt),
      lateAfter = new Date(dto.lateAfter),
      earlyUntil = dto.earlyUntil ? new Date(dto.earlyUntil) : null;
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
  }
}
