import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CustomFieldsController } from './custom-fields.controller';
import { CustomFieldsService } from './services/custom-fields.service';
import { CustomFieldValuesService } from './services/custom-field-values.service';
import { CustomFieldTypeMigrationService } from './services/custom-field-type-migration.service';
import { CustomFieldEntityType } from './enums/custom-field-entity-type.enum';
import { CustomFieldType } from './enums/custom-field-type.enum';

describe('CustomFieldsController', () => {
  let controller: CustomFieldsController;
  let customFieldsServiceMock: Partial<CustomFieldsService>;
  let customFieldValuesServiceMock: Partial<CustomFieldValuesService>;
  let typeMigrationServiceMock: Partial<CustomFieldTypeMigrationService>;

  beforeEach(() => {
    customFieldsServiceMock = {
      create: vi.fn().mockResolvedValue({ id: 'f-1', name: 'Field 1', key: 'field_1' }),
      findAll: vi.fn().mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 50, totalPages: 1 } }),
      findOne: vi.fn().mockResolvedValue({ id: 'f-1', name: 'Field 1' }),
      update: vi.fn().mockResolvedValue({ id: 'f-1', name: 'Updated' }),
      remove: vi.fn().mockResolvedValue({ success: true, message: 'Deleted' }),
      getLayout: vi.fn().mockResolvedValue({ entityType: CustomFieldEntityType.LEAD, layout: [] }),
      reorderFields: vi.fn().mockResolvedValue({ success: true, message: 'Reordered' }),
      getOptions: vi.fn().mockResolvedValue([]),
      addOption: vi.fn().mockResolvedValue({ id: 'opt-1', label: 'Option 1', value: 'opt_1' }),
      updateOption: vi.fn().mockResolvedValue({ id: 'opt-1', label: 'Updated Opt' }),
      deleteOption: vi.fn().mockResolvedValue({ success: true }),
      reorderOptions: vi.fn().mockResolvedValue([]),
    };

    customFieldValuesServiceMock = {
      getEntityValues: vi.fn().mockResolvedValue({
        entityType: CustomFieldEntityType.LEAD,
        entityId: 'lead-1',
        values: {},
        fields: [],
        layout: [],
      }),
      setEntityValues: vi.fn().mockResolvedValue({
        success: true,
        entityType: CustomFieldEntityType.LEAD,
        entityId: 'lead-1',
        updatedCount: 1,
        values: { rating: 5 },
      }),
      clearEntityValues: vi.fn().mockResolvedValue({ success: true, deletedCount: 2 }),
      clearSingleFieldValue: vi.fn().mockResolvedValue({ success: true }),
      filterEntities: vi.fn().mockResolvedValue({ data: [], meta: { total: 0 } }),
      searchCustomFieldValues: vi.fn().mockResolvedValue([]),
    };

    typeMigrationServiceMock = {
      previewTypeChange: vi.fn().mockResolvedValue({
        fieldId: 'f-1',
        fieldName: 'Status',
        currentType: CustomFieldType.TEXT,
        targetType: CustomFieldType.NUMBER,
        totalRecords: 10,
        convertibleRecords: 8,
        failedRecords: 2,
        warnings: [],
        sampleConversions: [],
      }),
      executeTypeChange: vi.fn().mockResolvedValue({
        fieldId: 'f-1',
        previousType: CustomFieldType.TEXT,
        newType: CustomFieldType.NUMBER,
        convertedCount: 8,
        failedCount: 2,
        message: 'Successfully migrated custom field to NUMBER',
      }),
    };

    controller = new CustomFieldsController(
      customFieldsServiceMock as CustomFieldsService,
      customFieldValuesServiceMock as CustomFieldValuesService,
      typeMigrationServiceMock as CustomFieldTypeMigrationService,
    );
  });

  describe('Field Definitions CRUD', () => {
    it('should create a custom field', async () => {
      const dto = {
        name: 'Field 1',
        entityType: CustomFieldEntityType.LEAD,
        fieldType: CustomFieldType.TEXT,
      };
      const res = await controller.create(dto, { id: 'user-1', role: 'ADMIN' });
      expect(res.id).toBe('f-1');
      expect(customFieldsServiceMock.create).toHaveBeenCalledWith(dto, { id: 'user-1', role: 'ADMIN' });
    });

    it('should find all custom fields', async () => {
      const res = await controller.findAll({}, { id: 'user-1', role: 'ADMIN' });
      expect(res.data).toEqual([]);
      expect(customFieldsServiceMock.findAll).toHaveBeenCalled();
    });

    it('should find one custom field by id', async () => {
      const res = await controller.findOne('f-1', { id: 'user-1' });
      expect(res.id).toBe('f-1');
      expect(customFieldsServiceMock.findOne).toHaveBeenCalledWith('f-1', { id: 'user-1' });
    });

    it('should update a custom field', async () => {
      const res = await controller.update('f-1', { name: 'Updated' }, { id: 'user-1' });
      expect(res.name).toBe('Updated');
      expect(customFieldsServiceMock.update).toHaveBeenCalledWith('f-1', { name: 'Updated' }, { id: 'user-1' });
    });

    it('should delete / archive a custom field', async () => {
      const res = await controller.remove('f-1', 'false');
      expect(res.success).toBe(true);
      expect(customFieldsServiceMock.remove).toHaveBeenCalledWith('f-1', false);
    });
  });

  describe('Layout & Reordering', () => {
    it('should get layout for entity type', async () => {
      const res = await controller.getLayout(CustomFieldEntityType.LEAD, { id: 'user-1' }, 'ws-1');
      expect(res.entityType).toBe(CustomFieldEntityType.LEAD);
      expect(customFieldsServiceMock.getLayout).toHaveBeenCalledWith(CustomFieldEntityType.LEAD, { id: 'user-1' }, 'ws-1');
    });

    it('should reorder fields', async () => {
      const res = await controller.reorderFields({ items: [{ id: 'f-1', order: 1 }] });
      expect(res.success).toBe(true);
      expect(customFieldsServiceMock.reorderFields).toHaveBeenCalled();
    });
  });

  describe('Options Management', () => {
    it('should list options for field', async () => {
      const res = await controller.getOptions('f-1');
      expect(res).toEqual([]);
      expect(customFieldsServiceMock.getOptions).toHaveBeenCalledWith('f-1');
    });

    it('should add option to field', async () => {
      const res = await controller.addOption('f-1', { label: 'Option 1', value: 'opt_1' });
      expect(res.id).toBe('opt-1');
      expect(customFieldsServiceMock.addOption).toHaveBeenCalledWith('f-1', { label: 'Option 1', value: 'opt_1' });
    });

    it('should update an option', async () => {
      const res = await controller.updateOption('f-1', 'opt-1', { label: 'Updated Opt' });
      expect(res.label).toBe('Updated Opt');
      expect(customFieldsServiceMock.updateOption).toHaveBeenCalledWith('f-1', 'opt-1', { label: 'Updated Opt' });
    });

    it('should delete an option', async () => {
      const res = await controller.deleteOption('f-1', 'opt-1');
      expect(res.success).toBe(true);
      expect(customFieldsServiceMock.deleteOption).toHaveBeenCalledWith('f-1', 'opt-1');
    });

    it('should reorder options', async () => {
      const res = await controller.reorderOptions('f-1', { orderedOptionIds: ['opt-1', 'opt-2'] });
      expect(res).toEqual([]);
      expect(customFieldsServiceMock.reorderOptions).toHaveBeenCalledWith('f-1', { orderedOptionIds: ['opt-1', 'opt-2'] });
    });
  });

  describe('Type Migration', () => {
    it('should preview field type migration', async () => {
      const res = await controller.previewTypeChange('f-1', { targetType: CustomFieldType.NUMBER });
      expect(res.convertibleRecords).toBe(8);
      expect(typeMigrationServiceMock.previewTypeChange).toHaveBeenCalled();
    });

    it('should execute field type migration', async () => {
      const res = await controller.changeType('f-1', { targetType: CustomFieldType.NUMBER }, 'admin-1');
      expect(res.convertedCount).toBe(8);
      expect(typeMigrationServiceMock.executeTypeChange).toHaveBeenCalled();
    });
  });

  describe('Entity Custom Field Values', () => {
    it('should get entity values', async () => {
      const res = await controller.getEntityValues(CustomFieldEntityType.LEAD, 'lead-1', { id: 'u-1' });
      expect(res.entityId).toBe('lead-1');
      expect(customFieldValuesServiceMock.getEntityValues).toHaveBeenCalledWith(
        CustomFieldEntityType.LEAD,
        'lead-1',
        { id: 'u-1' },
        undefined,
      );
    });

    it('should set entity values', async () => {
      const res = await controller.setEntityValues(
        CustomFieldEntityType.LEAD,
        'lead-1',
        { values: { rating: 5 } },
        { id: 'u-1' },
      );
      expect(res.success).toBe(true);
      expect(customFieldValuesServiceMock.setEntityValues).toHaveBeenCalled();
    });

    it('should clear all entity values', async () => {
      const res = await controller.clearEntityValues(CustomFieldEntityType.LEAD, 'lead-1');
      expect(res.success).toBe(true);
      expect(customFieldValuesServiceMock.clearEntityValues).toHaveBeenCalledWith(
        CustomFieldEntityType.LEAD,
        'lead-1',
      );
    });

    it('should clear single entity field value', async () => {
      const res = await controller.clearSingleFieldValue(
        CustomFieldEntityType.LEAD,
        'lead-1',
        'rating',
      );
      expect(res.success).toBe(true);
      expect(customFieldValuesServiceMock.clearSingleFieldValue).toHaveBeenCalledWith(
        CustomFieldEntityType.LEAD,
        'lead-1',
        'rating',
      );
    });
  });

  describe('Search and Filter', () => {
    it('should search custom field values', async () => {
      const res = await controller.searchCustomFieldValues('Acme', CustomFieldEntityType.LEAD, 'ws-1');
      expect(res).toEqual([]);
      expect(customFieldValuesServiceMock.searchCustomFieldValues).toHaveBeenCalledWith(
        'Acme',
        CustomFieldEntityType.LEAD,
        'ws-1',
      );
    });

    it('should filter entities by custom fields', async () => {
      const dto = {
        entityType: CustomFieldEntityType.LEAD,
        conditions: [],
      };
      const res = await controller.filterEntities(dto, { id: 'u-1' });
      expect(res.data).toEqual([]);
      expect(customFieldValuesServiceMock.filterEntities).toHaveBeenCalledWith(dto, { id: 'u-1' });
    });
  });
});
