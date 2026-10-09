import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator';

@ApiTags('Root')
@Controller()
export class AppController {
  @Public()
  @Get()
  @ApiOperation({ summary: 'Welcome to CRM API' })
  @ApiResponse({ status: 200, description: 'Welcome message and API service directory' })
  getRoot() {
    return {
      message: '🚀 Welcome to NestJS Enterprise CRM Backend API',
      status: 'operational',
      version: '1.0.0',
      database: 'SQLite (Prisma ORM)',
      documentation: {
        swaggerUI: 'http://localhost:3000/docs',
        swaggerApiUI: 'http://localhost:3000/api/docs',
        openApiJson: 'http://localhost:3000/api/docs-json',
      },
      modules: [
        'Auth (/auth)',
        'Users (/users)',
        'Organizations (/organizations)',
        'Roles & Permissions (/roles, /permissions)',
        'Contacts (/contacts)',
        'Leads (/leads)',
        'Deals (/deals)',
        'Pipelines & Stages (/pipelines)',
        'Activities (/activities)',
        'Tasks (/tasks)',
        'Notes (/notes)',
        'Products (/products)',
        'Notifications (/notifications)',
        'Dashboard & Reports (/dashboard, /reports)',
        'Files (/files)',
        'Settings (/settings)',
      ],
      quickStart: {
        loginEndpoint: 'POST /auth/login',
        adminCredentials: 'admin@crm.com / Admin@123',
        salesRepCredentials: 'sarah.rep@crm.com / Rep@123',
      },
    };
  }

  @Public()
  @Get('api')
  @ApiOperation({ summary: 'API Root & Overview' })
  @ApiResponse({ status: 200, description: 'API root information' })
  getApiRoot() {
    return this.getRoot();
  }

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service health status' })
  getHealth() {
    return {
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
