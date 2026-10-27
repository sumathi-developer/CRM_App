import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CustomFieldValidationService } from './custom-field-validation.service';
import { CustomFieldType } from '../enums/custom-field-type.enum';
import { CustomFieldEntityType } from '../enums/custom-field-entity-type.enum';

describe('CustomFieldValidationService', () => {
  let service: CustomFieldValidationService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
      },
      customFieldValue: {
        findFirst: vi.fn(),
      },
    };
    service = new CustomFieldValidationService(mockPrisma);
  });

  describe('TEXT validation', () => {
    const textField = {
      id: 'f1',
      name: 'Custom Code',
      key: 'custom_code',
      fieldType: CustomFieldType.TEXT,
      isRequired: true,
      isUnique: false,
      entityType: CustomFieldEntityType.LEAD,
      validationRules: { minLength: 3, maxLength: 10, regex: '^[A-Z0-9]+$' },
    };

    it('should pass valid alphanumeric text', async () => {
      const result = await service.validateFieldValue(textField, 'CODE123');
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe('CODE123');
    });

    it('should fail if text is shorter than minLength', async () => {
      const result = await service.validateFieldValue(textField, 'AB');
      expect(result.isValid).toBe(false);
      expect(result.error?.rule).toBe('MIN_LENGTH');
    });

    it('should fail if text does not match regex', async () => {
      const result = await service.validateFieldValue(textField, 'ABC-12');
      expect(result.isValid).toBe(false);
      expect(result.error?.rule).toBe('REGEX');
    });
  });

  describe('NUMBER, CURRENCY, PERCENTAGE validation', () => {
    const numField = {
      id: 'f2',
      name: 'Deal Discount',
      key: 'deal_discount',
      fieldType: CustomFieldType.PERCENTAGE,
      isRequired: false,
      isUnique: false,
      entityType: CustomFieldEntityType.DEAL,
      validationRules: { min: 0, max: 100 },
    };

    it('should pass valid percentage number', async () => {
      const result = await service.validateFieldValue(numField, 25);
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe(25);
    });

    it('should fail when number exceeds max', async () => {
      const result = await service.validateFieldValue(numField, 150);
      expect(result.isValid).toBe(false);
      expect(result.error?.rule).toBe('MAX');
    });

    it('should fail when value is not a number', async () => {
      const result = await service.validateFieldValue(numField, 'not-a-number');
      expect(result.isValid).toBe(false);
      expect(result.error?.rule).toBe('INVALID_NUMBER');
    });
  });

  describe('DATE and DATETIME validation', () => {
    const dateField = {
      id: 'f3',
      name: 'Renewal Date',
      key: 'renewal_date',
      fieldType: CustomFieldType.DATE,
      isRequired: true,
      isUnique: false,
      entityType: CustomFieldEntityType.COMPANY,
    };

    it('should pass valid date', async () => {
      const result = await service.validateFieldValue(dateField, '2026-12-31');
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe('2026-12-31');
    });

    it('should fail invalid date string', async () => {
      const result = await service.validateFieldValue(dateField, 'invalid-date');
      expect(result.isValid).toBe(false);
      expect(result.error?.rule).toBe('INVALID_DATE');
    });
  });

  describe('DROPDOWN and MULTI_SELECT validation', () => {
    const dropdownField = {
      id: 'f4',
      name: 'Priority',
      key: 'priority',
      fieldType: CustomFieldType.DROPDOWN,
      isRequired: true,
      isUnique: false,
      entityType: CustomFieldEntityType.ACTIVITY,
      options: [
        { value: 'low', isActive: true },
        { value: 'medium', isActive: true },
        { value: 'high', isActive: true },
      ],
    };

    it('should pass matching option', async () => {
      const result = await service.validateFieldValue(dropdownField, 'high');
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe('high');
    });

    it('should fail non-matching option', async () => {
      const result = await service.validateFieldValue(dropdownField, 'urgent');
      expect(result.isValid).toBe(false);
      expect(result.error?.rule).toBe('INVALID_OPTION');
    });

    const multiField = {
      id: 'f5',
      name: 'Tags',
      key: 'tags',
      fieldType: CustomFieldType.MULTI_SELECT,
      isRequired: false,
      isUnique: false,
      entityType: CustomFieldEntityType.CONTACT,
      options: [
        { value: 'vip', isActive: true },
        { value: 'newsletter', isActive: true },
        { value: 'partner', isActive: true },
      ],
    };

    it('should pass array of valid options', async () => {
      const result = await service.validateFieldValue(multiField, ['vip', 'partner']);
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toEqual(['vip', 'partner']);
    });
  });

  describe('EMAIL, URL, and PHONE validation', () => {
    it('should validate email format', async () => {
      const emailField = {
        id: 'f6',
        name: 'Secondary Email',
        key: 'secondary_email',
        fieldType: CustomFieldType.EMAIL,
        isRequired: false,
        isUnique: false,
        entityType: CustomFieldEntityType.CONTACT,
      };

      const valid = await service.validateFieldValue(emailField, 'test@example.com');
      expect(valid.isValid).toBe(true);
      expect(valid.sanitizedValue).toBe('test@example.com');

      const invalid = await service.validateFieldValue(emailField, 'not-an-email');
      expect(invalid.isValid).toBe(false);
      expect(invalid.error?.rule).toBe('INVALID_EMAIL');
    });

    it('should validate URL format', async () => {
      const urlField = {
        id: 'f7',
        name: 'Portfolio',
        key: 'portfolio',
        fieldType: CustomFieldType.URL,
        isRequired: false,
        isUnique: false,
        entityType: CustomFieldEntityType.COMPANY,
      };

      const valid = await service.validateFieldValue(urlField, 'https://example.com/company');
      expect(valid.isValid).toBe(true);

      const invalid = await service.validateFieldValue(urlField, 'just some text');
      expect(invalid.isValid).toBe(false);
      expect(invalid.error?.rule).toBe('INVALID_URL');
    });

    it('should validate phone number format', async () => {
      const phoneField = {
        id: 'f8',
        name: 'Emergency Contact',
        key: 'emergency_contact',
        fieldType: CustomFieldType.PHONE,
        isRequired: false,
        isUnique: false,
        entityType: CustomFieldEntityType.CONTACT,
      };

      const valid = await service.validateFieldValue(phoneField, '+1-800-555-0199');
      expect(valid.isValid).toBe(true);

      const invalid = await service.validateFieldValue(phoneField, 'abc-no-phone');
      expect(invalid.isValid).toBe(false);
      expect(invalid.error?.rule).toBe('INVALID_PHONE');
    });
  });

  describe('USER_SELECTOR validation', () => {
    const userField = {
      id: 'f9',
      name: 'Executive Sponsor',
      key: 'executive_sponsor',
      fieldType: CustomFieldType.USER_SELECTOR,
      isRequired: true,
      isUnique: false,
      entityType: CustomFieldEntityType.DEAL,
    };

    it('should pass when user exists in DB', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', name: 'John Doe', email: 'john@example.com' });
      const result = await service.validateFieldValue(userField, 'user-1');
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe('user-1');
    });

    it('should fail when user does not exist in DB', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const result = await service.validateFieldValue(userField, 'non-existent-user');
      expect(result.isValid).toBe(false);
      expect(result.error?.rule).toBe('USER_NOT_FOUND');
    });
  });

  describe('deriveTypedValues', () => {
    it('should correctly derive indexed values for searching and filtering', () => {
      const numTyped = service.deriveTypedValues(CustomFieldType.CURRENCY, 5000);
      expect(numTyped.numberValue).toBe(5000);
      expect(numTyped.textValue).toBe('5000');

      const dateTyped = service.deriveTypedValues(CustomFieldType.DATE, '2026-10-26');
      expect(dateTyped.dateValue).toBeInstanceOf(Date);

      const boolTyped = service.deriveTypedValues(CustomFieldType.CHECKBOX, true);
      expect(boolTyped.booleanValue).toBe(true);
      expect(boolTyped.textValue).toBe('true');
    });
  });
});
