import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MembersController } from './members.controller';
import { MembersRepository } from './members.repository';
import { MembersService } from './members.service';

@Module({
  imports: [AuthModule],
  controllers: [MembersController],
  providers: [MembersRepository, MembersService],
  // Reused for leadership checks (e.g. who may publish feed posts).
  exports: [MembersRepository],
})
export class MembersModule {}
