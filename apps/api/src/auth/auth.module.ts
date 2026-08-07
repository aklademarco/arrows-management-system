import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MailModule } from '../mail/mail.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailVerificationRepository } from './email-verification.repository';
import { RegistrationRepository } from './registration.repository';
import { AdminGuard } from './admin.guard';
import { AccessTokenService } from './access-token.service';
import { CurrentUserRepository } from './current-user.repository';
import { LoginRepository } from './login.repository';
import { LoginService } from './login.service';
import { PasswordResetRepository } from './password-reset.repository';
import { PasswordResetService } from './password-reset.service';
import { RefreshTokenRepository } from './refresh-token.repository';
import { SessionService } from './session.service';
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
    AccessTokenService,
    RefreshTokenRepository,
    SessionService,
    CurrentUserRepository,
    PasswordResetRepository,
    PasswordResetService,
    AdminGuard,
    AuthenticatedGuard,
  ],
  exports: [JwtModule, LoginRepository, AdminGuard, AuthenticatedGuard],
})
export class AuthModule {}
