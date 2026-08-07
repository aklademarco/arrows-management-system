import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  NotFoundException,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuthenticatedGuard } from './authenticated.guard';
import { AuthenticatedUser } from './authenticated-user.decorator';
import type { AuthenticatedPrincipal } from './authenticated.guard';
import { CurrentUserRepository } from './current-user.repository';
import {
  ConfirmEmailVerificationDto,
  RequestEmailVerificationDto,
} from './dto/email-verification.dto';
import { LoginDto } from './dto/login.dto';
import {
  ConfirmPasswordResetDto,
  RequestPasswordResetDto,
} from './dto/password-reset.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginService } from './login.service';
import { PasswordResetService } from './password-reset.service';
import {
  clearRefreshCookie,
  readRefreshCookie,
  setRefreshCookie,
} from './refresh-cookie';
import { SessionService } from './session.service';
import type { RefreshTokenContext } from './refresh-token.repository';

function refreshContext(request: Request): RefreshTokenContext {
  const userAgent = request.headers['user-agent'];
  return {
    ipAddress: request.ip,
    userAgent: typeof userAgent === 'string' ? userAgent : undefined,
  };
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly loginService: LoginService,
    private readonly sessionService: SessionService,
    private readonly passwordResetService: PasswordResetService,
    private readonly currentUser: CurrentUserRepository,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.loginService.login(body, refreshContext(request));
    setRefreshCookie(response, result.refreshToken, result.refreshExpiresAt);
    return {
      success: true,
      message: 'Login successful.',
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.sessionService.refresh(
      readRefreshCookie(request),
      refreshContext(request),
    );
    setRefreshCookie(response, result.refreshToken, result.refreshExpiresAt);
    return {
      success: true,
      message: 'Session refreshed.',
      data: { accessToken: result.accessToken },
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.sessionService.logout(readRefreshCookie(request));
    clearRefreshCookie(response);
    return { success: true, message: 'Logged out.', data: null };
  }

  @Get('me')
  @UseGuards(AuthenticatedGuard)
  async me(@AuthenticatedUser() principal: AuthenticatedPrincipal) {
    const account = await this.currentUser.findAccount(principal.id);
    if (!account) {
      throw new NotFoundException('Account not found.');
    }
    return {
      success: true,
      message: 'Current account retrieved.',
      data: account,
    };
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: RegisterDto, @Ip() ip: string) {
    const result = await this.authService.register(body, ip);
    return {
      success: true,
      message: result.verificationEmailSent
        ? 'Registration received. Check your email to verify your address.'
        : 'Registration received. Request a new verification email to continue.',
      data: result,
    };
  }

  @Post('email-verification/request')
  @HttpCode(HttpStatus.OK)
  async requestEmailVerification(
    @Body() body: RequestEmailVerificationDto,
    @Ip() ip: string,
  ) {
    await this.authService.requestEmailVerification(body.email, ip);
    return {
      success: true,
      message: 'If verification is required, instructions have been sent.',
      data: null,
    };
  }

  @Post('email-verification/confirm')
  @HttpCode(HttpStatus.OK)
  async confirmEmailVerification(@Body() body: ConfirmEmailVerificationDto) {
    await this.authService.confirmEmailVerification(body.token);
    return {
      success: true,
      message:
        'Email verified. Your registration is ready for administrator review.',
      data: {
        emailVerified: true,
        accountStatus: 'PENDING_APPROVAL',
      },
    };
  }

  @Post('password-reset/request')
  @HttpCode(HttpStatus.OK)
  async requestPasswordReset(
    @Body() body: RequestPasswordResetDto,
    @Ip() ip: string,
  ) {
    await this.passwordResetService.requestReset(body.email, ip);
    return {
      success: true,
      message: 'If the account exists, reset instructions have been sent.',
      data: null,
    };
  }

  @Post('account-status')
  @HttpCode(HttpStatus.OK)
  async accountStatus(@Body() body: LoginDto) {
    return {
      success: true,
      message: 'Account status retrieved.',
      data: await this.loginService.accountStatus(body),
    };
  }

  @Post('password-reset/confirm')
  @HttpCode(HttpStatus.OK)
  async confirmPasswordReset(@Body() body: ConfirmPasswordResetDto) {
    await this.passwordResetService.confirmReset(body.token, body.newPassword);
    return {
      success: true,
      message: 'Password updated. Sign in with your new password.',
      data: null,
    };
  }
}
