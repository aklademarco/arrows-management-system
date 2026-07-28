import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminRegistrationController } from './admin-registration.controller';
import { AdminRegistrationRepository } from './admin-registration.repository';
import { AdminRegistrationService } from './admin-registration.service';
import { AdminUserController } from './admin-user.controller';
import { AdminUserRepository } from './admin-user.repository';
import { AdminUserService } from './admin-user.service';

@Module({
  imports: [AuthModule],
  controllers: [AdminRegistrationController, AdminUserController],
  providers: [
    AdminRegistrationRepository,
    AdminRegistrationService,
    AdminUserRepository,
    AdminUserService,
  ],
})
export class AdminModule {}
