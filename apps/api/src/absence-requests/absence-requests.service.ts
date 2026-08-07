import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../auth/authenticated.guard';
import { AbsenceRequestsRepository } from './absence-requests.repository';
import type { CreateAbsenceRequestDto } from './dto/create-absence-request.dto';
import type { ReviewAbsenceRequestDto } from './dto/review-absence-request.dto';

function isAdmin(user: AuthenticatedPrincipal): boolean {
  return user.roles.includes('SUPER_ADMIN') || user.roles.includes('ADMIN');
}

function validationError(message: string): HttpException {
  return new HttpException({ code: 'VALIDATION_ERROR', message }, 422);
}

@Injectable()
export class AbsenceRequestsService {
  constructor(private readonly repository: AbsenceRequestsRepository) {}

  async submit(user: AuthenticatedPrincipal, dto: CreateAbsenceRequestDto) {
    const hasEvent = Boolean(dto.eventId);
    const hasStart = Boolean(dto.startsOn);
    const hasEnd = Boolean(dto.endsOn);
    const hasRange = hasStart || hasEnd;

    if (hasEvent && hasRange)
      throw validationError(
        'Provide either an event or a date range, not both.',
      );
    if (!hasEvent && !hasRange)
      throw validationError('Provide either an event or a date range.');
    if (!hasEvent && (!hasStart || !hasEnd))
      throw validationError('A date range needs both a start and an end date.');
    if (!hasEvent && dto.endsOn! < dto.startsOn!)
      throw validationError('The end date cannot be before the start date.');

    const memberId = await this.repository.findActiveMemberId(
      user.id,
      user.churchId,
    );
    if (!memberId) throw new NotFoundException('Member profile not found.');

    return this.repository.create({
      memberId,
      churchId: user.churchId,
      eventId: dto.eventId ?? null,
      startsOn: hasEvent ? null : dto.startsOn!,
      endsOn: hasEvent ? null : dto.endsOn!,
      reason: dto.reason.trim(),
      details: dto.details?.trim() || null,
    });
  }

  async listOwn(user: AuthenticatedPrincipal) {
    const memberId = await this.repository.findActiveMemberId(
      user.id,
      user.churchId,
    );
    if (!memberId) throw new NotFoundException('Member profile not found.');
    return this.repository.listOwn(memberId);
  }

  async listReviewable(user: AuthenticatedPrincipal) {
    const requests = await this.repository.listForChurch(user.churchId);
    if (isAdmin(user)) return requests;

    const visible = [];
    for (const request of requests) {
      try {
        await this.assertReviewScope(user, request, new Date());
        visible.push(request);
      } catch (error) {
        if (error instanceof NotFoundException) continue;
        throw error;
      }
    }
    return visible;
  }

  async cancel(requestId: string, user: AuthenticatedPrincipal) {
    const memberId = await this.repository.findActiveMemberId(
      user.id,
      user.churchId,
    );
    if (!memberId) throw new NotFoundException('Member profile not found.');
    return this.repository.cancel(requestId, memberId, user);
  }

  async review(
    requestId: string,
    user: AuthenticatedPrincipal,
    dto: ReviewAbsenceRequestDto,
  ) {
    const now = new Date();
    const request = await this.repository.findScopedRequest(
      requestId,
      user.churchId,
    );
    // Missing or cross-church requests are indistinguishable to the caller.
    if (!request) throw new NotFoundException('Absence request not found.');

    await this.assertReviewScope(user, request, now);

    const reviewNote = dto.reviewNote.trim();
    if (dto.status === 'APPROVED')
      return this.repository.approve(requestId, user, reviewNote, now);
    return this.repository.recordDecision(
      requestId,
      user,
      dto.status,
      reviewNote,
      now,
    );
  }

  /**
   * Enforce the department-leader review scope. Admins may review anything.
   * A user holding the leader role but with no active assignment is forbidden;
   * a leader whose scope does not cover the request sees a NOT_FOUND so the
   * request stays opaque outside their remit.
   */
  private async assertReviewScope(
    user: AuthenticatedPrincipal,
    request: {
      memberId: string;
      eventId: string | null;
    },
    now: Date,
  ): Promise<void> {
    if (isAdmin(user)) return;

    const today = now.toISOString().slice(0, 10);
    const ledDepartmentIds = await this.repository.findLedDepartmentIds(
      user.id,
      user.churchId,
      today,
    );
    if (ledDepartmentIds.length === 0)
      throw new HttpException(
        {
          code: 'DEPARTMENT_SCOPE_FORBIDDEN',
          message: 'You do not lead any department.',
        },
        403,
      );

    if (request.eventId) {
      const openToAll = await this.repository.isEventOpenToAll(request.eventId);
      if (!openToAll) {
        // Department-scoped event: the leader must lead an assigned department
        // that also contained the member as of the event start date.
        const eventStartDate = await this.eventStartDate(request.eventId);
        const covers = await this.repository.leaderCoversEvent(
          request.eventId,
          request.memberId,
          ledDepartmentIds,
          eventStartDate,
        );
        if (!covers) throw new NotFoundException('Absence request not found.');
        return;
      }
      // Open-to-all event falls through to the primary-department rule below.
    }

    // Date-range request, or open-to-all event: leadership of the member's
    // primary department is required. No primary department means only admins
    // can act, which a leader cannot satisfy here.
    const primaryDepartmentId = await this.repository.findPrimaryDepartmentId(
      request.memberId,
      today,
    );
    if (!primaryDepartmentId || !ledDepartmentIds.includes(primaryDepartmentId))
      throw new NotFoundException('Absence request not found.');
  }

  private async eventStartDate(eventId: string): Promise<string> {
    const startsAt = await this.repository.findEventStartsAt(eventId);
    if (!startsAt) throw new NotFoundException('Event not found.');
    return startsAt.toISOString().slice(0, 10);
  }
}
