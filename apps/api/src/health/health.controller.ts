import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { HealthService } from './health.service';

@SkipThrottle({
  default: true,
})
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async check() {
    return {
      success: true,
      message: 'Service is healthy.',
      data: await this.healthService.check(),
    };
  }
}
