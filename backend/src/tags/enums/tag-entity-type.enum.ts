import { BadRequestException } from '@nestjs/common';

export enum TagEntityType {
  LEAD = 'LEAD',
  CONTACT = 'CONTACT',
  COMPANY = 'COMPANY',
  DEAL = 'DEAL',
  ACTIVITY = 'ACTIVITY',
  DOCUMENT = 'DOCUMENT',
}

export function normalizeTagEntityType(type: string): TagEntityType {
  if (!type || typeof type !== 'string') {
    throw new BadRequestException('Entity type must be a valid non-empty string');
  }

  const upper = type.toUpperCase().trim();

  switch (upper) {
    case 'LEAD':
    case 'LEADS':
      return TagEntityType.LEAD;

    case 'CONTACT':
    case 'CONTACTS':
      return TagEntityType.CONTACT;

    case 'COMPANY':
    case 'COMPANIES':
    case 'ORGANIZATION':
    case 'ORGANIZATIONS':
      return TagEntityType.COMPANY;

    case 'DEAL':
    case 'DEALS':
      return TagEntityType.DEAL;

    case 'ACTIVITY':
    case 'ACTIVITIES':
      return TagEntityType.ACTIVITY;

    case 'DOCUMENT':
    case 'DOCUMENTS':
    case 'FILE':
    case 'FILES':
      return TagEntityType.DOCUMENT;

    default:
      throw new BadRequestException(
        `Unsupported entity type "${type}". Supported entity types are: LEAD, CONTACT, COMPANY, DEAL, ACTIVITY, DOCUMENT`,
      );
  }
}
