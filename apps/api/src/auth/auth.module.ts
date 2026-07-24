import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegistrationRepository } from './registration.repository';

@Module({
  controllers: [AuthController],
  providers: [AuthService, RegistrationRepository],
})
export class AuthModule {}
