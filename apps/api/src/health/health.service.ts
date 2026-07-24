import {
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DATABASE } from '../database/database.module';
import type { Database } from '../database/database.module';

@Injectable()
export class HealthService {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  async check(): Promise<{
    status: 'healthy';
    database: 'connected';
    timestamp: string;
  }> {
    try {
      await this.database.execute(sql`select 1`);
    } catch {
      throw new ServiceUnavailableException('Database is unavailable.');
    }

    return {
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
    };
  }
}
