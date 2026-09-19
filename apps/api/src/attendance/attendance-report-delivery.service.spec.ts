import type { EmailDelivery } from '../mail/email-delivery';
import type { AttendanceReportDeliveryRepository } from './attendance-report-delivery.repository';
import { AttendanceReportDeliveryService } from './attendance-report-delivery.service';
import type { AttendanceReportPdfService } from './attendance-report-pdf.service';

describe('AttendanceReportDeliveryService', () => {
  const report = {
    id: 'delivery-1',
    eventId: 'event-1',
    churchId: 'church-1',
    churchName: 'Arrows',
    timezone: 'Africa/Accra',
    eventName: 'Sunday Service',
    startsAt: new Date('2026-09-20T08:40:00.000Z'),
    endsAt: new Date('2026-09-20T12:00:00.000Z'),
    recipientEmail: 'leader@example.com',
    recipientName: 'Team Leader',
    departmentId: 'department-1',
    departmentName: 'Media',
    records: [
      {
        memberId: 'member-1',
        firstName: 'Present',
        lastName: 'Member',
        status: 'ON_TIME' as const,
        punctualityStatus: 'ON_TIME' as const,
        checkedInAt: new Date('2026-09-20T08:35:00.000Z'),
      },
      {
        memberId: 'member-2',
        firstName: 'Absent',
        lastName: 'Member',
        status: 'ABSENT' as const,
        punctualityStatus: null,
        checkedInAt: null,
      },
      {
        memberId: 'member-3',
        firstName: 'Excused',
        lastName: 'Member',
        status: 'EXCUSED' as const,
        punctualityStatus: null,
        checkedInAt: null,
      },
    ],
  };

  it('emails a department-scoped PDF with present, absent, and permission totals', async () => {
    const markSent = jest.fn().mockResolvedValue(undefined);
    const repository = {
      queueFinalizedEvents: jest.fn().mockResolvedValue({ deliveryCount: 1 }),
      claimBatch: jest
        .fn()
        .mockResolvedValue([{ id: 'delivery-1', retryCount: 0 }]),
      reportData: jest.fn().mockResolvedValue(report),
      markSent,
      markFailed: jest.fn().mockResolvedValue(undefined),
    } as unknown as AttendanceReportDeliveryRepository;
    const pdf = {
      generate: jest.fn().mockResolvedValue(Buffer.from('%PDF-test')),
    } as unknown as AttendanceReportPdfService;
    const email = {
      sendVerificationEmail: jest.fn(),
      sendPasswordResetEmail: jest.fn(),
      sendAttendanceReportEmail: jest.fn().mockResolvedValue(undefined),
    } satisfies EmailDelivery;
    const service = new AttendanceReportDeliveryService(repository, pdf, email);

    await service.process();

    expect(email.sendAttendanceReportEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        recipient: 'leader@example.com',
        scopeLabel: 'Media',
        presentCount: 1,
        absentCount: 1,
        excusedCount: 1,
        attachment: expect.objectContaining({
          filename: 'sunday-service-attendance-2026-09-20.pdf',
        }) as object,
      }),
    );
    expect(markSent).toHaveBeenCalledWith('delivery-1', 'church-1', 'event-1');
  });

  it('queues a retry when email delivery fails', async () => {
    const markSent = jest.fn();
    const markFailed = jest.fn().mockResolvedValue(undefined);
    const repository = {
      queueFinalizedEvents: jest.fn().mockResolvedValue({ deliveryCount: 1 }),
      claimBatch: jest
        .fn()
        .mockResolvedValue([{ id: 'delivery-1', retryCount: 1 }]),
      reportData: jest.fn().mockResolvedValue(report),
      markSent,
      markFailed,
    } as unknown as AttendanceReportDeliveryRepository;
    const pdf = {
      generate: jest.fn().mockResolvedValue(Buffer.from('%PDF-test')),
    } as unknown as AttendanceReportPdfService;
    const email = {
      sendVerificationEmail: jest.fn(),
      sendPasswordResetEmail: jest.fn(),
      sendAttendanceReportEmail: jest
        .fn()
        .mockRejectedValue(new Error('Resend unavailable')),
    } satisfies EmailDelivery;
    const service = new AttendanceReportDeliveryService(repository, pdf, email);

    await service.process();

    expect(markFailed).toHaveBeenCalledWith(
      'delivery-1',
      2,
      'Resend unavailable',
    );
    expect(markSent).not.toHaveBeenCalled();
  });
});
