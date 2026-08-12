import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { AdminModule } from './admin/admin.module';
import { MembersModule } from './members/members.module';
import { DepartmentsModule } from './departments/departments.module';
import { AttendanceModule } from './attendance/attendance.module';
import { EventsModule } from './events/events.module';
import { AbsenceRequestsModule } from './absence-requests/absence-requests.module';
import { LeaderboardsModule } from './leaderboards/leaderboards.module';
import { ReportsModule } from './reports/reports.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PastoralCareModule } from './pastoral-care/pastoral-care.module';
import { MinistryContentModule } from './ministry-content/ministry-content.module';
import { LeadershipMessagesModule } from './leadership-messages/leadership-messages.module';
import { LiturgiesModule } from './liturgies/liturgies.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '.env'],
    }),
    DatabaseModule,
    HealthModule,
    AuthModule,
    AdminModule,
    MembersModule,
    DepartmentsModule,
    AttendanceModule,
    EventsModule,
    AbsenceRequestsModule,
    LeaderboardsModule,
    ReportsModule,
    AuditLogsModule,
    NotificationsModule,
    PastoralCareModule,
    MinistryContentModule,
    LeadershipMessagesModule,
    LiturgiesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
