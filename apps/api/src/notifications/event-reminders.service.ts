import {
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { EventRemindersRepository } from './event-reminders.repository';

@Injectable()
export class EventRemindersService implements OnModuleInit, OnModuleDestroy {
  private timer?: NodeJS.Timeout;
  private processing = false;
  private readonly logger = new Logger(EventRemindersService.name);
  constructor(private readonly repository: EventRemindersRepository) {}
  onModuleInit() {
    this.timer = setInterval(() => void this.process(), 60000);
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
      await this.repository.queueDue();
    } catch {
      this.logger.error('Event reminder cycle failed; it will retry.');
    } finally {
      this.processing = false;
    }
  }
}
