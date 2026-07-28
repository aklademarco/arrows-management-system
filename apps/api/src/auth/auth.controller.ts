import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ConfirmEmailVerificationDto,
  RequestEmailVerificationDto,
} from './dto/email-verification.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginService } from './login.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly loginService: LoginService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginDto) {
    return {
      success: true,
      message: 'Login successful.',
      data: await this.loginService.login(body),
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
}
