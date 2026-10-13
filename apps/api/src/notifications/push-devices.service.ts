import { Injectable } from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../auth/authenticated.guard';
import { PushDevicesRepository } from './push-devices.repository';

@Injectable()
export class PushDevicesService {
  constructor(private readonly repository: PushDevicesRepository) {}

  async update(
    token: string,
    enabled: boolean,
    user: AuthenticatedPrincipal,
    previousSecret?: string,
  ) {
    const revocationSecret = await this.repository.update(
      token,
      enabled,
      user,
      false,
      previousSecret,
    );
    return { enabled, ...(revocationSecret ? { revocationSecret } : {}) };
  }
}
