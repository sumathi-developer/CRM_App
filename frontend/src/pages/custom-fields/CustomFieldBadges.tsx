import React from 'react';
import type { CustomFieldEntityType, CustomFieldType } from '../../types/custom-field.types';
import {
  SlidersIcon,
  DollarSignIcon,
  CalendarIcon,
  CheckCircleIcon,
  UserIcon,
  BuildingIcon,
  PhoneIcon,
  MailIcon,
  GlobeIcon,
} from '../../components/common/Icons';

interface CustomFieldEntityBadgeProps {
  entityType: CustomFieldEntityType | string;
  className?: string;
}

export const CustomFieldEntityBadge: React.FC<CustomFieldEntityBadgeProps> = ({
  entityType,
  className = '',
}) => {
  const norm = (entityType || 'LEAD').toUpperCase();

  let styleClass = 'entity-lead';
  let icon = <BuildingIcon size={12} />;

  if (norm === 'CONTACT') {
    styleClass = 'entity-contact';
    icon = <UserIcon size={12} />;
  } else if (norm === 'COMPANY') {
    styleClass = 'entity-company';
    icon = <BuildingIcon size={12} />;
  } else if (norm === 'DEAL') {
    styleClass = 'entity-deal';
    icon = <DollarSignIcon size={12} />;
  } else if (norm === 'ACTIVITY') {
    styleClass = 'entity-activity';
    icon = <CalendarIcon size={12} />;
  }

  return (
    <span className={`entity-badge ${styleClass} ${className}`}>
      {icon}
      <span>{norm}</span>
    </span>
  );
};

interface CustomFieldTypeBadgeProps {
  fieldType?: CustomFieldType | string;
  type?: CustomFieldType | string;
  className?: string;
}

export const CustomFieldTypeBadge: React.FC<CustomFieldTypeBadgeProps> = ({
  fieldType,
  type,
  className = '',
}) => {
  const norm = (fieldType || type || 'TEXT').toUpperCase();

  let styleClass = 'type-text';
  let icon = <SlidersIcon size={12} />;

  if (norm === 'NUMBER') {
    styleClass = 'type-number';
    icon = <span>#</span>;
  } else if (norm === 'CURRENCY') {
    styleClass = 'type-currency';
    icon = <DollarSignIcon size={12} />;
  } else if (norm === 'DROPDOWN') {
    styleClass = 'type-dropdown';
    icon = <SlidersIcon size={12} />;
  } else if (norm === 'MULTI_SELECT') {
    styleClass = 'type-multi-select';
    icon = <SlidersIcon size={12} />;
  } else if (norm === 'DATE' || norm === 'DATETIME') {
    styleClass = 'type-date';
    icon = <CalendarIcon size={12} />;
  } else if (norm === 'CHECKBOX') {
    styleClass = 'type-checkbox';
    icon = <CheckCircleIcon size={12} />;
  } else if (norm === 'USER_SELECTOR') {
    styleClass = 'type-user';
    icon = <UserIcon size={12} />;
  } else if (norm === 'EMAIL') {
    styleClass = 'type-text';
    icon = <MailIcon size={12} />;
  } else if (norm === 'PHONE') {
    styleClass = 'type-text';
    icon = <PhoneIcon size={12} />;
  } else if (norm === 'URL') {
    styleClass = 'type-text';
    icon = <GlobeIcon size={12} />;
  }

  return (
    <span className={`field-type-badge ${styleClass} ${className}`}>
      {icon}
      <span>{norm.replace(/_/g, ' ')}</span>
    </span>
  );
};
