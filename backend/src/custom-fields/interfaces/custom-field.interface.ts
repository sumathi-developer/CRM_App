import { CustomFieldType } from '../enums/custom-field-type.enum';
import { CustomFieldEntityType } from '../enums/custom-field-entity-type.enum';

export interface FieldValidationRules {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  regex?: string;
  regexPattern?: string;
  errorMessage?: string;
  currencyCode?: string;
  decimalPlaces?: number;
  allowedDomains?: string[];
  dateFormat?: string;
  allowPastDates?: boolean;
  allowFutureDates?: boolean;
}

export interface OptionItem {
  id?: string;
  label: string;
  value: string;
  color?: string;
  order?: number;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface FieldLayoutItem {
  id: string;
  name: string;
  key: string;
  entityType: CustomFieldEntityType;
  fieldType: CustomFieldType;
  description?: string | null;
  placeholder?: string | null;
  helpText?: string | null;
  defaultValue?: any;
  isRequired: boolean;
  isUnique: boolean;
  isVisible: boolean;
  isSearchable: boolean;
  isFilterable: boolean;
  isEditable: boolean;
  order: number;
  section: string;
  gridWidth: number;
  validationRules: FieldValidationRules;
  options: OptionItem[];
  canEdit: boolean;
  canView: boolean;
}

export interface FieldLayoutSection {
  name: string;
  order: number;
  fields: FieldLayoutItem[];
}

export interface EntityCustomFieldsResponse {
  entityType: CustomFieldEntityType;
  entityId: string;
  values: Record<string, any>;
  fields: FieldLayoutItem[];
  layout: FieldLayoutSection[];
}

export interface FieldTypeMigrationPreview {
  fieldId: string;
  fieldName: string;
  fieldKey: string;
  currentType: CustomFieldType;
  targetType: CustomFieldType;
  isCompatible: boolean;
  totalRecords: number;
  convertibleRecords: number;
  failedRecords: number;
  warnings: string[];
  sampleConversions: Array<{
    entityId: string;
    originalValue: any;
    convertedValue: any;
    status: 'SUCCESS' | 'WARNING' | 'FAILED';
    message?: string;
  }>;
}

export interface FieldTypeMigrationResult {
  fieldId: string;
  previousType: CustomFieldType;
  newType: CustomFieldType;
  convertedCount: number;
  failedCount: number;
  message: string;
}
