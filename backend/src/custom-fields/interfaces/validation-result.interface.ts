export interface FieldValidationError {
  fieldKey: string;
  fieldName: string;
  message: string;
  rule?: string;
  providedValue?: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: FieldValidationError[];
  sanitizedValues?: Record<string, any>;
}
