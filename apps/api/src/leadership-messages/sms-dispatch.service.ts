import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ArkeselSmsProvider } from './arkesel-sms.provider';
import { LeadershipMessagesRepository } from './leadership-messages.repository';

@Injectable()
export class SmsDispatchService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SmsDispatchService.name);
  private timer?: NodeJS.Timeout;
  private processing = false;

  constructor(
    private readonly repository: LeadershipMessagesRepository,
    private readonly provider: ArkeselSmsProvider,
  ) {}

  onModuleInit() {
    if (!this.provider.isConfigured()) {
      this.logger.log('SMS delivery is disabled or not configured.');
      return;
    }
    this.timer = setInterval(() => void this.process(), 30_000);
    this.timer.unref();
    void this.process();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async process() {
    if (this.processing || !this.provider.isConfigured()) return;
    this.processing = true;
    try {
      const queued = await this.repository.claimSmsBatch();
      for (const item of queued) {
        if (!item.phone) {
          await this.repository.markSmsFailed(item.id, item.retryCount + 1, 'Recipient has no phone number.', false);
          continue;
        }
        const result = await this.provider.send(item.phone, `${item.title}\n${item.message}`);
        if (result.success) await this.repository.markSmsSent(item.id, result.providerId);
        else await this.repository.markSmsFailed(item.id, item.retryCount + 1, result.error, result.retryable);
      }
      const awaiting = await this.repository.sentSmsAwaitingDelivery();
      for (const item of awaiting) {
        if (!item.providerId) continue;
        const status = await this.provider.deliveryStatus(item.providerId);
        if (status === 'DELIVERED') await this.repository.markSmsDelivered(item.id);
      }
    } catch (error) {
      this.logger.error('SMS delivery cycle failed.', error instanceof Error ? error.stack : undefined);
    } finally {
      this.processing = false;
    }
  }
}
