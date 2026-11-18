import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../auth/authenticated.guard';
import {
  AnnouncementsRepository,
  type AnnouncementValues,
} from './announcements.repository';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { ListAnnouncementsDto } from './dto/list-announcements.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { CancelEventDto } from './dto/cancel-event.dto';
import {
  buildEventIcs,
  eventIcsFilename,
  googleCalendarUrl,
} from './event-calendar';
import {
  PublisherAccessService,
  type PublisherAccess,
} from './publisher-access.service';

export const ANNOUNCEMENT_FLYER_FOLDER = 'acms/announcement-flyers';

type StoredAnnouncement = AnnouncementValues & {
  id: string;
  createdBy: string;
  timeZone: string;
  cancelledAt: Date | null;
  revision: number;
  updatedAt: Date;
};

/** Trims text; blank text becomes null. Undefined stays undefined. */
function cleanText(value: string | null | undefined) {
  if (value === undefined) return undefined;
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function toDate(value: string | null | undefined) {
  if (value === undefined) return undefined;
  return value === null ? null : new Date(value);
}

@Injectable()
export class AnnouncementsService {
  constructor(
    private readonly repository: AnnouncementsRepository,
    private readonly access: PublisherAccessService,
  ) {}

  /** Every signed-in member can read the church's announcements. */
  async list(query: ListAnnouncementsDto, viewer: AuthenticatedPrincipal) {
    const [page, access] = await Promise.all([
      this.repository.list(query, viewer.churchId, new Date()),
      this.access.resolve(viewer),
    ]);
    return {
      ...page,
      canPublish: access.canPublish,
      items: page.items.map((item) => this.present(item, viewer, access)),
    };
  }

  async findById(id: string, viewer: AuthenticatedPrincipal) {
    const [item, access] = await Promise.all([
      this.repository.findById(id, viewer.churchId),
      this.access.resolve(viewer),
    ]);
    return this.present(item, viewer, access);
  }

  async create(body: CreateAnnouncementDto, viewer: AuthenticatedPrincipal) {
    const access = await this.access.resolve(viewer);
    if (!access.canPublish) {
      throw new ForbiddenException(
        'Only administrators, pastors, and department leaders with an active assignment can post.',
      );
    }
    const values = this.validate({
      kind: body.kind,
      title: cleanText(body.title) ?? '',
      theme: cleanText(body.theme) ?? null,
      description: cleanText(body.description) ?? null,
      locationName: cleanText(body.locationName) ?? null,
      onlineUrl: cleanText(body.onlineUrl) ?? null,
      startsAt: toDate(body.startsAt) ?? null,
      endsAt: toDate(body.endsAt) ?? null,
      flyerUrl: body.flyerUrl ?? null,
      flyerPublicId: body.flyerPublicId ?? null,
    });
    const created = await this.repository.create({
      churchId: viewer.churchId,
      actorUserId: viewer.id,
      values,
    });
    return this.present(created, viewer, access);
  }

  async update(
    id: string,
    body: UpdateAnnouncementDto,
    viewer: AuthenticatedPrincipal,
  ) {
    if (Object.values(body).every((value) => value === undefined)) {
      throw new BadRequestException('Provide at least one field to update.');
    }
    const existing = await this.repository.findById(id, viewer.churchId);
    const access = await this.assertCanManage(existing, viewer);
    if (existing.cancelledAt) {
      throw new BadRequestException(
        'Cancelled events cannot be edited. Publish a new event instead.',
      );
    }

    const previous = this.valuesOf(existing);
    const pick = <K extends keyof AnnouncementValues>(
      key: K,
      next: AnnouncementValues[K] | undefined,
    ) => (next === undefined ? previous[key] : next);

    const values = this.validate({
      kind: pick('kind', body.kind),
      // A blank title is rejected by validate(), not silently ignored.
      title:
        body.title === undefined
          ? previous.title
          : (cleanText(body.title) ?? ''),
      theme: pick('theme', cleanText(body.theme)),
      description: pick('description', cleanText(body.description)),
      locationName: pick('locationName', cleanText(body.locationName)),
      onlineUrl: pick('onlineUrl', cleanText(body.onlineUrl)),
      startsAt: pick('startsAt', toDate(body.startsAt)),
      endsAt: pick('endsAt', toDate(body.endsAt)),
      flyerUrl: pick('flyerUrl', body.flyerUrl),
      flyerPublicId: pick('flyerPublicId', body.flyerPublicId),
    });
    const updated = await this.repository.update({
      id,
      churchId: viewer.churchId,
      actorUserId: viewer.id,
      previous,
      values,
    });
    return this.present(updated, viewer, access);
  }

  async archive(id: string, viewer: AuthenticatedPrincipal) {
    const existing = await this.repository.findById(id, viewer.churchId);
    await this.assertCanManage(existing, viewer);
    await this.repository.archive({
      id,
      churchId: viewer.churchId,
      actorUserId: viewer.id,
    });
  }

  /**
   * Marks an event as cancelled. It stays visible, clearly marked, so members
   * who saw it learn about the change; archive removes it from view.
   */
  async cancelEvent(
    id: string,
    body: CancelEventDto,
    viewer: AuthenticatedPrincipal,
  ) {
    const existing = await this.repository.findById(id, viewer.churchId);
    const access = await this.assertCanManage(existing, viewer);
    if (existing.kind !== 'EVENT') {
      throw new BadRequestException('Only events can be cancelled.');
    }
    if (existing.cancelledAt) {
      throw new BadRequestException('This event is already cancelled.');
    }
    const cancelled = await this.repository.cancelEvent({
      id,
      churchId: viewer.churchId,
      actorUserId: viewer.id,
      reason: cleanText(body.reason) ?? null,
    });
    return this.present(cancelled, viewer, access);
  }

  /** An .ics copy of one event. Reading it has no attendance side effects. */
  async eventCalendarFile(id: string, viewer: AuthenticatedPrincipal) {
    const event = await this.repository.findById(id, viewer.churchId);
    if (event.kind !== 'EVENT' || !event.startsAt) {
      throw new NotFoundException('Event not found.');
    }
    const calendarEvent = { ...event, startsAt: event.startsAt };
    return {
      filename: eventIcsFilename(calendarEvent),
      content: buildEventIcs(calendarEvent),
    };
  }

  private async assertCanManage(
    item: { createdBy: string },
    viewer: AuthenticatedPrincipal,
  ) {
    const access = await this.access.resolve(viewer);
    if (!this.access.canManage(item, viewer, access)) {
      throw new ForbiddenException(
        'You can only change announcements you posted.',
      );
    }
    return access;
  }

  private present<T extends StoredAnnouncement>(
    item: T,
    viewer: AuthenticatedPrincipal,
    access: PublisherAccess,
  ) {
    const exportable =
      item.kind === 'EVENT' && item.startsAt && !item.cancelledAt;
    return {
      ...item,
      canManage: this.access.canManage(item, viewer, access),
      googleCalendarUrl: exportable
        ? googleCalendarUrl({ ...item, startsAt: item.startsAt! })
        : null,
    };
  }

  private valuesOf(item: StoredAnnouncement): AnnouncementValues {
    return {
      kind: item.kind,
      title: item.title,
      theme: item.theme,
      description: item.description,
      locationName: item.locationName,
      onlineUrl: item.onlineUrl,
      startsAt: item.startsAt,
      endsAt: item.endsAt,
      flyerUrl: item.flyerUrl,
      flyerPublicId: item.flyerPublicId,
    };
  }

  private validate(values: AnnouncementValues): AnnouncementValues {
    if (!values.title) {
      throw new BadRequestException('A title is required.');
    }
    if (values.kind === 'EVENT' && !values.startsAt) {
      throw new BadRequestException('Events need a start date and time.');
    }
    // Calendar exports need a real duration.
    if (
      values.kind === 'EVENT' &&
      (!values.endsAt || (values.startsAt && values.endsAt <= values.startsAt))
    ) {
      throw new BadRequestException(
        'Events need an end time after the start time.',
      );
    }
    if (values.endsAt && !values.startsAt) {
      throw new BadRequestException('Add a start date before an end date.');
    }
    if (values.startsAt && values.endsAt && values.endsAt < values.startsAt) {
      throw new BadRequestException('The end must be after the start.');
    }
    this.validateFlyer(values.flyerUrl, values.flyerPublicId);
    return values;
  }

  /** Flyers must be uploaded to this church's Cloudinary flyer folder. */
  private validateFlyer(url: string | null, publicId: string | null) {
    if (url === null && publicId === null) return;
    if (url === null || publicId === null) {
      throw new BadRequestException(
        'A flyer needs both its image URL and its upload ID.',
      );
    }
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    if (
      !cloudName ||
      !url.startsWith(
        `https://res.cloudinary.com/${cloudName}/image/upload/`,
      ) ||
      !publicId.startsWith(`${ANNOUNCEMENT_FLYER_FOLDER}/`) ||
      !url.includes(publicId)
    ) {
      throw new BadRequestException(
        'The flyer must be uploaded through the configured Cloudinary account.',
      );
    }
  }
}
