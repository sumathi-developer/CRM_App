import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { CustomFieldValuesService } from './custom-field-values.service';
import { CustomFieldValidationService } from './custom-field-validation.service';
import { CustomFieldEntityType } from '../enums/custom-field-entity-type.enum';
import { CustomFieldType } from '../enums/custom-field-type.enum';
import { CustomFieldFilterOperator } from '../dto/filter-entities-by-custom-fields.dto';

describe('CustomFieldValuesService', () => {
  let service: CustomFieldValuesService;
  let prismaMock: any;
  let validationServiceMock: any;

  beforeEach(() => {
    prismaMock = {
      lead: { findUnique: vi.fn(), findMany: vi.fn() },
      contact: { findUnique: vi.fn(), findMany: vi.fn() },
      organization: { findUnique: vi.fn(), findMany: vi.fn() },
      deal: { findUnique: vi.fn(), findMany: vi.fn() },
      activity: { findUnique: vi.fn(), findMany: vi.fn() },
      customField: { findMany: vi.fn(), findFirst: vi.fn() },
      customFieldValue: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        upsert: vi.fn(),
        deleteMany: vi.fn(),
      },
      $transaction: vi.fn((callbackOrPromises) => {
        if (typeof callbackOrPromises === 'function') {
          return callbackOrPromises(prismaMock);
        }
        return Promise.all(callbackOrPromises);
      }),
    };

    validationServiceMock = {
      validateFieldValue: vi.fn().mockResolvedValue({ isValid: true, sanitizedValue: 'test-value' }),
      deriveTypedValues: vi.fn().mockReturnValue({
        textValue: 'test-value',
        numberValue: null,
        dateValue: null,
        booleanValue: null,
      }),
    };

    service = new CustomFieldValuesService(prismaMock, validationServiceMock);
  });

  describe('validateEntityExists', () => {
    it('should return entity if lead exists', async () => {
      prismaMock.lead.findUnique.mockResolvedValue({ id: 'lead-1', title: 'Enterprise Lead' });

      const entity = await service.validateEntityExists(CustomFieldEntityType.LEAD, 'lead-1');
      expect(entity.id).toBe('lead-1');
    });

    it('should throw NotFoundException if entity does not exist', async () => {
      prismaMock.lead.findUnique.mockResolvedValue(null);

      await expect(
        service.validateEntityExists(CustomFieldEntityType.LEAD, 'missing-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getEntityValues', () => {
    it('should return field layout with stored values', async () => {
      prismaMock.deal.findUnique.mockResolvedValue({ id: 'deal-1', title: 'Big Deal' });
      prismaMock.customField.findMany.mockResolvedValue([
        {
          id: 'cf-1',
          name: 'Budget',
          key: 'budget',
          entityType: CustomFieldEntityType.DEAL,
          fieldType: CustomFieldType.CURRENCY,
          section: 'Financials',
          order: 0,
          isRequired: false,
          isUnique: false,
          isVisible: true,
          isSearchable: true,
          isFilterable: true,
          isEditable: true,
          gridWidth: 12,
          readRoles: [],
          editRoles: [],
          options: [],
        },
      ]);
      prismaMock.customFieldValue.findMany.mockResolvedValue([
        { fieldId: 'cf-1', entityType: 'DEAL', entityId: 'deal-1', value: 50000 },
      ]);

      const res = await service.getEntityValues(CustomFieldEntityType.DEAL, 'deal-1');
      expect(res.entityId).toBe('deal-1');
      expect(res.values.budget).toBe(50000);
      expect(res.layout.length).toBe(1);
      expect(res.layout[0].fields[0].key).toBe('budget');
    });
  });

  describe('setEntityValues', () => {
    it('should set field values atomically when valid', async () => {
      prismaMock.lead.findUnique.mockResolvedValue({ id: 'lead-1' });
      prismaMock.customField.findMany.mockResolvedValue([
        {
          id: 'cf-1',
          name: 'Rating',
          key: 'rating',
          entityType: CustomFieldEntityType.LEAD,
          fieldType: CustomFieldType.NUMBER,
          isRequired: false,
          isEditable: true,
          readRoles: [],
          editRoles: [],
          options: [],
        },
      ]);
      prismaMock.customFieldValue.findMany.mockResolvedValue([
        { fieldId: 'cf-1', value: 5 },
      ]);

      validationServiceMock.validateFieldValue.mockResolvedValue({
        isValid: true,
        sanitizedValue: 5,
      });
      validationServiceMock.deriveTypedValues.mockReturnValue({
        textValue: null,
        numberValue: 5,
        dateValue: null,
        booleanValue: null,
      });

      const res = await service.setEntityValues(
        CustomFieldEntityType.LEAD,
        'lead-1',
        { values: { rating: 5 } },
      );

      expect(res.success).toBe(true);
      expect(prismaMock.customFieldValue.upsert).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user lacks edit permission', async () => {
      prismaMock.lead.findUnique.mockResolvedValue({ id: 'lead-1' });
      prismaMock.customField.findMany.mockResolvedValue([
        {
          id: 'cf-1',
          name: 'Rating',
          key: 'rating',
          entityType: CustomFieldEntityType.LEAD,
          fieldType: CustomFieldType.NUMBER,
          isRequired: false,
          isEditable: true,
          readRoles: [],
          editRoles: ['ADMIN'],
          options: [],
        },
      ]);

      await expect(
        service.setEntityValues(
          CustomFieldEntityType.LEAD,
          'lead-1',
          { values: { rating: 5 } },
          { role: 'SALES_REP' },
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if field validation fails', async () => {
      prismaMock.lead.findUnique.mockResolvedValue({ id: 'lead-1' });
      prismaMock.customField.findMany.mockResolvedValue([
        {
          id: 'cf-1',
          name: 'Rating',
          key: 'rating',
          entityType: CustomFieldEntityType.LEAD,
          fieldType: CustomFieldType.NUMBER,
          isRequired: false,
          isEditable: true,
          readRoles: [],
          editRoles: [],
          options: [],
        },
      ]);

      validationServiceMock.validateFieldValue.mockResolvedValue({
        isValid: false,
        error: { message: 'Must be positive number' },
      });

      await expect(
        service.setEntityValues(
          CustomFieldEntityType.LEAD,
          'lead-1',
          { values: { rating: -10 } },
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('clearEntityValues & clearSingleFieldValue', () => {
    it('should clear all values for entity', async () => {
      prismaMock.deal.findUnique.mockResolvedValue({ id: 'deal-1' });
      prismaMock.customFieldValue.deleteMany.mockResolvedValue({ count: 3 });

      const res = await service.clearEntityValues(CustomFieldEntityType.DEAL, 'deal-1');
      expect(res.success).toBe(true);
      expect(res.deletedCount).toBe(3);
    });

    it('should clear single field value', async () => {
      prismaMock.deal.findUnique.mockResolvedValue({ id: 'deal-1' });
      prismaMock.customField.findFirst.mockResolvedValue({ id: 'cf-1', key: 'budget' });
      prismaMock.customFieldValue.deleteMany.mockResolvedValue({ count: 1 });

      const res = await service.clearSingleFieldValue(
        CustomFieldEntityType.DEAL,
        'deal-1',
        'budget',
      );
      expect(res.success).toBe(true);
    });
  });

  describe('filterEntities', () => {
    it('should filter entities matching custom field conditions', async () => {
      prismaMock.customField.findMany.mockImplementation(() =>
        Promise.resolve([
          {
            id: 'cf-1',
            name: 'Industry',
            key: 'industry_type',
            fieldType: CustomFieldType.TEXT,
            isFilterable: true,
            section: 'General',
            readRoles: [],
            editRoles: [],
            options: [],
          },
        ]),
      );
      prismaMock.customFieldValue.findMany.mockResolvedValue([
        { entityId: 'lead-1', fieldId: 'cf-1', value: 'Technology' },
        { entityId: 'lead-2', fieldId: 'cf-1', value: 'Technology' },
      ]);
      prismaMock.lead.findMany.mockResolvedValue([
        { id: 'lead-1', title: 'Tech Lead 1' },
        { id: 'lead-2', title: 'Tech Lead 2' },
      ]);
      prismaMock.lead.findUnique.mockResolvedValue({ id: 'lead-1' });

      const result = await service.filterEntities({
        entityType: CustomFieldEntityType.LEAD,
        conditions: [
          {
            fieldKey: 'industry_type',
            operator: CustomFieldFilterOperator.EQUALS,
            value: 'Technology',
          },
        ],
      });

      expect(result.data.length).toBe(2);
      expect(result.meta.total).toBe(2);
    });
  });

  describe('searchCustomFieldValues', () => {
    it('should search across searchable fields and return matched snippets', async () => {
      prismaMock.customFieldValue.findMany.mockResolvedValue([
        {
          entityType: 'LEAD',
          entityId: 'lead-1',
          fieldId: 'cf-1',
          value: 'Acme Software',
          textValue: 'Acme Software',
          field: {
            id: 'cf-1',
            name: 'Company Code',
            key: 'company_code',
            entityType: 'LEAD',
            fieldType: 'TEXT',
          },
        },
      ]);

      const results = await service.searchCustomFieldValues('Acme');
      expect(results.length).toBe(1);
      expect(results[0].matchedValue).toBe('Acme Software');
      expect(results[0].fieldKey).toBe('company_code');
    });
  });
});
