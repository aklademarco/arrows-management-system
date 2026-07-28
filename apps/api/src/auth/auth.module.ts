import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MailModule } from '../mail/mail.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailVerificationRepository } from './email-verification.repository';
import { RegistrationRepository } from './registration.repository';
import { AdminGuard } from './admin.guard';
import { LoginRepository } from './login.repository';
import { LoginService } from './login.service';
import { AuthenticatedGuard } from './authenticated.guard';

@Module({
  imports: [MailModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    AuthService,
    RegistrationRepository,
    EmailVerificationRepository,
    LoginRepository,
    LoginService,
    AdminGuard,
    AuthenticatedGuard,
  ],
  exports: [JwtModule, LoginRepository, AdminGuard, AuthenticatedGuard],
})
export class AuthModule {}
