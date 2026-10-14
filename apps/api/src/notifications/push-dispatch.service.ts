import {
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { FcmProvider } from './fcm.provider';
import { PushDeliveryRepository } from './push-delivery.repository';
import { pushTitle, skipPushReason } from './push-delivery-policy';

@Injectable()
export class PushDispatchService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PushDispatchService.name);
  private timer?: NodeJS.Timeout;
  private processing = false;
  private stopped = false;
  constructor(
    private readonly repository: PushDeliveryRepository,
    private readonly provider: FcmProvider,
  ) {}
  onModuleInit() {
    if (!this.provider.isConfigured()) {
      this.logger.log('Push delivery is disabled or not configured.');
      return;
    }
    this.timer = setInterval(() => void this.process(), 15000);
    this.timer.unref();
    void this.process();
  }
  onModuleDestroy() {
    this.stopped = true;
    if (this.timer) clearInterval(this.timer);
  }
  async process() {
    if (this.processing || this.stopped || !this.provider.isConfigured())
      return;
    this.processing = true;
    try {
      await this.repository.enqueue();
      for (let i = 0; i < 25 && !this.stopped; i++) {
        const claim = await this.repository.claimNext();
        if (!claim) break;
        const row = await this.repository.load(claim.id, claim.leaseId);
        if (!row) continue;
        const now = new Date();
        const reason = skipPushReason(row, now);
        if (reason) {
          await this.repository.finish(
            claim.id,
            claim.leaseId,
            'SKIPPED',
            reason,
          );
          continue;
        }
        if (row.delivery.attempts > 5) {
          await this.repository.finish(
            claim.id,
            claim.leaseId,
            'FAILED',
            'RETRY_LIMIT',
          );
          continue;
        }
        const expires = Math.min(
          row.notice.expiresAt?.getTime() ?? Infinity,
          row.notice.createdAt.getTime() + 86400000,
        );
        const result = await this.provider.send({
          token: row.device.token,
          notificationId: row.notice.id,
          title: pushTitle(row.notice.type),
          link: '/notifications',
          ttlSeconds: Math.floor((expires - now.getTime()) / 1000),
        });
        if (result.success)
          await this.repository.finish(claim.id, claim.leaseId, 'SENT');
        else {
          const retry = result.retryable && row.delivery.attempts < 5;
          const delay =
            Math.max(
              result.retryAfterMs ?? 0,
              60000 * 2 ** (row.delivery.attempts - 1),
            ) + Math.floor(Math.random() * 5000);
          await this.repository.finish(
            claim.id,
            claim.leaseId,
            retry ? 'QUEUED' : 'FAILED',
            result.code,
            retry ? new Date(Date.now() + delay) : undefined,
            result.invalidToken
              ? { id: row.device.id, generation: row.device.generation }
              : undefined,
          );
        }
      }
    } catch {
      this.logger.error(
        'Push delivery cycle failed; queued deliveries will be retried.',
      );
    } finally {
      this.processing = false;
    }
  }
}
