import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { IsString, Matches } from 'class-validator';
import { PushDevicesRepository } from './push-devices.repository';

export class RevokePushDeviceDto {
  @IsString()
  @Matches(/^[a-f0-9]{64}$/)
  secret!: string;
}

@Controller('push-devices')
export class PushDeviceCleanupController {
  constructor(private readonly repository: PushDevicesRepository) {}
  @Post('revoke')
  @HttpCode(200)
  async revoke(@Body() input: RevokePushDeviceDto) {
    await this.repository.revokeBySecret(input.secret);
    return { success: true };
  }
}
