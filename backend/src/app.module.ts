import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import appConfig from './config/app.config';
import { DatabaseModule } from './database/database.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { RolesModule } from './roles/roles.module';
import { ContactsModule } from './contacts/contacts.module';
import { LeadsModule } from './leads/leads.module';
import { DealsModule } from './deals/deals.module';
import { PipelinesModule } from './pipelines/pipelines.module';
import { ActivitiesModule } from './activities/activities.module';
import { TasksModule } from './tasks/tasks.module';
import { NotesModule } from './notes/notes.module';
import { ProductsModule } from './products/products.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ReportsModule } from './reports/reports.module';
import { FilesModule } from './files/files.module';
import { SettingsModule } from './settings/settings.module';
import { CalendarModule } from './calendar/calendar.module';
import { AppController } from './app.controller';

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig, appConfig],
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    OrganizationsModule,
    RolesModule,
    ContactsModule,
    LeadsModule,
    DealsModule,
    PipelinesModule,
    ActivitiesModule,
    TasksModule,
    NotesModule,
    ProductsModule,
    NotificationsModule,
    ReportsModule,
    FilesModule,
    SettingsModule,
    CalendarModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: PrismaExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
