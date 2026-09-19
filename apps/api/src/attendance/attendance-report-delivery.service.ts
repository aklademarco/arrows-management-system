import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { EMAIL_DELIVERY, type EmailDelivery } from '../mail/email-delivery';
import { AttendanceReportDeliveryRepository } from './attendance-report-delivery.repository';
import { AttendanceReportPdfService } from './attendance-report-pdf.service';

const PRESENT_STATUSES = new Set(['EARLY', 'ON_TIME', 'LATE']);

@Injectable()
export class AttendanceReportDeliveryService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(AttendanceReportDeliveryService.name);
  private timer?: NodeJS.Timeout;
  private processing = false;

  constructor(
    private readonly repository: AttendanceReportDeliveryRepository,
    private readonly pdf: AttendanceReportPdfService,
    @Inject(EMAIL_DELIVERY) private readonly emailDelivery: EmailDelivery,
  ) {}

  onModuleInit() {
    if (process.env.NODE_ENV === 'test') return;
    this.timer = setInterval(() => void this.process(), 60_000);
    this.timer.unref();
    void this.process();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async process() {
    if (this.processing) return;
    this.processing = true;
    try {
      await this.repository.queueFinalizedEvents();
      const deliveries = await this.repository.claimBatch();
      for (const delivery of deliveries) {
        try {
          const report = await this.repository.reportData(delivery.id);
          if (!report) throw new Error('Attendance report delivery not found.');
          const scopeLabel = report.departmentName ?? 'Whole church';
          const pdf = await this.pdf.generate({
            churchName: report.churchName,
            eventName: report.eventName,
            startsAt: report.startsAt,
            endsAt: report.endsAt,
            timezone: report.timezone,
            scopeLabel,
            records: report.records,
          });
          const presentCount = report.records.filter((record) =>
            PRESENT_STATUSES.has(record.status),
          ).length;
          const absentCount = report.records.filter(
            (record) => record.status === 'ABSENT',
          ).length;
          const excusedCount = report.records.filter(
            (record) => record.status === 'EXCUSED',
          ).length;
          const serviceDate = new Intl.DateTimeFormat('en-GH', {
            dateStyle: 'medium',
            timeZone: report.timezone,
          }).format(report.startsAt);
          await this.emailDelivery.sendAttendanceReportEmail({
            recipient: report.recipientEmail,
            recipientName: report.recipientName,
            eventName: report.eventName,
            serviceDate,
            scopeLabel,
            presentCount,
            absentCount,
            excusedCount,
            attachment: {
              filename: this.filename(report.eventName, report.startsAt),
              content: pdf,
            },
          });
          await this.repository.markSent(
            delivery.id,
            report.churchId,
            report.eventId,
          );
        } catch (error) {
          const reason =
            error instanceof Error ? error.message : 'Email delivery failed.';
          await this.repository.markFailed(
            delivery.id,
            delivery.retryCount + 1,
            reason,
          );
          this.logger.error(
            `Attendance report delivery ${delivery.id} failed: ${reason}`,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        'Attendance report delivery cycle failed.',
        error instanceof Error ? error.stack : undefined,
      );
    } finally {
      this.processing = false;
    }
  }

  private filename(eventName: string, startsAt: Date) {
    const safeName = eventName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60);
    return `${safeName || 'service'}-attendance-${startsAt.toISOString().slice(0, 10)}.pdf`;
  }
}
