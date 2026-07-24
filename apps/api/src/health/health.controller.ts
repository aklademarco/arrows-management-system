import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

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
