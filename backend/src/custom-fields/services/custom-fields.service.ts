import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCustomFieldDto } from '../dto/create-custom-field.dto';
import { UpdateCustomFieldDto } from '../dto/update-custom-field.dto';
import { CustomFieldQueryDto } from '../dto/custom-field-query.dto';
import { CreateFieldOptionDto } from '../dto/create-field-option.dto';
import { UpdateFieldOptionDto } from '../dto/update-field-option.dto';
import { ReorderOptionsDto } from '../dto/reorder-options.dto';
import { ReorderFieldsDto } from '../dto/reorder-fields.dto';
import { CustomFieldEntityType } from '../enums/custom-field-entity-type.enum';
import { CustomFieldType } from '../enums/custom-field-type.enum';
import { CustomFieldValidationService } from './custom-field-validation.service';
import { FieldLayoutSection, FieldLayoutItem } from '../interfaces/custom-field.interface';

@Injectable()
export class CustomFieldsService {
  private readonly logger = new Logger(CustomFieldsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly validationService: CustomFieldValidationService,
  ) {}

  /**
   * Helper to format a string into a clean snake_case identifier key
   */
  private generateFieldKey(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  /**
   * Create a new custom field definition
   */
  async create(createDto: CreateCustomFieldDto, currentUser?: any) {
    const rawKey = createDto.key ? createDto.key : this.generateFieldKey(createDto.name);
    const key = this.generateFieldKey(rawKey);

    if (!key) {
      throw new BadRequestException('A valid alphanumeric field key could not be determined');
    }

    // Check key uniqueness for this entity type & workspace
    const existing = await this.prisma.customField.findFirst({
      where: {
        entityType: createDto.entityType,
        key,
        workspaceId: createDto.workspaceId ?? null,
      },
    });

    if (existing) {
      throw new ConflictException(
        `A custom field with key "${key}" already exists for ${createDto.entityType}`,
      );
    }

    // Validate options requirement for option-based field types
    const optionTypes = [
      CustomFieldType.DROPDOWN,
      CustomFieldType.MULTI_SELECT,
      CustomFieldType.RADIO,
    ];
    if (optionTypes.includes(createDto.fieldType)) {
      if (!createDto.options || createDto.options.length === 0) {
        throw new BadRequestException(
          `Field type ${createDto.fieldType} requires at least one option`,
        );
      }
    }

    // Validate default value if supplied
    if (createDto.defaultValue !== undefined && createDto.defaultValue !== null) {
      const valResult = await this.validationService.validateFieldValue(
        {
          id: 'temp',
          name: createDto.name,
          key,
          fieldType: createDto.fieldType,
          isRequired: false,
          isUnique: false,
          validationRules: createDto.validationRules,
          options: createDto.options?.map((o) => ({ value: o.value })),
          entityType: createDto.entityType,
        },
        createDto.defaultValue,
      );

      if (!valResult.isValid && valResult.error) {
        throw new BadRequestException({
          message: `Default value validation failed: ${valResult.error.message}`,
          error: valResult.error,
        });
      }
    }

    // Create field and options atomically
    return this.prisma.$transaction(async (tx) => {
      const field = await tx.customField.create({
        data: {
          name: createDto.name.trim(),
          key,
          entityType: createDto.entityType,
          fieldType: createDto.fieldType,
          description: createDto.description?.trim() || null,
          placeholder: createDto.placeholder?.trim() || null,
          helpText: createDto.helpText?.trim() || null,
          defaultValue: createDto.defaultValue !== undefined ? createDto.defaultValue : null,
          isRequired: Boolean(createDto.isRequired),
          isUnique: Boolean(createDto.isUnique),
          isVisible: createDto.isVisible !== undefined ? Boolean(createDto.isVisible) : true,
          isSearchable:
            createDto.isSearchable !== undefined ? Boolean(createDto.isSearchable) : true,
          isFilterable:
            createDto.isFilterable !== undefined ? Boolean(createDto.isFilterable) : true,
          isEditable: createDto.isEditable !== undefined ? Boolean(createDto.isEditable) : true,
          order: createDto.order ?? 0,
          section: createDto.section?.trim() || 'General Information',
          gridWidth: createDto.gridWidth ?? 12,
          validationRules: createDto.validationRules || {},
          readRoles: createDto.readRoles || [],
          editRoles: createDto.editRoles || [],
          workspaceId: createDto.workspaceId || null,
          options: {
            create: (createDto.options || []).map((opt, index) => ({
              label: opt.label.trim(),
              value: opt.value.trim(),
              color: opt.color?.trim() || null,
              order: opt.order ?? index,
              isDefault: Boolean(opt.isDefault),
            })),
          },
        },
        include: {
          options: {
            orderBy: { order: 'asc' },
          },
        },
      });

      this.logger.log(`Created custom field "${field.name}" (${field.key}) for ${field.entityType}`);
      return field;
    });
  }

  /**
   * List custom fields with pagination and filters
   */
  async findAll(query: CustomFieldQueryDto, currentUser?: any) {
    const {
      entityType,
      fieldType,
      search,
      section,
      isVisible,
      isSearchable,
      isFilterable,
      isActive = true,
      workspaceId,
      page = 1,
      limit = 50,
    } = query;

    const where: any = {
      isArchived: false,
    };

    if (isActive !== undefined) where.isActive = isActive;
    if (entityType) where.entityType = entityType;
    if (fieldType) where.fieldType = fieldType;
    if (section) where.section = section;
    if (isVisible !== undefined) where.isVisible = isVisible;
    if (isSearchable !== undefined) where.isSearchable = isSearchable;
    if (isFilterable !== undefined) where.isFilterable = isFilterable;
    if (workspaceId) {
      where.OR = [{ workspaceId }, { workspaceId: null }];
    }

    if (search && search.trim() !== '') {
      const mode = 'insensitive';
      where.OR = [
        { name: { contains: search.trim(), mode } },
        { key: { contains: search.trim(), mode } },
        { description: { contains: search.trim(), mode } },
      ];
    }

    const [total, fields] = await Promise.all([
      this.prisma.customField.count({ where }),
      this.prisma.customField.findMany({
        where,
        include: {
          options: {
            where: { isActive: true },
            orderBy: { order: 'asc' },
          },
        },
        orderBy: [{ section: 'asc' }, { order: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    // Check user role permissions if current user provided
    const userRole = (currentUser?.role?.name || currentUser?.role || '').toUpperCase();
    const isSuperAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

    const accessibleFields = fields.filter((f) => {
      if (isSuperAdmin) return true;
      const readRoles = f.readRoles as string[];
      if (!readRoles || !Array.isArray(readRoles) || readRoles.length === 0) return true;
      if (readRoles.includes('*')) return true;
      return readRoles.map((r) => r.toUpperCase()).includes(userRole);
    });

    return {
      data: accessibleFields,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Find a single custom field by ID
   */
  async findOne(id: string, currentUser?: any) {
    const field = await this.prisma.customField.findUnique({
      where: { id },
      include: {
        options: {
          orderBy: { order: 'asc' },
        },
        typeHistories: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!field) {
      throw new NotFoundException(`Custom field with ID "${id}" not found`);
    }

    // Role check
    const userRole = (currentUser?.role?.name || currentUser?.role || '').toUpperCase();
    const isSuperAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
    const readRoles = field.readRoles as string[];

    if (!isSuperAdmin && Array.isArray(readRoles) && readRoles.length > 0 && !readRoles.includes('*')) {
      if (!readRoles.map((r) => r.toUpperCase()).includes(userRole)) {
        throw new ForbiddenException(
          `You do not have permission to view the custom field "${field.name}"`,
        );
      }
    }

    return field;
  }

  /**
   * Update an existing custom field definition
   */
  async update(id: string, updateDto: UpdateCustomFieldDto, currentUser?: any) {
    const existing = await this.findOne(id, currentUser);

    return this.prisma.$transaction(async (tx) => {
      // If options are provided, update them
      if (updateDto.options) {
        await tx.customFieldOption.deleteMany({ where: { fieldId: id } });
        if (updateDto.options.length > 0) {
          await tx.customFieldOption.createMany({
            data: updateDto.options.map((opt, idx) => ({
              fieldId: id,
              label: opt.label.trim(),
              value: opt.value.trim(),
              color: opt.color?.trim() || null,
              order: opt.order ?? idx,
              isDefault: Boolean(opt.isDefault),
            })),
          });
        }
      }

      const updated = await tx.customField.update({
        where: { id },
        data: {
          name: updateDto.name ? updateDto.name.trim() : undefined,
          description: updateDto.description !== undefined ? updateDto.description?.trim() || null : undefined,
          placeholder: updateDto.placeholder !== undefined ? updateDto.placeholder?.trim() || null : undefined,
          helpText: updateDto.helpText !== undefined ? updateDto.helpText?.trim() || null : undefined,
          defaultValue: updateDto.defaultValue !== undefined ? updateDto.defaultValue : undefined,
          isRequired: updateDto.isRequired !== undefined ? Boolean(updateDto.isRequired) : undefined,
          isUnique: updateDto.isUnique !== undefined ? Boolean(updateDto.isUnique) : undefined,
          isVisible: updateDto.isVisible !== undefined ? Boolean(updateDto.isVisible) : undefined,
          isSearchable: updateDto.isSearchable !== undefined ? Boolean(updateDto.isSearchable) : undefined,
          isFilterable: updateDto.isFilterable !== undefined ? Boolean(updateDto.isFilterable) : undefined,
          isEditable: updateDto.isEditable !== undefined ? Boolean(updateDto.isEditable) : undefined,
          order: updateDto.order !== undefined ? updateDto.order : undefined,
          section: updateDto.section ? updateDto.section.trim() : undefined,
          gridWidth: updateDto.gridWidth !== undefined ? updateDto.gridWidth : undefined,
          validationRules: updateDto.validationRules !== undefined ? updateDto.validationRules : undefined,
          readRoles: updateDto.readRoles !== undefined ? updateDto.readRoles : undefined,
          editRoles: updateDto.editRoles !== undefined ? updateDto.editRoles : undefined,
          isActive: updateDto.isActive !== undefined ? Boolean(updateDto.isActive) : undefined,
          isArchived: updateDto.isArchived !== undefined ? Boolean(updateDto.isArchived) : undefined,
        },
        include: {
          options: {
            orderBy: { order: 'asc' },
          },
        },
      });

      this.logger.log(`Updated custom field "${updated.name}" (${updated.id})`);
      return updated;
    });
  }

  /**
   * Delete or archive a custom field
   */
  async remove(id: string, hardDelete: boolean = false) {
    const existing = await this.prisma.customField.findUnique({
      where: { id },
      include: {
        _count: {
          select: { values: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(`Custom field with ID "${id}" not found`);
    }

    if (hardDelete) {
      await this.prisma.customField.delete({ where: { id } });
      return {
        success: true,
        message: `Custom field "${existing.name}" and all associated values deleted permanently.`,
      };
    } else {
      // Soft delete / archive
      const archived = await this.prisma.customField.update({
        where: { id },
        data: {
          isArchived: true,
          isActive: false,
        },
      });
      return {
        success: true,
        message: `Custom field "${archived.name}" archived successfully. Existing data preserved.`,
        data: archived,
      };
    }
  }

  /**
   * Get dynamic form layout and schema for an entity type
   */
  async getLayout(
    entityType: CustomFieldEntityType,
    currentUser?: any,
    workspaceId?: string,
  ): Promise<{ entityType: CustomFieldEntityType; layout: FieldLayoutSection[] }> {
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

    const userRole = (currentUser?.role?.name || currentUser?.role || '').toUpperCase();
    const isSuperAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

    const sectionMap = new Map<string, FieldLayoutItem[]>();

    for (const field of fields) {
      // Check view permission
      const readRoles = field.readRoles as string[];
      if (!isSuperAdmin && Array.isArray(readRoles) && readRoles.length > 0 && !readRoles.includes('*')) {
        if (!readRoles.map((r) => r.toUpperCase()).includes(userRole)) {
          continue;
        }
      }

      // Check edit permission
      const editRoles = field.editRoles as string[];
      let canEdit = field.isEditable;
      if (canEdit && !isSuperAdmin && Array.isArray(editRoles) && editRoles.length > 0 && !editRoles.includes('*')) {
        canEdit = editRoles.map((r) => r.toUpperCase()).includes(userRole);
      }

      const item: FieldLayoutItem = {
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
        canView: true,
      };

      const sectionName = field.section || 'General Information';
      if (!sectionMap.has(sectionName)) {
        sectionMap.set(sectionName, []);
      }
      sectionMap.get(sectionName)!.push(item);
    }

    let secIdx = 0;
    const sections: FieldLayoutSection[] = [];
    for (const [name, secFields] of sectionMap.entries()) {
      sections.push({
        name,
        order: secIdx++,
        fields: secFields.sort((a, b) => a.order - b.order),
      });
    }

    return {
      entityType,
      layout: sections,
    };
  }

  /**
   * Reorder multiple fields across/within sections
   */
  async reorderFields(dto: ReorderFieldsDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Items array cannot be empty');
    }

    await this.prisma.$transaction(
      dto.items.map((item) =>
        this.prisma.customField.update({
          where: { id: item.id },
          data: {
            order: item.order,
            section: item.section ? item.section.trim() : undefined,
          },
        }),
      ),
    );

    return {
      success: true,
      message: `Reordered ${dto.items.length} fields successfully`,
    };
  }

  // ==========================================
  // Field Options Management
  // ==========================================

  /**
   * List options for a custom field
   */
  async getOptions(fieldId: string) {
    await this.findOne(fieldId);

    return this.prisma.customFieldOption.findMany({
      where: { fieldId },
      orderBy: { order: 'asc' },
    });
  }

  /**
   * Add a new option to a custom field
   */
  async addOption(fieldId: string, dto: CreateFieldOptionDto) {
    const field = await this.findOne(fieldId);

    const optionTypes = [
      CustomFieldType.DROPDOWN,
      CustomFieldType.MULTI_SELECT,
      CustomFieldType.RADIO,
    ];
    if (!optionTypes.includes(field.fieldType as CustomFieldType)) {
      throw new BadRequestException(
        `Field "${field.name}" is of type ${field.fieldType} and does not support options`,
      );
    }

    // Check unique value
    const existing = await this.prisma.customFieldOption.findUnique({
      where: {
        fieldId_value: {
          fieldId,
          value: dto.value.trim(),
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Option with value "${dto.value}" already exists for field "${field.name}"`,
      );
    }

    return this.prisma.customFieldOption.create({
      data: {
        fieldId,
        label: dto.label.trim(),
        value: dto.value.trim(),
        color: dto.color?.trim() || null,
        order: dto.order ?? 0,
        isDefault: Boolean(dto.isDefault),
      },
    });
  }

  /**
   * Update an existing field option
   */
  async updateOption(fieldId: string, optionId: string, dto: UpdateFieldOptionDto) {
    const option = await this.prisma.customFieldOption.findFirst({
      where: { id: optionId, fieldId },
    });

    if (!option) {
      throw new NotFoundException(`Option with ID "${optionId}" not found for this field`);
    }

    return this.prisma.customFieldOption.update({
      where: { id: optionId },
      data: {
        label: dto.label ? dto.label.trim() : undefined,
        value: dto.value ? dto.value.trim() : undefined,
        color: dto.color !== undefined ? dto.color?.trim() || null : undefined,
        order: dto.order !== undefined ? dto.order : undefined,
        isDefault: dto.isDefault !== undefined ? Boolean(dto.isDefault) : undefined,
        isActive: dto.isActive !== undefined ? Boolean(dto.isActive) : undefined,
      },
    });
  }

  /**
   * Delete a field option
   */
  async deleteOption(fieldId: string, optionId: string) {
    const option = await this.prisma.customFieldOption.findFirst({
      where: { id: optionId, fieldId },
    });

    if (!option) {
      throw new NotFoundException(`Option with ID "${optionId}" not found for this field`);
    }

    await this.prisma.customFieldOption.delete({
      where: { id: optionId },
    });

    return {
      success: true,
      message: `Option "${option.label}" deleted successfully`,
    };
  }

  /**
   * Reorder options of a custom field
   */
  async reorderOptions(fieldId: string, dto: ReorderOptionsDto) {
    await this.findOne(fieldId);

    await this.prisma.$transaction(
      dto.orderedOptionIds.map((optId, index) =>
        this.prisma.customFieldOption.updateMany({
          where: { id: optId, fieldId },
          data: { order: index },
        }),
      ),
    );

    return this.getOptions(fieldId);
  }
}
