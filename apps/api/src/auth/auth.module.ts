import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailVerificationRepository } from './email-verification.repository';
import { RegistrationRepository } from './registration.repository';

@Module({
  imports: [MailModule],
  controllers: [AuthController],
  providers: [AuthService, RegistrationRepository, EmailVerificationRepository],
})
export class AuthModule {}
