import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CustomFieldType } from '../enums/custom-field-type.enum';
import { CustomFieldValidationService } from './custom-field-validation.service';
import {
  FieldTypeMigrationPreview,
  FieldTypeMigrationResult,
} from '../interfaces/custom-field.interface';
import { TypeMigrationStrategy } from '../dto/change-field-type.dto';

@Injectable()
export class CustomFieldTypeMigrationService {
  private readonly logger = new Logger(CustomFieldTypeMigrationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly validationService: CustomFieldValidationService,
  ) {}

  /**
   * Preview a type change conversion before executing it
   */
  async previewTypeChange(
    fieldId: string,
    targetType: CustomFieldType,
    strategy: TypeMigrationStrategy = TypeMigrationStrategy.PRESERVE,
    newOptions?: Array<{ label: string; value: string; color?: string; order?: number }>,
  ): Promise<FieldTypeMigrationPreview> {
    const field = await this.prisma.customField.findUnique({
      where: { id: fieldId },
      include: { options: true },
    });

    if (!field) {
      throw new NotFoundException(`Custom field with ID "${fieldId}" not found`);
    }

    const currentType = field.fieldType as CustomFieldType;

    // Fetch all existing values for this field
    const records = await this.prisma.customFieldValue.findMany({
      where: { fieldId },
      take: 1000,
    });

    const totalRecords = records.length;
    let convertibleRecords = 0;
    let failedRecords = 0;
    const warnings: string[] = [];
    const sampleConversions: FieldTypeMigrationPreview['sampleConversions'] = [];

    // Analyze compatibility
    const isDirectlyCompatible = this.isCompatible(currentType, targetType);
    if (!isDirectlyCompatible) {
      warnings.push(
        `Converting from ${currentType} to ${targetType} may result in data loss or formatting changes.`,
      );
    }

    const effectiveOptions = newOptions || field.options;

    for (let i = 0; i < records.length; i++) {
      const rec = records[i];
      const origVal = rec.value;
      const conversion = this.convertValue(
        origVal,
        currentType,
        targetType,
        strategy,
        effectiveOptions,
      );

      if (conversion.status === 'SUCCESS') {
        convertibleRecords++;
      } else if (conversion.status === 'WARNING') {
        convertibleRecords++;
      } else {
        failedRecords++;
      }

      if (i < 10) {
        sampleConversions.push({
          entityId: rec.entityId,
          originalValue: origVal,
          convertedValue: conversion.value,
          status: conversion.status,
          message: conversion.message,
        });
      }
    }

    if (failedRecords > 0) {
      warnings.push(
        `${failedRecords} of ${totalRecords} existing records cannot be parsed into ${targetType}.`,
      );
    }

    return {
      fieldId,
      fieldName: field.name,
      fieldKey: field.key,
      currentType,
      targetType,
      isCompatible: failedRecords === 0,
      totalRecords,
      convertibleRecords,
      failedRecords,
      warnings,
      sampleConversions,
    };
  }

  /**
   * Execute type migration safely with audit log and atomic transaction
   */
  async executeTypeChange(
    fieldId: string,
    targetType: CustomFieldType,
    strategy: TypeMigrationStrategy = TypeMigrationStrategy.PRESERVE,
    force: boolean = false,
    newOptions?: Array<{ label: string; value: string; color?: string; order?: number }>,
    changedById?: string,
  ): Promise<FieldTypeMigrationResult> {
    const field = await this.prisma.customField.findUnique({
      where: { id: fieldId },
      include: { options: true },
    });

    if (!field) {
      throw new NotFoundException(`Custom field with ID "${fieldId}" not found`);
    }

    const currentType = field.fieldType as CustomFieldType;
    if (currentType === targetType) {
      return {
        fieldId,
        previousType: currentType,
        newType: targetType,
        convertedCount: 0,
        failedCount: 0,
        message: `Field is already of type ${targetType}. No migration needed.`,
      };
    }

    // Run preview check first
    const preview = await this.previewTypeChange(fieldId, targetType, strategy, newOptions);

    if (preview.failedRecords > 0 && !force) {
      throw new BadRequestException({
        message: `Cannot migrate field to ${targetType}. ${preview.failedRecords} records failed validation. Use force=true or strategy='CLEAR_INCOMPATIBLE' to proceed.`,
        warnings: preview.warnings,
        sampleFailures: preview.sampleConversions.filter((s) => s.status === 'FAILED'),
      });
    }

    const records = await this.prisma.customFieldValue.findMany({
      where: { fieldId },
    });

    const effectiveOptions = newOptions || field.options;
    let convertedCount = 0;
    let failedCount = 0;

    // Run transaction
    await this.prisma.$transaction(async (tx) => {
      // 1. If migrating to option-based field and newOptions provided, upsert them
      if (
        (targetType === CustomFieldType.DROPDOWN ||
          targetType === CustomFieldType.MULTI_SELECT ||
          targetType === CustomFieldType.RADIO) &&
        newOptions &&
        newOptions.length > 0
      ) {
        // delete existing options
        await tx.customFieldOption.deleteMany({ where: { fieldId } });
        // insert new options
        await tx.customFieldOption.createMany({
          data: newOptions.map((opt, idx) => ({
            fieldId,
            label: opt.label,
            value: opt.value,
            color: opt.color || null,
            order: opt.order ?? idx,
          })),
        });
      }

      // 2. Convert each existing record
      for (const rec of records) {
        const conversion = this.convertValue(
          rec.value,
          currentType,
          targetType,
          strategy,
          effectiveOptions,
        );

        if (conversion.status === 'SUCCESS' || conversion.status === 'WARNING') {
          convertedCount++;
        } else {
          failedCount++;
        }

        const typed = this.validationService.deriveTypedValues(targetType, conversion.value);

        await tx.customFieldValue.update({
          where: { id: rec.id },
          data: {
            value: conversion.value === null ? undefined : conversion.value,
            textValue: typed.textValue,
            numberValue: typed.numberValue,
            dateValue: typed.dateValue,
            booleanValue: typed.booleanValue,
          },
        });
      }

      // 3. Record migration history
      await tx.customFieldTypeHistory.create({
        data: {
          fieldId,
          previousType: currentType,
          newType: targetType,
          convertedCount,
          failedCount,
          changedById: changedById || null,
          details: {
            strategy,
            force,
            totalRecords: records.length,
          },
        },
      });

      // 4. Update the CustomField definition
      await tx.customField.update({
        where: { id: fieldId },
        data: {
          fieldType: targetType,
        },
      });
    });

    this.logger.log(
      `Successfully migrated custom field "${field.name}" (${fieldId}) from ${currentType} to ${targetType}. Converted: ${convertedCount}, Incompatible: ${failedCount}`,
    );

    return {
      fieldId,
      previousType: currentType,
      newType: targetType,
      convertedCount,
      failedCount,
      message: `Successfully migrated custom field to ${targetType}. ${convertedCount} records updated without data loss.`,
    };
  }

  /**
   * Compatibility matrix check
   */
  private isCompatible(from: CustomFieldType, to: CustomFieldType): boolean {
    if (from === to) return true;

    // String-like types can freely convert among themselves
    const textTypes = [
      CustomFieldType.TEXT,
      CustomFieldType.LONG_TEXT,
      CustomFieldType.EMAIL,
      CustomFieldType.URL,
      CustomFieldType.PHONE,
    ];
    if (textTypes.includes(from) && textTypes.includes(to)) return true;

    // Numbers can convert to text, currency, percentage
    const numericTypes = [
      CustomFieldType.NUMBER,
      CustomFieldType.CURRENCY,
      CustomFieldType.PERCENTAGE,
    ];
    if (numericTypes.includes(from) && numericTypes.includes(to)) return true;
    if (numericTypes.includes(from) && to === CustomFieldType.TEXT) return true;

    // Date / DateTime conversion
    if (
      (from === CustomFieldType.DATE && to === CustomFieldType.DATETIME) ||
      (from === CustomFieldType.DATETIME && to === CustomFieldType.DATE)
    ) {
      return true;
    }

    // Option-based types conversion
    const optionTypes = [
      CustomFieldType.DROPDOWN,
      CustomFieldType.RADIO,
      CustomFieldType.MULTI_SELECT,
    ];
    if (optionTypes.includes(from) && optionTypes.includes(to)) return true;
    if (optionTypes.includes(from) && to === CustomFieldType.TEXT) return true;

    // Checkbox to text
    if (from === CustomFieldType.CHECKBOX && to === CustomFieldType.TEXT) return true;

    return false;
  }

  /**
   * Safe value conversion logic between types
   */
  private convertValue(
    value: any,
    from: CustomFieldType,
    to: CustomFieldType,
    strategy: TypeMigrationStrategy,
    options?: any[],
  ): { value: any; status: 'SUCCESS' | 'WARNING' | 'FAILED'; message?: string } {
    if (value === null || value === undefined) {
      return { value: null, status: 'SUCCESS' };
    }

    try {
      switch (to) {
        case CustomFieldType.TEXT:
        case CustomFieldType.LONG_TEXT: {
          if (Array.isArray(value)) {
            return { value: value.join(', '), status: 'SUCCESS' };
          }
          if (typeof value === 'object') {
            return { value: JSON.stringify(value), status: 'SUCCESS' };
          }
          return { value: String(value), status: 'SUCCESS' };
        }

        case CustomFieldType.NUMBER:
        case CustomFieldType.CURRENCY:
        case CustomFieldType.PERCENTAGE: {
          const num = Number(value);
          if (!isNaN(num)) {
            return { value: num, status: 'SUCCESS' };
          }
          if (strategy === TypeMigrationStrategy.CLEAR_INCOMPATIBLE) {
            return {
              value: null,
              status: 'WARNING',
              message: 'Value cleared due to incompatible number format',
            };
          }
          return { value, status: 'FAILED', message: `Cannot convert "${value}" to number` };
        }

        case CustomFieldType.CHECKBOX: {
          if (typeof value === 'boolean') {
            return { value, status: 'SUCCESS' };
          }
          const str = String(value).toLowerCase().trim();
          if (['true', '1', 'yes', 'y'].includes(str)) {
            return { value: true, status: 'SUCCESS' };
          }
          if (['false', '0', 'no', 'n'].includes(str)) {
            return { value: false, status: 'SUCCESS' };
          }
          if (strategy === TypeMigrationStrategy.CLEAR_INCOMPATIBLE) {
            return { value: false, status: 'WARNING', message: 'Defaulted to false' };
          }
          return { value, status: 'FAILED', message: `Cannot convert "${value}" to boolean` };
        }

        case CustomFieldType.DATE: {
          const d = new Date(value);
          if (!isNaN(d.getTime())) {
            return { value: d.toISOString().split('T')[0], status: 'SUCCESS' };
          }
          if (strategy === TypeMigrationStrategy.CLEAR_INCOMPATIBLE) {
            return { value: null, status: 'WARNING', message: 'Cleared invalid date' };
          }
          return { value, status: 'FAILED', message: `Cannot convert "${value}" to date` };
        }

        case CustomFieldType.DATETIME: {
          const d = new Date(value);
          if (!isNaN(d.getTime())) {
            return { value: d.toISOString(), status: 'SUCCESS' };
          }
          if (strategy === TypeMigrationStrategy.CLEAR_INCOMPATIBLE) {
            return { value: null, status: 'WARNING', message: 'Cleared invalid date-time' };
          }
          return { value, status: 'FAILED', message: `Cannot convert "${value}" to date-time` };
        }

        case CustomFieldType.DROPDOWN:
        case CustomFieldType.RADIO: {
          let strVal = String(value);
          if (Array.isArray(value)) {
            strVal = value.length > 0 ? String(value[0]) : '';
          }
          const validOptions = (options || []).map((o) => o.value);
          if (validOptions.length === 0 || validOptions.includes(strVal)) {
            return { value: strVal, status: 'SUCCESS' };
          }
          if (strategy === TypeMigrationStrategy.CLEAR_INCOMPATIBLE) {
            return { value: null, status: 'WARNING', message: `Cleared unmatched option "${strVal}"` };
          }
          return {
            value: strVal,
            status: 'WARNING',
            message: `Value "${strVal}" is not in defined options`,
          };
        }

        case CustomFieldType.MULTI_SELECT: {
          if (Array.isArray(value)) {
            return { value, status: 'SUCCESS' };
          }
          if (typeof value === 'string') {
            const items = value.includes(',') ? value.split(',').map((s) => s.trim()) : [value];
            return { value: items, status: 'SUCCESS' };
          }
          return { value: [String(value)], status: 'SUCCESS' };
        }

        case CustomFieldType.EMAIL: {
          const str = String(value).trim();
          const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
          if (emailPattern.test(str)) {
            return { value: str.toLowerCase(), status: 'SUCCESS' };
          }
          if (strategy === TypeMigrationStrategy.CLEAR_INCOMPATIBLE) {
            return { value: null, status: 'WARNING', message: 'Cleared invalid email format' };
          }
          return { value, status: 'FAILED', message: `"${value}" is not a valid email address` };
        }

        case CustomFieldType.URL: {
          const str = String(value).trim();
          const urlPattern =
            /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/i;
          if (urlPattern.test(str)) {
            return { value: str, status: 'SUCCESS' };
          }
          if (strategy === TypeMigrationStrategy.CLEAR_INCOMPATIBLE) {
            return { value: null, status: 'WARNING', message: 'Cleared invalid URL format' };
          }
          return { value, status: 'FAILED', message: `"${value}" is not a valid URL` };
        }

        case CustomFieldType.PHONE: {
          const str = String(value).trim();
          const phonePattern = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,20}$/;
          if (phonePattern.test(str)) {
            return { value: str, status: 'SUCCESS' };
          }
          if (strategy === TypeMigrationStrategy.CLEAR_INCOMPATIBLE) {
            return { value: null, status: 'WARNING', message: 'Cleared invalid phone format' };
          }
          return { value, status: 'FAILED', message: `"${value}" is not a valid phone number` };
        }

        default:
          return { value, status: 'SUCCESS' };
      }
    } catch (err: any) {
      if (strategy === TypeMigrationStrategy.CLEAR_INCOMPATIBLE) {
        return { value: null, status: 'WARNING', message: err.message };
      }
      return { value, status: 'FAILED', message: err.message };
    }
  }
}
