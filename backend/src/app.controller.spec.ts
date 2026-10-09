import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return operational status and welcome message', () => {
      const result = appController.getRoot();
      expect(result.status).toBe('operational');
      expect(result.message).toContain('Welcome to NestJS Enterprise CRM Backend API');
    });
  });
});
