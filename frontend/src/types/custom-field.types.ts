export type CustomFieldEntityType = 'LEAD' | 'CONTACT' | 'COMPANY' | 'DEAL' | 'ACTIVITY';

export type CustomFieldType =
  | 'TEXT'
  | 'LONG_TEXT'
  | 'NUMBER'
  | 'CURRENCY'
  | 'PERCENTAGE'
  | 'DATE'
  | 'DATETIME'
  | 'CHECKBOX'
  | 'DROPDOWN'
  | 'MULTI_SELECT'
  | 'RADIO'
  | 'URL'
  | 'EMAIL'
  | 'PHONE'
  | 'USER_SELECTOR';

export interface CustomFieldOption {
  id: string;
  fieldId: string;
  label: string;
  value: string;
  color?: string | null;
  order: number;
  isDefault: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomFieldTypeHistory {
  id: string;
  fieldId: string;
  fromType: CustomFieldType;
  toType: CustomFieldType;
  strategy: string;
  totalRecords: number;
  convertedCount: number;
  failedCount: number;
  createdAt: string;
}

export interface CustomFieldEntity {
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
  isActive: boolean;
  isArchived: boolean;
  order: number;
  section: string;
  gridWidth: number;
  validationRules?: Record<string, any> | null;
  readRoles?: string[] | null;
  editRoles?: string[] | null;
  workspaceId?: string | null;
  createdAt: string;
  updatedAt: string;
  options?: CustomFieldOption[];
  typeHistories?: CustomFieldTypeHistory[];
}

export interface CreateOptionItemPayload {
  label: string;
  value: string;
  color?: string;
  order?: number;
  isDefault?: boolean;
}

export interface CreateCustomFieldPayload {
  name: string;
  key?: string;
  entityType: CustomFieldEntityType;
  fieldType: CustomFieldType;
  description?: string;
  placeholder?: string;
  helpText?: string;
  defaultValue?: any;
  isRequired?: boolean;
  isUnique?: boolean;
  isVisible?: boolean;
  isSearchable?: boolean;
  isFilterable?: boolean;
  isEditable?: boolean;
  order?: number;
  section?: string;
  gridWidth?: number;
  validationRules?: Record<string, any>;
  readRoles?: string[];
  editRoles?: string[];
  workspaceId?: string;
  options?: CreateOptionItemPayload[];
}

export interface UpdateCustomFieldPayload {
  name?: string;
  description?: string;
  placeholder?: string;
  helpText?: string;
  defaultValue?: any;
  isRequired?: boolean;
  isUnique?: boolean;
  isVisible?: boolean;
  isSearchable?: boolean;
  isFilterable?: boolean;
  isEditable?: boolean;
  isActive?: boolean;
  isArchived?: boolean;
  order?: number;
  section?: string;
  gridWidth?: number;
  validationRules?: Record<string, any>;
  readRoles?: string[];
  editRoles?: string[];
  options?: CreateOptionItemPayload[];
}

export interface CustomFieldQueryFilters {
  entityType?: CustomFieldEntityType | '';
  fieldType?: CustomFieldType | '';
  search?: string;
  section?: string;
  isVisible?: boolean;
  isSearchable?: boolean;
  isFilterable?: boolean;
  isActive?: boolean;
  workspaceId?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedCustomFieldsResponse {
  data: CustomFieldEntity[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface FieldLayoutItem {
  id: string;
  name: string;
  key: string;
  fieldType: CustomFieldType;
  description?: string | null;
  placeholder?: string | null;
  helpText?: string | null;
  defaultValue?: any;
  isRequired: boolean;
  isEditable: boolean;
  gridWidth: number;
  order: number;
  validationRules?: Record<string, any> | null;
  options?: CustomFieldOption[];
}

export interface FieldLayoutSection {
  name: string;
  fields: FieldLayoutItem[];
}

export interface EntityLayoutResponse {
  entityType: CustomFieldEntityType;
  layout: FieldLayoutSection[];
}

export interface TypeMigrationPreviewResponse {
  fieldId: string;
  fieldName: string;
  currentType: CustomFieldType;
  targetType: CustomFieldType;
  strategy: string;
  isCompatible: boolean;
  totalRecords: number;
  convertibleCount: number;
  lossyCount: number;
  sampleConversions?: Array<{
    original: any;
    converted: any;
    status: 'SUCCESS' | 'LOSS' | 'ERROR';
  }>;
}

export interface ChangeFieldTypePayload {
  targetType: CustomFieldType;
  strategy?: string;
  force?: boolean;
  newOptions?: CreateOptionItemPayload[];
}
