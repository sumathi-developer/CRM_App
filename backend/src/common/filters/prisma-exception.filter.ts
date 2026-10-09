import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response, Request } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal database error';

    switch (exception.code) {
      case 'P2002': {
        status = HttpStatus.CONFLICT;
        const target = (exception.meta?.target as string[]) || 'Field';
        message = `Unique constraint failed on field(s): ${Array.isArray(target) ? target.join(', ') : target}`;
        break;
      }
      case 'P2025': {
        status = HttpStatus.NOT_FOUND;
        message = (exception.meta?.cause as string) || 'Record not found';
        break;
      }
      case 'P2003': {
        status = HttpStatus.BAD_REQUEST;
        message = 'Foreign key constraint violated';
        break;
      }
      case 'P2000': {
        status = HttpStatus.BAD_REQUEST;
        message = 'Value provided for a field is too long';
        break;
      }
      default:
        message = `Database query error: ${exception.message}`;
        break;
    }

    this.logger.error(
      `${request.method} ${request.url} - Code: ${exception.code} - Message: ${message}`,
    );

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      errorCode: exception.code,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
