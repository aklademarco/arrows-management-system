import { ServiceUnavailableException } from '@nestjs/common';
import type { Database } from '../database/database.module';
import { HealthService } from './health.service';

describe('HealthService', () => {
  it('reports a connected database', async () => {
    const database = {
      execute: jest.fn().mockResolvedValue({ rows: [{ '?column?': 1 }] }),
    } as unknown as Database;
    const service = new HealthService(database);

    await expect(service.check()).resolves.toMatchObject({
      status: 'healthy',
      database: 'connected',
    });
  });

  it('returns an unavailable error when the database query fails', async () => {
    const database = {
      execute: jest.fn().mockRejectedValue(new Error('connection refused')),
    } as unknown as Database;
    const service = new HealthService(database);

    await expect(service.check()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
