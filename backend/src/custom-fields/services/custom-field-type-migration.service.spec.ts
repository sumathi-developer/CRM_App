import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CustomFieldTypeMigrationService } from './custom-field-type-migration.service';
import { CustomFieldValidationService } from './custom-field-validation.service';
import { CustomFieldType } from '../enums/custom-field-type.enum';
import { TypeMigrationStrategy } from '../dto/change-field-type.dto';

describe('CustomFieldTypeMigrationService', () => {
  let migrationService: CustomFieldTypeMigrationService;
  let validationService: CustomFieldValidationService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      customField: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      customFieldValue: {
        findMany: vi.fn(),
        update: vi.fn(),
        deleteMany: vi.fn(),
      },
      customFieldOption: {
        deleteMany: vi.fn(),
        createMany: vi.fn(),
      },
      customFieldTypeHistory: {
        create: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
      },
      $transaction: vi.fn((callback) => callback(mockPrisma)),
    };

    validationService = new CustomFieldValidationService(mockPrisma);
    migrationService = new CustomFieldTypeMigrationService(mockPrisma, validationService);
  });

  describe('previewTypeChange', () => {
    it('should preview compatible conversion from NUMBER to CURRENCY without errors', async () => {
      mockPrisma.customField.findUnique.mockResolvedValue({
        id: 'f1',
        name: 'Budget',
        key: 'budget',
        fieldType: CustomFieldType.NUMBER,
        options: [],
      });

      mockPrisma.customFieldValue.findMany.mockResolvedValue([
        { id: 'v1', fieldId: 'f1', entityId: 'deal-1', value: 1000 },
        { id: 'v2', fieldId: 'f1', entityId: 'deal-2', value: 5500 },
      ]);

      const preview = await migrationService.previewTypeChange(
        'f1',
        CustomFieldType.CURRENCY,
        TypeMigrationStrategy.PRESERVE,
      );

      expect(preview.totalRecords).toBe(2);
      expect(preview.convertibleRecords).toBe(2);
      expect(preview.failedRecords).toBe(0);
      expect(preview.isCompatible).toBe(true);
      expect(preview.sampleConversions.length).toBe(2);
    });

    it('should detect incompatible values when converting arbitrary TEXT to NUMBER', async () => {
      mockPrisma.customField.findUnique.mockResolvedValue({
        id: 'f2',
        name: 'Notes',
        key: 'notes',
        fieldType: CustomFieldType.TEXT,
        options: [],
      });

      mockPrisma.customFieldValue.findMany.mockResolvedValue([
        { id: 'v1', fieldId: 'f2', entityId: 'lead-1', value: '1234' },
        { id: 'v2', fieldId: 'f2', entityId: 'lead-2', value: 'Not a number at all' },
      ]);

      const preview = await migrationService.previewTypeChange(
        'f2',
        CustomFieldType.NUMBER,
        TypeMigrationStrategy.PRESERVE,
      );

      expect(preview.totalRecords).toBe(2);
      expect(preview.convertibleRecords).toBe(1);
      expect(preview.failedRecords).toBe(1);
      expect(preview.isCompatible).toBe(false);
      expect(preview.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('executeTypeChange', () => {
    it('should refuse to execute incompatible migration if force is false', async () => {
      mockPrisma.customField.findUnique.mockResolvedValue({
        id: 'f2',
        name: 'Notes',
        key: 'notes',
        fieldType: CustomFieldType.TEXT,
        options: [],
      });

      mockPrisma.customFieldValue.findMany.mockResolvedValue([
        { id: 'v1', fieldId: 'f2', entityId: 'lead-1', value: 'invalid-string' },
      ]);

      await expect(
        migrationService.executeTypeChange(
          'f2',
          CustomFieldType.NUMBER,
          TypeMigrationStrategy.PRESERVE,
          false,
        ),
      ).rejects.toThrow();
    });

    it('should succeed with force=true and audit log entry', async () => {
      mockPrisma.customField.findUnique.mockResolvedValue({
        id: 'f3',
        name: 'Status Code',
        key: 'status_code',
        fieldType: CustomFieldType.DROPDOWN,
        options: [{ value: 'active' }],
      });

      mockPrisma.customFieldValue.findMany.mockResolvedValue([
        { id: 'v1', fieldId: 'f3', entityId: 'lead-1', value: 'active' },
      ]);

      const result = await migrationService.executeTypeChange(
        'f3',
        CustomFieldType.RADIO,
        TypeMigrationStrategy.PRESERVE,
        true,
        undefined,
        'admin-user-id',
      );

      expect(result.previousType).toBe(CustomFieldType.DROPDOWN);
      expect(result.newType).toBe(CustomFieldType.RADIO);
      expect(result.convertedCount).toBe(1);
      expect(mockPrisma.customFieldTypeHistory.create).toHaveBeenCalled();
      expect(mockPrisma.customField.update).toHaveBeenCalled();
    });
  });
});
