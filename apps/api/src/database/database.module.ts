import { Global, Module } from '@nestjs/common';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

export const DATABASE = Symbol('DATABASE');
export type Database = NodePgDatabase<typeof schema>;

@Global()
@Module({
  providers: [
    {
      provide: DATABASE,
      useFactory: (): Database => {
        const connectionString = process.env.DATABASE_URL;
        if (!connectionString) {
          throw new Error('DATABASE_URL is required');
        }

        return drizzle(
          new Pool({
            connectionString,
            max: 10,
            ssl:
              process.env.NODE_ENV === 'production'
                ? { rejectUnauthorized: true }
                : undefined,
          }),
          { schema },
        );
      },
    },
  ],
  exports: [DATABASE],
})
export class DatabaseModule {}
