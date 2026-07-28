import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminRegistrationController } from './admin-registration.controller';
import { AdminRegistrationRepository } from './admin-registration.repository';
import { AdminRegistrationService } from './admin-registration.service';

@Module({
  imports: [AuthModule],
  controllers: [AdminRegistrationController],
  providers: [AdminRegistrationRepository, AdminRegistrationService],
})
export class AdminModule {}
