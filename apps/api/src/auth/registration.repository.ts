import {
  BadRequestException,
  ConflictException,
  HttpException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { and, eq, or } from 'drizzle-orm';
import { DATABASE } from '../database/database.module';
import type { Database } from '../database/database.module';
import {
  accountActionTokens,
  departments,
  memberProfiles,
  users,
} from '../database/schema';

export type NewRegistration = {
  churchId: string;
  email: string;
  phone?: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  otherNames?: string;
  requestedDepartmentId?: string;
  tokenHash: string;
  tokenExpiresAt: Date;
  requestedIp?: string;
};

@Injectable()
export class RegistrationRepository {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  async create(input: NewRegistration): Promise<string> {
    try {
      return await this.database.transaction(async (transaction) => {
        const duplicateConditions = [eq(users.email, input.email)];
        if (input.phone) {
          duplicateConditions.push(eq(users.phone, input.phone));
        }

        const duplicate = await transaction
          .select({ email: users.email, phone: users.phone })
          .from(users)
          .where(or(...duplicateConditions))
          .limit(1);

        if (duplicate.length > 0) {
          throw new ConflictException(
            duplicate[0].email === input.email
              ? 'An account with this email already exists.'
              : 'An account with this phone number already exists.',
          );
        }

        if (input.requestedDepartmentId) {
          const department = await transaction
            .select({ id: departments.id })
            .from(departments)
            .where(
              and(
                eq(departments.id, input.requestedDepartmentId),
                eq(departments.churchId, input.churchId),
              ),
            )
            .limit(1);
          if (department.length === 0) {
            throw new BadRequestException(
              'The requested department does not exist.',
            );
          }
        }

        const [user] = await transaction
          .insert(users)
          .values({
            churchId: input.churchId,
            email: input.email,
            phone: input.phone,
            passwordHash: input.passwordHash,
          })
          .returning({ id: users.id });

        await transaction.insert(memberProfiles).values({
          userId: user.id,
          firstName: input.firstName,
          lastName: input.lastName,
          otherNames: input.otherNames,
          requestedDepartmentId: input.requestedDepartmentId,
        });

        await transaction.insert(accountActionTokens).values({
          userId: user.id,
          type: 'EMAIL_VERIFICATION',
          tokenHash: input.tokenHash,
          expiresAt: input.tokenExpiresAt,
          requestedIp: input.requestedIp,
        });

        return user.id;
      });
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === '23505'
      ) {
        throw new ConflictException('This account already exists.');
      }
      throw error;
    }
  }
}
