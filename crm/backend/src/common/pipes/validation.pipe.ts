import {
  ValidationPipe,
  ValidationPipeOptions,
  BadRequestException,
} from '@nestjs/common';

export const createValidationPipe = (options?: ValidationPipeOptions) => {
  return new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: false,
    transformOptions: {
      enableImplicitConversion: true,
    },
    exceptionFactory: (errors) => {
      const formattedErrors = errors.map((err) => ({
        property: err.property,
        constraints: err.constraints,
      }));
      return new BadRequestException({
        message: 'Validation failed',
        errors: formattedErrors,
      });
    },
    ...options,
  });
};
