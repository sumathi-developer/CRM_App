import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { createValidationPipe } from './common/pipes/validation.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global Validation Pipe
  app.useGlobalPipes(createValidationPipe());

  // Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('CRM Backend REST API')
    .setDescription('Complete enterprise CRM REST API built with NestJS, Prisma ORM, and SQLite database.')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter your JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Auth', 'Authentication, user registration, token refresh, and password management')
    .addTag('Users', 'User management, status updates, roles, and related activities/deals')
    .addTag('Organizations', 'Company and customer account management')
    .addTag('Roles & Permissions', 'Role-based access control and permission management')
    .addTag('Contacts', 'Contact management and conversion to deals')
    .addTag('Leads', 'Lead tracking, scoring, pipeline assignment, and conversion')
    .addTag('Deals', 'Opportunity and revenue pipeline stages')
    .addTag('Pipelines & Stages', 'Customizable sales pipelines and stage management')
    .addTag('Activities', 'Calls, meetings, emails, and follow-ups')
    .addTag('Tasks', 'Task assignment, due dates, and completion tracking')
    .addTag('Notes', 'Notes attached to contacts, leads, and deals')
    .addTag('Products', 'Product catalog and deal pricing')
    .addTag('Notifications', 'In-app user notifications')
    .addTag('Dashboard & Reports', 'Business analytics, revenue stats, and sales reports')
    .addTag('Files', 'Attachment and file upload management')
    .addTag('Settings', 'System and user preference settings')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 CRM Backend Server running at: http://localhost:${port}`);
  console.log(`📚 Swagger Documentation available at: http://localhost:${port}/docs and http://localhost:${port}/api/docs`);
}

bootstrap();
