import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { AttendanceRepository } from './attendance.repository';

@Injectable()
export class AttendanceLifecycleService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(AttendanceLifecycleService.name);
  private timer?: NodeJS.Timeout;
  private processing = false;

  constructor(private readonly repository: AttendanceRepository) {}

  onModuleInit() {
    if (process.env.NODE_ENV === 'test') return;
    this.timer = setInterval(() => void this.process(), 5 * 60_000);
    this.timer.unref();
    void this.process();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async process(now = new Date()) {
    if (this.processing) return;
    this.processing = true;
    try {
      await this.repository.materializeRecurringEvents(now);
      const dueEvents = await this.repository.dueEventsForFinalization(now);
      let finalizedCount = 0;
      for (const event of dueEvents) {
        try {
          await this.repository.finalizeEvent(
            event.id,
            {
              id: event.createdBy,
              churchId: event.churchId,
              email: 'system@arrows.local',
              roles: ['SYSTEM'],
            },
            now,
          );
          finalizedCount += 1;
        } catch (error) {
          this.logger.error(
            `Could not automatically finalize event ${event.id}.`,
            error instanceof Error ? error.stack : undefined,
          );
        }
      }
      if (finalizedCount)
        this.logger.log(
          `Automatically finalized ${finalizedCount} attendance event(s).`,
        );
    } catch (error) {
      this.logger.error(
        'Attendance lifecycle cycle failed.',
        error instanceof Error ? error.stack : undefined,
      );
    } finally {
      this.processing = false;
    }
  }
}
