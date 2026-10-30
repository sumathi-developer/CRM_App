export type DocumentFileCategory =
  | 'ALL'
  | 'PDF'
  | 'DOCUMENT'
  | 'SPREADSHEET'
  | 'IMAGE'
  | 'PRESENTATION'
  | 'ARCHIVE'
  | 'OTHER';

export type DocumentEntityType = 'CONTACT' | 'LEAD' | 'DEAL' | 'ORGANIZATION';

export type DocumentPermissionLevel = 'VIEW' | 'COMMENT' | 'EDIT';

export interface DocumentUploaderRef {
  id: string;
  name: string;
  email?: string;
}

export interface DocumentContactRef {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

export interface DocumentLeadRef {
  id: string;
  title: string;
  companyName?: string | null;
}

export interface DocumentDealRef {
  id: string;
  title: string;
  value?: number;
}

export interface DocumentOrgRef {
  id: string;
  name: string;
}

export interface DocumentAttachmentRecord {
  id: string;
  fileId: string;
  entityType: DocumentEntityType | string;
  entityId: string;
  contactId?: string | null;
  contact?: DocumentContactRef | null;
  leadId?: string | null;
  lead?: DocumentLeadRef | null;
  dealId?: string | null;
  deal?: DocumentDealRef | null;
  createdAt: string;
}

export interface DocumentShareEntry {
  id: string;
  targetType: 'USER' | 'WORKSPACE' | 'LINK';
  userId?: string;
  userName?: string;
  userEmail?: string;
  permission: DocumentPermissionLevel;
  sharedAt: string;
}

export interface DocumentRecord {
  id: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  path: string;
  uploadedById?: string | null;
  uploadedBy?: DocumentUploaderRef | null;
  attachments: DocumentAttachmentRecord[];
  createdAt: string;
  // Enriched metadata for editor, preview & sharing UI
  displayTitle?: string;
  description?: string;
  tags?: string[];
  textContent?: string;
  shares?: DocumentShareEntry[];
  isShared?: boolean;
  updatedAt?: string;
}

export interface AttachDocumentPayload {
  entityType: DocumentEntityType;
  entityId: string;
  contactId?: string;
  leadId?: string;
  dealId?: string;
}

export interface UpdateDocumentMetadataPayload {
  displayTitle?: string;
  description?: string;
  tags?: string[];
  textContent?: string;
}

