import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CustomFieldEntityType } from '../enums/custom-field-entity-type.enum';
import { CustomFieldType } from '../enums/custom-field-type.enum';
import { CustomFieldValidationService } from './custom-field-validation.service';
import { SetCustomFieldValuesDto } from '../dto/set-custom-field-values.dto';
import {
  FilterEntitiesByCustomFieldsDto,
  CustomFieldFilterOperator,
} from '../dto/filter-entities-by-custom-fields.dto';
import {
  EntityCustomFieldsResponse,
  FieldLayoutItem,
  FieldLayoutSection,
} from '../interfaces/custom-field.interface';

@Injectable()
export class CustomFieldValuesService {
  private readonly logger = new Logger(CustomFieldValuesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly validationService: CustomFieldValidationService,
  ) {}

  /**
   * Validate that the target entity actually exists in its corresponding table
   */
  async validateEntityExists(
    entityType: CustomFieldEntityType,
    entityId: string,
  ): Promise<{ id: string; name?: string; title?: string }> {
    let entity: any = null;

    switch (entityType) {
      case CustomFieldEntityType.LEAD:
        entity = await this.prisma.lead.findUnique({
          where: { id: entityId },
          select: { id: true, title: true, firstName: true, lastName: true },
        });
        break;

      case CustomFieldEntityType.CONTACT:
        entity = await this.prisma.contact.findUnique({
          where: { id: entityId },
          select: { id: true, firstName: true, lastName: true, email: true },
        });
        break;

      case CustomFieldEntityType.COMPANY:
        entity = await this.prisma.organization.findUnique({
          where: { id: entityId },
          select: { id: true, name: true },
        });
        break;

      case CustomFieldEntityType.DEAL:
        entity = await this.prisma.deal.findUnique({
          where: { id: entityId },
          select: { id: true, title: true },
        });
        break;

      case CustomFieldEntityType.ACTIVITY:
        entity = await this.prisma.activity.findUnique({
          where: { id: entityId },
          select: { id: true, subject: true },
        });
        break;

      default:
        throw new BadRequestException(`Unsupported entity type: ${entityType}`);
    }

    if (!entity) {
      throw new NotFoundException(
        `${entityType} record with ID "${entityId}" does not exist in the database`,
      );
    }

    return entity;
  }

  /**
   * Check if current user has permission to view a field
   */
  private canUserViewField(field: any, currentUser?: any): boolean {
    if (!field.readRoles || !Array.isArray(field.readRoles) || field.readRoles.length === 0) {
      return true;
    }
    if (field.readRoles.includes('*')) return true;
    if (!currentUser) return true;

    const userRole = (currentUser.role?.name || currentUser.role || '').toUpperCase();
    if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') return true;

    const allowed = field.readRoles.map((r: string) => r.toUpperCase());
    return allowed.includes(userRole);
  }

  /**
   * Check if current user has permission to edit a field
   */
  private canUserEditField(field: any, currentUser?: any): boolean {
    if (!field.isEditable) return false;
    if (!field.editRoles || !Array.isArray(field.editRoles) || field.editRoles.length === 0) {
      return true;
    }
    if (field.editRoles.includes('*')) return true;
    if (!currentUser) return true;

    const userRole = (currentUser.role?.name || currentUser.role || '').toUpperCase();
    if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') return true;

    const allowed = field.editRoles.map((r: string) => r.toUpperCase());
    return allowed.includes(userRole);
  }

  /**
   * Get all custom field values for an entity with layout and permissions
   */
  async getEntityValues(
    entityType: CustomFieldEntityType,
    entityId: string,
    currentUser?: any,
    workspaceId?: string,
  ): Promise<EntityCustomFieldsResponse> {
    await this.validateEntityExists(entityType, entityId);

    // 1. Fetch field definitions
    const fields = await this.prisma.customField.findMany({
      where: {
        entityType,
        isActive: true,
        isArchived: false,
        ...(workspaceId ? { OR: [{ workspaceId }, { workspaceId: null }] } : {}),
      },
      include: {
        options: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: [{ section: 'asc' }, { order: 'asc' }],
    });

    // 2. Fetch stored values
    const storedValues = await this.prisma.customFieldValue.findMany({
      where: {
        entityType,
        entityId,
      },
    });

    const storedValueMap = new Map<string, any>();
    for (const val of storedValues) {
      storedValueMap.set(val.fieldId, val.value);
    }

    const valuesDict: Record<string, any> = {};
    const layoutItems: FieldLayoutItem[] = [];
    const sectionMap = new Map<string, FieldLayoutItem[]>();

    for (const field of fields) {
      const canView = this.canUserViewField(field, currentUser);
      if (!canView) continue;

      const canEdit = this.canUserEditField(field, currentUser);
      let value = storedValueMap.get(field.id);

      // Default value fallback if unset
      if (value === undefined || value === null) {
        value = field.defaultValue ?? null;
      }

      valuesDict[field.key] = value;

      const layoutItem: FieldLayoutItem = {
        id: field.id,
        name: field.name,
        key: field.key,
        entityType: field.entityType as CustomFieldEntityType,
        fieldType: field.fieldType as CustomFieldType,
        description: field.description,
        placeholder: field.placeholder,
        helpText: field.helpText,
        defaultValue: field.defaultValue,
        isRequired: field.isRequired,
        isUnique: field.isUnique,
        isVisible: field.isVisible,
        isSearchable: field.isSearchable,
        isFilterable: field.isFilterable,
        isEditable: field.isEditable,
        order: field.order,
        section: field.section,
        gridWidth: field.gridWidth,
        validationRules: (field.validationRules as any) || {},
        options: field.options.map((o) => ({
          id: o.id,
          label: o.label,
          value: o.value,
          color: o.color || undefined,
          order: o.order,
          isDefault: o.isDefault,
          isActive: o.isActive,
        })),
        canEdit,
        canView,
      };

      layoutItems.push(layoutItem);

      const sectionName = field.section || 'General Information';
      if (!sectionMap.has(sectionName)) {
        sectionMap.set(sectionName, []);
      }
      sectionMap.get(sectionName)!.push(layoutItem);
    }

    // Build structured sections
    let secOrder = 0;
    const layoutSections: FieldLayoutSection[] = [];
    for (const [name, secFields] of sectionMap.entries()) {
      layoutSections.push({
        name,
        order: secOrder++,
        fields: secFields.sort((a, b) => a.order - b.order),
      });
    }

    return {
      entityType,
      entityId,
      values: valuesDict,
      fields: layoutItems,
      layout: layoutSections,
    };
  }

  /**
   * Set custom field values for an entity with validation, permissions, and atomic upsert
   */
  async setEntityValues(
    entityType: CustomFieldEntityType,
    entityId: string,
    dto: SetCustomFieldValuesDto,
    currentUser?: any,
  ): Promise<{
    success: boolean;
    entityType: CustomFieldEntityType;
    entityId: string;
    updatedCount: number;
    values: Record<string, any>;
  }> {
    await this.validateEntityExists(entityType, entityId);

    // Normalize incoming input into a key-value map
    const incomingValues: Record<string, any> = {};

    if (dto.values && typeof dto.values === 'object') {
      for (const [k, v] of Object.entries(dto.values)) {
        incomingValues[k] = v;
      }
    }

    if (dto.items && Array.isArray(dto.items)) {
      for (const item of dto.items) {
        if (item.fieldKey) {
          incomingValues[item.fieldKey] = item.value;
        } else if (item.fieldId) {
          incomingValues[item.fieldId] = item.value;
        }
      }
    }

    // Fetch all active fields for this entity type
    const fields = await this.prisma.customField.findMany({
      where: {
        entityType,
        isActive: true,
        isArchived: false,
      },
      include: {
        options: {
          where: { isActive: true },
        },
      },
    });

    const fieldMapByKey = new Map<string, any>();
    const fieldMapById = new Map<string, any>();
    for (const f of fields) {
      fieldMapByKey.set(f.key, f);
      fieldMapById.set(f.id, f);
    }

    // Validate permissions and values
    const validationErrors: any[] = [];
    const fieldsToUpsert: Array<{
      field: any;
      sanitizedValue: any;
      typed: {
        textValue: string | null;
        numberValue: number | null;
        dateValue: Date | null;
        booleanValue: boolean | null;
      };
    }> = [];

    // Check each submitted field
    for (const [keyOrId, rawValue] of Object.entries(incomingValues)) {
      const field = fieldMapByKey.get(keyOrId) || fieldMapById.get(keyOrId);
      if (!field) {
        // Unknown field for this entity type
        continue;
      }

      // Check edit permission
      const canEdit = this.canUserEditField(field, currentUser);
      if (!canEdit) {
        throw new ForbiddenException(
          `You do not have permission to edit the custom field "${field.name}" (${field.key})`,
        );
      }

      // Validate value
      const valResult = await this.validationService.validateFieldValue(
        field,
        rawValue,
        entityId,
      );

      if (!valResult.isValid && valResult.error) {
        validationErrors.push(valResult.error);
        continue;
      }

      const sanitized = valResult.sanitizedValue;
      const typed = this.validationService.deriveTypedValues(
        field.fieldType as CustomFieldType,
        sanitized,
      );

      fieldsToUpsert.push({
        field,
        sanitizedValue: sanitized,
        typed,
      });
    }

    // Check if any mandatory required field was missed
    for (const field of fields) {
      if (field.isRequired) {
        const isSubmitted =
          incomingValues[field.key] !== undefined || incomingValues[field.id] !== undefined;
        if (!isSubmitted) {
          // Check if already stored in database
          const existing = await this.prisma.customFieldValue.findUnique({
            where: {
              fieldId_entityId: {
                fieldId: field.id,
                entityId,
              },
            },
          });
          if (!existing || existing.value === null || existing.value === '') {
            validationErrors.push({
              fieldKey: field.key,
              fieldName: field.name,
              message: `${field.name} is a required field`,
              rule: 'REQUIRED',
            });
          }
        }
      }
    }

    if (validationErrors.length > 0) {
      throw new BadRequestException({
        message: 'Custom field validation failed',
        errors: validationErrors,
      });
    }

    // Atomic transaction upsert
    await this.prisma.$transaction(async (tx) => {
      for (const item of fieldsToUpsert) {
        if (item.sanitizedValue === null || item.sanitizedValue === undefined) {
          // Delete value if explicitly set to null
          await tx.customFieldValue.deleteMany({
            where: {
              fieldId: item.field.id,
              entityId,
            },
          });
        } else {
          await tx.customFieldValue.upsert({
            where: {
              fieldId_entityId: {
                fieldId: item.field.id,
                entityId,
              },
            },
            create: {
              fieldId: item.field.id,
              entityType,
              entityId,
              value: item.sanitizedValue,
              textValue: item.typed.textValue,
              numberValue: item.typed.numberValue,
              dateValue: item.typed.dateValue,
              booleanValue: item.typed.booleanValue,
            },
            update: {
              value: item.sanitizedValue,
              textValue: item.typed.textValue,
              numberValue: item.typed.numberValue,
              dateValue: item.typed.dateValue,
              booleanValue: item.typed.booleanValue,
            },
          });
        }
      }
    });

    // Return the updated dictionary of values
    const latestResponse = await this.getEntityValues(entityType, entityId, currentUser);

    return {
      success: true,
      entityType,
      entityId,
      updatedCount: fieldsToUpsert.length,
      values: latestResponse.values,
    };
  }

  /**
   * Delete all custom field values for an entity
   */
  async clearEntityValues(
    entityType: CustomFieldEntityType,
    entityId: string,
  ): Promise<{ success: boolean; deletedCount: number }> {
    await this.validateEntityExists(entityType, entityId);

    const result = await this.prisma.customFieldValue.deleteMany({
      where: {
        entityType,
        entityId,
      },
    });

    return { success: true, deletedCount: result.count };
  }

  /**
   * Delete a single custom field value for an entity
   */
  async clearSingleFieldValue(
    entityType: CustomFieldEntityType,
    entityId: string,
    fieldKeyOrId: string,
  ): Promise<{ success: boolean }> {
    await this.validateEntityExists(entityType, entityId);

    const field = await this.prisma.customField.findFirst({
      where: {
        entityType,
        OR: [{ id: fieldKeyOrId }, { key: fieldKeyOrId }],
      },
    });

    if (!field) {
      throw new NotFoundException(`Custom field "${fieldKeyOrId}" not found for ${entityType}`);
    }

    await this.prisma.customFieldValue.deleteMany({
      where: {
        fieldId: field.id,
        entityId,
      },
    });

    return { success: true };
  }

  /**
   * Filter CRM entities by custom field conditions
   */
  async filterEntities(dto: FilterEntitiesByCustomFieldsDto, currentUser?: any) {
    const { entityType, conditions, matchType = 'AND', page = 1, limit = 20 } = dto;

    if (!conditions || conditions.length === 0) {
      throw new BadRequestException('At least one filter condition is required');
    }

    // Retrieve field definitions for all keys in conditions
    const fieldKeys = conditions.map((c) => c.fieldKey);
    const fields = await this.prisma.customField.findMany({
      where: {
        entityType,
        key: { in: fieldKeys },
      },
    });

    const fieldMap = new Map<string, any>();
    for (const f of fields) {
      fieldMap.set(f.key, f);
    }

    // Build subqueries for each condition
    const matchingEntityIdSets: string[][] = [];

    for (const cond of conditions) {
      const field = fieldMap.get(cond.fieldKey);
      if (!field) {
        throw new BadRequestException(
          `Custom field "${cond.fieldKey}" does not exist for entity type "${entityType}"`,
        );
      }

      if (!field.isFilterable) {
        throw new BadRequestException(
          `Custom field "${field.name}" (${field.key}) is not marked as filterable`,
        );
      }

      const whereClause: any = {
        fieldId: field.id,
        entityType,
      };

      const fieldType = field.fieldType as CustomFieldType;
      const isNumeric = [
        CustomFieldType.NUMBER,
        CustomFieldType.CURRENCY,
        CustomFieldType.PERCENTAGE,
      ].includes(fieldType);
      const isDate = [CustomFieldType.DATE, CustomFieldType.DATETIME].includes(fieldType);
      const isBoolean = fieldType === CustomFieldType.CHECKBOX;

      switch (cond.operator) {
        case CustomFieldFilterOperator.EQUALS:
          if (isNumeric) whereClause.numberValue = Number(cond.value);
          else if (isBoolean) whereClause.booleanValue = Boolean(cond.value);
          else if (isDate) whereClause.dateValue = new Date(cond.value);
          else whereClause.textValue = { equals: String(cond.value), mode: 'insensitive' };
          break;

        case CustomFieldFilterOperator.NOT_EQUALS:
          if (isNumeric) whereClause.numberValue = { not: Number(cond.value) };
          else if (isBoolean) whereClause.booleanValue = { not: Boolean(cond.value) };
          else if (isDate) whereClause.dateValue = { not: new Date(cond.value) };
          else whereClause.textValue = { not: String(cond.value) };
          break;

        case CustomFieldFilterOperator.CONTAINS:
          whereClause.textValue = { contains: String(cond.value), mode: 'insensitive' };
          break;

        case CustomFieldFilterOperator.STARTS_WITH:
          whereClause.textValue = { startsWith: String(cond.value), mode: 'insensitive' };
          break;

        case CustomFieldFilterOperator.GREATER_THAN:
          if (isNumeric) whereClause.numberValue = { gt: Number(cond.value) };
          else if (isDate) whereClause.dateValue = { gt: new Date(cond.value) };
          break;

        case CustomFieldFilterOperator.GREATER_THAN_OR_EQUAL:
          if (isNumeric) whereClause.numberValue = { gte: Number(cond.value) };
          else if (isDate) whereClause.dateValue = { gte: new Date(cond.value) };
          break;

        case CustomFieldFilterOperator.LESS_THAN:
          if (isNumeric) whereClause.numberValue = { lt: Number(cond.value) };
          else if (isDate) whereClause.dateValue = { lt: new Date(cond.value) };
          break;

        case CustomFieldFilterOperator.LESS_THAN_OR_EQUAL:
          if (isNumeric) whereClause.numberValue = { lte: Number(cond.value) };
          else if (isDate) whereClause.dateValue = { lte: new Date(cond.value) };
          break;

        case CustomFieldFilterOperator.BETWEEN:
          if (isNumeric && cond.valueTo !== undefined) {
            whereClause.numberValue = { gte: Number(cond.value), lte: Number(cond.valueTo) };
          } else if (isDate && cond.valueTo !== undefined) {
            whereClause.dateValue = { gte: new Date(cond.value), lte: new Date(cond.valueTo) };
          }
          break;

        case CustomFieldFilterOperator.IN:
          if (Array.isArray(cond.value)) {
            if (isNumeric) whereClause.numberValue = { in: cond.value.map(Number) };
            else whereClause.textValue = { in: cond.value.map(String) };
          }
          break;

        case CustomFieldFilterOperator.IS_EMPTY:
          whereClause.OR = [{ textValue: null }, { textValue: '' }];
          break;

        case CustomFieldFilterOperator.IS_NOT_EMPTY:
          whereClause.textValue = { not: null };
          break;
      }

      const matchingValues = await this.prisma.customFieldValue.findMany({
        where: whereClause,
        select: { entityId: true },
      });

      matchingEntityIdSets.push(matchingValues.map((m) => m.entityId));
    }

    // Combine entity IDs based on matchType (AND vs OR)
    let finalEntityIds: string[] = [];
    if (matchType === 'AND') {
      if (matchingEntityIdSets.length > 0) {
        finalEntityIds = matchingEntityIdSets.reduce((acc, set) =>
          acc.filter((id) => set.includes(id)),
        );
      }
    } else {
      const union = new Set<string>();
      for (const set of matchingEntityIdSets) {
        for (const id of set) union.add(id);
      }
      finalEntityIds = Array.from(union);
    }

    const total = finalEntityIds.length;
    const paginatedIds = finalEntityIds.slice((page - 1) * limit, page * limit);

    // Fetch entity records
    let entityRecords: any[] = [];
    if (paginatedIds.length > 0) {
      switch (entityType) {
        case CustomFieldEntityType.LEAD:
          entityRecords = await this.prisma.lead.findMany({
            where: { id: { in: paginatedIds } },
            include: { owner: { select: { id: true, name: true, email: true } } },
          });
          break;
        case CustomFieldEntityType.CONTACT:
          entityRecords = await this.prisma.contact.findMany({
            where: { id: { in: paginatedIds } },
            include: {
              organization: { select: { id: true, name: true } },
              owner: { select: { id: true, name: true, email: true } },
            },
          });
          break;
        case CustomFieldEntityType.COMPANY:
          entityRecords = await this.prisma.organization.findMany({
            where: { id: { in: paginatedIds } },
          });
          break;
        case CustomFieldEntityType.DEAL:
          entityRecords = await this.prisma.deal.findMany({
            where: { id: { in: paginatedIds } },
            include: { stage: true, contact: true, owner: true },
          });
          break;
        case CustomFieldEntityType.ACTIVITY:
          entityRecords = await this.prisma.activity.findMany({
            where: { id: { in: paginatedIds } },
            include: { contact: true, lead: true, deal: true },
          });
          break;
      }
    }

    // Enrich entity records with their custom fields
    const enriched = await Promise.all(
      entityRecords.map(async (record) => {
        const cfResponse = await this.getEntityValues(entityType, record.id, currentUser);
        return {
          ...record,
          customFields: cfResponse.values,
        };
      }),
    );

    return {
      data: enriched,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Search across all searchable custom fields
   */
  async searchCustomFieldValues(
    query: string,
    entityType?: CustomFieldEntityType,
    workspaceId?: string,
    limit: number = 20,
  ) {
    if (!query || query.trim() === '') {
      return [];
    }

    const trimmed = query.trim();

    const results = await this.prisma.customFieldValue.findMany({
      where: {
        field: {
          isSearchable: true,
          isActive: true,
          ...(entityType ? { entityType } : {}),
          ...(workspaceId ? { OR: [{ workspaceId }, { workspaceId: null }] } : {}),
        },
        textValue: {
          contains: trimmed,
          mode: 'insensitive',
        },
      },
      include: {
        field: {
          select: {
            id: true,
            name: true,
            key: true,
            entityType: true,
            fieldType: true,
          },
        },
      },
      take: limit,
    });

    return results.map((r) => ({
      entityType: r.entityType,
      entityId: r.entityId,
      fieldId: r.fieldId,
      fieldName: r.field.name,
      fieldKey: r.field.key,
      fieldType: r.field.fieldType,
      matchedValue: r.value,
      snippet: r.textValue,
    }));
  }
}
