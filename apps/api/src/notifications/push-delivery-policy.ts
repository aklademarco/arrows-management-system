import type { PushDeliveryRepository } from './push-delivery.repository';
type Delivery = NonNullable<
  Awaited<ReturnType<PushDeliveryRepository['load']>>
>;

export function skipPushReason(row: Delivery, now: Date): string | null {
  const { device, notice, delivery } = row;
  if (
    device.revokedAt ||
    device.expiresAt <= now ||
    device.generation !== delivery.deviceGeneration ||
    device.userId !== notice.recipientUserId ||
    device.churchId !== notice.churchId ||
    row.accountChurchId !== notice.churchId ||
    row.accountStatus !== 'ACTIVE'
  )
    return 'RECIPIENT_UNAVAILABLE';
  if (device.approvalOnly && notice.type !== 'ACCOUNT_APPROVED')
    return 'APPROVAL_ONLY';
  if (
    (notice.expiresAt && notice.expiresAt <= now) ||
    notice.createdAt.getTime() <= now.getTime() - 86400000
  )
    return 'EXPIRED';
  if (notice.eventId && notice.type !== 'EVENT_CANCELLED') {
    if (
      !row.eventStatus ||
      ['CANCELLED', 'COMPLETED', 'DRAFT'].includes(row.eventStatus)
    )
      return 'EVENT_UNAVAILABLE';
    if (
      notice.eventStartsAt &&
      row.currentEventStart?.getTime() !== notice.eventStartsAt.getTime()
    )
      return 'EVENT_RESCHEDULED';
  }
  return null;
}

export function pushTitle(type: string) {
  return (
    (
      {
        LEADERSHIP_MESSAGE: 'New church message',
        EVENT_CREATED: 'New church event',
        EVENT_UPDATED: 'Event details changed',
        EVENT_CANCELLED: 'Event cancelled',
        EVENT_REMINDER: 'Upcoming event reminder',
        DUTY_ASSIGNED: 'New service assignment',
        DUTY_REMOVED: 'Service assignment changed',
        ACCOUNT_APPROVED: 'Your account is approved',
        DEPARTMENT_CHANGED: 'Department assignment changed',
        LEADERSHIP_CHANGED: 'Leadership assignment changed',
      } as Record<string, string>
    )[type] ?? 'New church update'
  );
}
