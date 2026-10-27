import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { CustomFieldsService } from './custom-fields.service';
import { CustomFieldValidationService } from './custom-field-validation.service';
import { CustomFieldEntityType } from '../enums/custom-field-entity-type.enum';
import { CustomFieldType } from '../enums/custom-field-type.enum';

describe('CustomFieldsService', () => {
  let service: CustomFieldsService;
  let prismaMock: any;
  let validationServiceMock: any;

  beforeEach(() => {
    prismaMock = {
      customField: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      customFieldOption: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn(),
        updateMany: vi.fn(),
      },
      $transaction: vi.fn((callbackOrPromises) => {
        if (typeof callbackOrPromises === 'function') {
          return callbackOrPromises(prismaMock);
        }
        return Promise.all(callbackOrPromises);
      }),
    };

    validationServiceMock = {
      validateFieldValue: vi.fn().mockResolvedValue({ isValid: true, sanitizedValue: 'valid' }),
    };

    service = new CustomFieldsService(prismaMock, validationServiceMock);
  });

  describe('create', () => {
    it('should create a custom field with generated key', async () => {
      prismaMock.customField.findFirst.mockResolvedValue(null);
      prismaMock.customField.create.mockResolvedValue({
        id: 'cf-1',
        name: 'Budget Estimate',
        key: 'budget_estimate',
        entityType: CustomFieldEntityType.DEAL,
        fieldType: CustomFieldType.CURRENCY,
        options: [],
      });

      const result = await service.create({
        name: 'Budget Estimate',
        entityType: CustomFieldEntityType.DEAL,
        fieldType: CustomFieldType.CURRENCY,
      });

      expect(result.id).toBe('cf-1');
      expect(prismaMock.customField.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if field key already exists', async () => {
      prismaMock.customField.findFirst.mockResolvedValue({ id: 'existing-id' });

      await expect(
        service.create({
          name: 'Budget Estimate',
          key: 'budget_estimate',
          entityType: CustomFieldEntityType.DEAL,
          fieldType: CustomFieldType.CURRENCY,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException if DROPDOWN field has no options', async () => {
      prismaMock.customField.findFirst.mockResolvedValue(null);

      await expect(
        service.create({
          name: 'Deal Priority',
          entityType: CustomFieldEntityType.DEAL,
          fieldType: CustomFieldType.DROPDOWN,
          options: [],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if defaultValue fails validation', async () => {
      prismaMock.customField.findFirst.mockResolvedValue(null);
      validationServiceMock.validateFieldValue.mockResolvedValue({
        isValid: false,
        error: { message: 'Value out of bounds' },
      });

      await expect(
        service.create({
          name: 'Deal Discount',
          entityType: CustomFieldEntityType.DEAL,
          fieldType: CustomFieldType.PERCENTAGE,
          defaultValue: 150,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return paginated accessible fields for user', async () => {
      prismaMock.customField.count.mockResolvedValue(2);
      prismaMock.customField.findMany.mockResolvedValue([
        { id: 'cf-1', name: 'Field 1', readRoles: ['SALES_REP', 'ADMIN'], options: [] },
        { id: 'cf-2', name: 'Field 2', readRoles: ['ADMIN'], options: [] },
      ]);

      const result = await service.findAll(
        { entityType: CustomFieldEntityType.DEAL, page: 1, limit: 10 },
        { role: 'SALES_REP' },
      );

      expect(result.data.length).toBe(1);
      expect(result.data[0].id).toBe('cf-1');
      expect(result.meta.total).toBe(2);
    });

    it('should allow super admin to view all fields regardless of readRoles', async () => {
      prismaMock.customField.count.mockResolvedValue(2);
      prismaMock.customField.findMany.mockResolvedValue([
        { id: 'cf-1', name: 'Field 1', readRoles: ['ADMIN'], options: [] },
        { id: 'cf-2', name: 'Field 2', readRoles: ['MANAGER'], options: [] },
      ]);

      const result = await service.findAll(
        { entityType: CustomFieldEntityType.DEAL },
        { role: 'ADMIN' },
      );

      expect(result.data.length).toBe(2);
    });
  });

  describe('findOne', () => {
    it('should return custom field when found', async () => {
      prismaMock.customField.findUnique.mockResolvedValue({
        id: 'cf-1',
        name: 'Field 1',
        readRoles: [],
        options: [],
        typeHistories: [],
      });

      const field = await service.findOne('cf-1');
      expect(field.id).toBe('cf-1');
    });

    it('should throw NotFoundException when field does not exist', async () => {
      prismaMock.customField.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user lacks read role', async () => {
      prismaMock.customField.findUnique.mockResolvedValue({
        id: 'cf-1',
        name: 'Secret Field',
        readRoles: ['ADMIN'],
        options: [],
        typeHistories: [],
      });

      await expect(service.findOne('cf-1', { role: 'SALES_REP' })).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('update', () => {
    it('should update field attributes', async () => {
      prismaMock.customField.findUnique.mockResolvedValue({
        id: 'cf-1',
        name: 'Old Name',
        readRoles: [],
        options: [],
        typeHistories: [],
      });
      prismaMock.customField.update.mockResolvedValue({
        id: 'cf-1',
        name: 'New Name',
        options: [],
      });

      const result = await service.update('cf-1', { name: 'New Name' });
      expect(result.name).toBe('New Name');
    });
  });

  describe('remove', () => {
    it('should soft-delete / archive by default', async () => {
      prismaMock.customField.findUnique.mockResolvedValue({
        id: 'cf-1',
        name: 'Test Field',
      });
      prismaMock.customField.update.mockResolvedValue({
        id: 'cf-1',
        name: 'Test Field',
        isArchived: true,
        isActive: false,
      });

      const res = await service.remove('cf-1', false);
      expect(res.success).toBe(true);
      expect(prismaMock.customField.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'cf-1' },
          data: { isArchived: true, isActive: false },
        }),
      );
    });

    it('should hard delete when hardDelete is true', async () => {
      prismaMock.customField.findUnique.mockResolvedValue({
        id: 'cf-1',
        name: 'Test Field',
      });
      prismaMock.customField.delete.mockResolvedValue({ id: 'cf-1' });

      const res = await service.remove('cf-1', true);
      expect(res.success).toBe(true);
      expect(prismaMock.customField.delete).toHaveBeenCalledWith({ where: { id: 'cf-1' } });
    });
  });

  describe('getLayout', () => {
    it('should organize fields into ordered sections', async () => {
      prismaMock.customField.findMany.mockResolvedValue([
        {
          id: 'f1',
          name: 'Section A Field 2',
          key: 'saf2',
          entityType: CustomFieldEntityType.LEAD,
          fieldType: CustomFieldType.TEXT,
          section: 'Section A',
          order: 2,
          isRequired: false,
          isUnique: false,
          isVisible: true,
          isSearchable: true,
          isFilterable: true,
          isEditable: true,
          gridWidth: 6,
          readRoles: [],
          editRoles: [],
          options: [],
        },
        {
          id: 'f2',
          name: 'Section A Field 1',
          key: 'saf1',
          entityType: CustomFieldEntityType.LEAD,
          fieldType: CustomFieldType.TEXT,
          section: 'Section A',
          order: 1,
          isRequired: false,
          isUnique: false,
          isVisible: true,
          isSearchable: true,
          isFilterable: true,
          isEditable: true,
          gridWidth: 6,
          readRoles: [],
          editRoles: [],
          options: [],
        },
      ]);

      const layout = await service.getLayout(CustomFieldEntityType.LEAD);
      expect(layout.entityType).toBe(CustomFieldEntityType.LEAD);
      expect(layout.layout.length).toBe(1);
      expect(layout.layout[0].name).toBe('Section A');
      expect(layout.layout[0].fields[0].id).toBe('f2');
      expect(layout.layout[0].fields[1].id).toBe('f1');
    });
  });

  describe('Options Management', () => {
    it('should add option to dropdown field', async () => {
      prismaMock.customField.findUnique.mockResolvedValue({
        id: 'cf-1',
        name: 'Deal Stage Status',
        fieldType: CustomFieldType.DROPDOWN,
        readRoles: [],
        options: [],
        typeHistories: [],
      });
      prismaMock.customFieldOption.findUnique.mockResolvedValue(null);
      prismaMock.customFieldOption.create.mockResolvedValue({
        id: 'opt-1',
        fieldId: 'cf-1',
        label: 'Tier 1',
        value: 'tier_1',
      });

      const opt = await service.addOption('cf-1', { label: 'Tier 1', value: 'tier_1' });
      expect(opt.id).toBe('opt-1');
    });

    it('should throw BadRequestException if adding option to non-option field', async () => {
      prismaMock.customField.findUnique.mockResolvedValue({
        id: 'cf-1',
        name: 'Notes',
        fieldType: CustomFieldType.TEXT,
        readRoles: [],
        options: [],
        typeHistories: [],
      });

      await expect(
        service.addOption('cf-1', { label: 'Tier 1', value: 'tier_1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if option value already exists', async () => {
      prismaMock.customField.findUnique.mockResolvedValue({
        id: 'cf-1',
        name: 'Deal Stage Status',
        fieldType: CustomFieldType.DROPDOWN,
        readRoles: [],
        options: [],
        typeHistories: [],
      });
      prismaMock.customFieldOption.findUnique.mockResolvedValue({ id: 'existing-opt' });

      await expect(
        service.addOption('cf-1', { label: 'Tier 1', value: 'tier_1' }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
