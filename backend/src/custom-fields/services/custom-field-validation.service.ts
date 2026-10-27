import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CustomFieldType } from '../enums/custom-field-type.enum';
import { CustomFieldEntityType } from '../enums/custom-field-entity-type.enum';
import {
  FieldValidationError,
  ValidationResult,
} from '../interfaces/validation-result.interface';
import { FieldValidationRules } from '../interfaces/custom-field.interface';

@Injectable()
export class CustomFieldValidationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validate a single custom field value against its definition and rules
   */
  async validateFieldValue(
    field: {
      id: string;
      name: string;
      key: string;
      fieldType: string;
      isRequired: boolean;
      isUnique: boolean;
      validationRules?: any;
      options?: Array<{ value: string; isActive?: boolean }>;
      entityType: string;
    },
    value: any,
    currentEntityId?: string,
  ): Promise<{ isValid: boolean; error?: FieldValidationError; sanitizedValue?: any }> {
    const rules: FieldValidationRules = (field.validationRules as FieldValidationRules) || {};

    // 1. Required field check
    const isEmpty =
      value === undefined ||
      value === null ||
      value === '' ||
      (Array.isArray(value) && value.length === 0);

    if (field.isRequired && isEmpty) {
      return {
        isValid: false,
        error: {
          fieldKey: field.key,
          fieldName: field.name,
          message: rules.errorMessage || `${field.name} is required`,
          rule: 'REQUIRED',
          providedValue: value,
        },
      };
    }

    // If empty and not required, value is valid as null
    if (isEmpty) {
      return { isValid: true, sanitizedValue: null };
    }

    // 2. Type-specific validation and sanitization
    let sanitized: any = value;

    switch (field.fieldType as CustomFieldType) {
      case CustomFieldType.TEXT: {
        if (typeof value !== 'string') {
          sanitized = String(value);
        }
        const textStr = (sanitized as string).trim();
        if (rules.minLength && textStr.length < rules.minLength) {
          return {
            isValid: false,
            error: {
              fieldKey: field.key,
              fieldName: field.name,
              message:
                rules.errorMessage ||
                `${field.name} must be at least ${rules.minLength} characters long`,
              rule: 'MIN_LENGTH',
              providedValue: value,
            },
          };
        }
        if (rules.maxLength && textStr.length > rules.maxLength) {
          return {
            isValid: false,
            error: {
              fieldKey: field.key,
              fieldName: field.name,
              message:
                rules.errorMessage ||
                `${field.name} cannot exceed ${rules.maxLength} characters`,
              rule: 'MAX_LENGTH',
              providedValue: value,
            },
          };
        }
        if (rules.regex || rules.regexPattern) {
          const pattern = new RegExp(rules.regex || rules.regexPattern!);
          if (!pattern.test(textStr)) {
            return {
              isValid: false,
              error: {
                fieldKey: field.key,
                fieldName: field.name,
                message: rules.errorMessage || `${field.name} format is invalid`,
                rule: 'REGEX',
                providedValue: value,
              },
            };
          }
        }
        sanitized = textStr;
        break;
      }

      case CustomFieldType.LONG_TEXT: {
        if (typeof value !== 'string') {
          sanitized = String(value);
        }
        const longStr = sanitized as string;
        if (rules.minLength && longStr.length < rules.minLength) {
          return {
            isValid: false,
            error: {
              fieldKey: field.key,
              fieldName: field.name,
              message:
                rules.errorMessage ||
                `${field.name} must be at least ${rules.minLength} characters long`,
              rule: 'MIN_LENGTH',
              providedValue: value,
            },
          };
        }
        if (rules.maxLength && longStr.length > rules.maxLength) {
          return {
            isValid: false,
            error: {
              fieldKey: field.key,
              fieldName: field.name,
              message:
                rules.errorMessage ||
                `${field.name} cannot exceed ${rules.maxLength} characters`,
              rule: 'MAX_LENGTH',
              providedValue: value,
            },
          };
        }
        break;
      }

      case CustomFieldType.NUMBER:
      case CustomFieldType.CURRENCY:
      case CustomFieldType.PERCENTAGE: {
        const num = Number(value);
        if (isNaN(num)) {
          return {
            isValid: false,
            error: {
              fieldKey: field.key,
              fieldName: field.name,
              message: `${field.name} must be a valid number`,
              rule: 'INVALID_NUMBER',
              providedValue: value,
            },
          };
        }
        if (rules.min !== undefined && num < rules.min) {
          return {
            isValid: false,
            error: {
              fieldKey: field.key,
              fieldName: field.name,
              message:
                rules.errorMessage ||
                `${field.name} must be greater than or equal to ${rules.min}`,
              rule: 'MIN',
              providedValue: value,
            },
          };
        }
        if (rules.max !== undefined && num > rules.max) {
          return {
            isValid: false,
            error: {
              fieldKey: field.key,
              fieldName: field.name,
              message:
                rules.errorMessage ||
                `${field.name} must be less than or equal to ${rules.max}`,
              rule: 'MAX',
              providedValue: value,
            },
          };
        }
        sanitized = num;
        break;
      }

      case CustomFieldType.DATE: {
        const dateObj = new Date(value);
        if (isNaN(dateObj.getTime())) {
          return {
            isValid: false,
            error: {
              fieldKey: field.key,
              fieldName: field.name,
              message: `${field.name} must be a valid date (YYYY-MM-DD)`,
              rule: 'INVALID_DATE',
              providedValue: value,
            },
          };
        }
        sanitized = dateObj.toISOString().split('T')[0];
        break;
      }

      case CustomFieldType.DATETIME: {
        const dateObj = new Date(value);
        if (isNaN(dateObj.getTime())) {
          return {
            isValid: false,
            error: {
              fieldKey: field.key,
              fieldName: field.name,
              message: `${field.name} must be a valid ISO date-time`,
              rule: 'INVALID_DATETIME',
              providedValue: value,
            },
          };
        }
        sanitized = dateObj.toISOString();
        break;
      }

      case CustomFieldType.CHECKBOX: {
        if (typeof value === 'boolean') {
          sanitized = value;
        } else if (value === 'true' || value === 1 || value === '1') {
          sanitized = true;
        } else if (value === 'false' || value === 0 || value === '0') {
          sanitized = false;
        } else {
          return {
            isValid: false,
            error: {
              fieldKey: field.key,
              fieldName: field.name,
              message: `${field.name} must be a boolean (true or false)`,
              rule: 'INVALID_BOOLEAN',
              providedValue: value,
            },
          };
        }
        break;
      }

      case CustomFieldType.DROPDOWN:
      case CustomFieldType.RADIO: {
        const strVal = String(value).trim();
        const validOptions = (field.options || []).map((o) => o.value);
        if (validOptions.length > 0 && !validOptions.includes(strVal)) {
          return {
            isValid: false,
            error: {
              fieldKey: field.key,
              fieldName: field.name,
              message:
                rules.errorMessage ||
                `Invalid option "${strVal}" for ${field.name}. Allowed: [${validOptions.join(', ')}]`,
              rule: 'INVALID_OPTION',
              providedValue: value,
            },
          };
        }
        sanitized = strVal;
        break;
      }

      case CustomFieldType.MULTI_SELECT: {
        let arr = value;
        if (!Array.isArray(value)) {
          if (typeof value === 'string') {
            try {
              arr = JSON.parse(value);
            } catch {
              arr = [value];
            }
          } else {
            arr = [value];
          }
        }
        const validOptions = (field.options || []).map((o) => o.value);
        if (validOptions.length > 0) {
          for (const item of arr) {
            if (!validOptions.includes(String(item))) {
              return {
                isValid: false,
                error: {
                  fieldKey: field.key,
                  fieldName: field.name,
                  message:
                    rules.errorMessage ||
                    `Invalid option "${item}" in multi-select for ${field.name}. Allowed: [${validOptions.join(', ')}]`,
                  rule: 'INVALID_OPTION',
                  providedValue: item,
                },
              };
            }
          }
        }
        sanitized = arr.map((item: any) => String(item));
        break;
      }

      case CustomFieldType.URL: {
        const urlStr = String(value).trim();
        const urlPattern =
          /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/i;
        if (!urlPattern.test(urlStr)) {
          return {
            isValid: false,
            error: {
              fieldKey: field.key,
              fieldName: field.name,
              message: rules.errorMessage || `${field.name} must be a valid URL`,
              rule: 'INVALID_URL',
              providedValue: value,
            },
          };
        }
        sanitized = urlStr;
        break;
      }

      case CustomFieldType.EMAIL: {
        const emailStr = String(value).trim();
        const emailPattern =
          /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailPattern.test(emailStr)) {
          return {
            isValid: false,
            error: {
              fieldKey: field.key,
              fieldName: field.name,
              message: rules.errorMessage || `${field.name} must be a valid email address`,
              rule: 'INVALID_EMAIL',
              providedValue: value,
            },
          };
        }
        sanitized = emailStr.toLowerCase();
        break;
      }

      case CustomFieldType.PHONE: {
        const phoneStr = String(value).trim();
        const phonePattern = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,20}$/;
        if (!phonePattern.test(phoneStr)) {
          return {
            isValid: false,
            error: {
              fieldKey: field.key,
              fieldName: field.name,
              message:
                rules.errorMessage ||
                `${field.name} must be a valid phone number (digits and optional country code)`,
              rule: 'INVALID_PHONE',
              providedValue: value,
            },
          };
        }
        sanitized = phoneStr;
        break;
      }

      case CustomFieldType.USER_SELECTOR: {
        const userId = String(value).trim();
        const userExists = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, name: true, email: true },
        });
        if (!userExists) {
          return {
            isValid: false,
            error: {
              fieldKey: field.key,
              fieldName: field.name,
              message: `User with ID "${userId}" does not exist in the system`,
              rule: 'USER_NOT_FOUND',
              providedValue: value,
            },
          };
        }
        sanitized = userId;
        break;
      }

      default:
        sanitized = value;
    }

    // 3. Unique value check (if isUnique = true)
    if (field.isUnique && sanitized !== null) {
      const existing = await this.prisma.customFieldValue.findFirst({
        where: {
          fieldId: field.id,
          entityType: field.entityType,
          entityId: currentEntityId ? { not: currentEntityId } : undefined,
          OR: [
            { textValue: String(sanitized) },
            { numberValue: typeof sanitized === 'number' ? sanitized : undefined },
          ],
        },
      });

      if (existing) {
        return {
          isValid: false,
          error: {
            fieldKey: field.key,
            fieldName: field.name,
            message: `${field.name} value "${sanitized}" must be unique. Already in use by another record.`,
            rule: 'UNIQUE',
            providedValue: sanitized,
          },
        };
      }
    }

    return { isValid: true, sanitizedValue: sanitized };
  }

  /**
   * Helper to derive typed storage values for indexed database columns
   */
  deriveTypedValues(
    fieldType: CustomFieldType,
    value: any,
  ): {
    textValue: string | null;
    numberValue: number | null;
    dateValue: Date | null;
    booleanValue: boolean | null;
  } {
    let textValue: string | null = null;
    let numberValue: number | null = null;
    let dateValue: Date | null = null;
    let booleanValue: boolean | null = null;

    if (value === null || value === undefined) {
      return { textValue, numberValue, dateValue, booleanValue };
    }

    switch (fieldType) {
      case CustomFieldType.TEXT:
      case CustomFieldType.LONG_TEXT:
      case CustomFieldType.DROPDOWN:
      case CustomFieldType.RADIO:
      case CustomFieldType.URL:
      case CustomFieldType.EMAIL:
      case CustomFieldType.PHONE:
      case CustomFieldType.USER_SELECTOR:
        textValue = String(value);
        break;

      case CustomFieldType.NUMBER:
      case CustomFieldType.CURRENCY:
      case CustomFieldType.PERCENTAGE:
        numberValue = Number(value);
        textValue = String(value);
        break;

      case CustomFieldType.DATE:
      case CustomFieldType.DATETIME: {
        const d = new Date(value);
        if (!isNaN(d.getTime())) {
          dateValue = d;
          textValue = d.toISOString();
        }
        break;
      }

      case CustomFieldType.CHECKBOX:
        booleanValue = Boolean(value);
        textValue = String(value);
        break;

      case CustomFieldType.MULTI_SELECT:
        if (Array.isArray(value)) {
          textValue = value.join(',');
        } else {
          textValue = String(value);
        }
        break;

      default:
        textValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    }

    return { textValue, numberValue, dateValue, booleanValue };
  }
}
