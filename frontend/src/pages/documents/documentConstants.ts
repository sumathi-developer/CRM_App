import type {
  DocumentEntityType,
  DocumentFileCategory,
  DocumentPermissionLevel,
  DocumentRecord,
} from '../../types/document.types';

export const DOCUMENT_CATEGORY_OPTIONS: Array<{
  value: DocumentFileCategory;
  label: string;
}> = [
  { value: 'ALL', label: 'All File Types' },
  { value: 'PDF', label: 'PDF Documents' },
  { value: 'DOCUMENT', label: 'Word & Text Docs' },
  { value: 'SPREADSHEET', label: 'Spreadsheets & CSV' },
  { value: 'IMAGE', label: 'Images & Graphics' },
  { value: 'PRESENTATION', label: 'Presentations' },
  { value: 'ARCHIVE', label: 'Archives (ZIP/TAR)' },
  { value: 'OTHER', label: 'Other Files' },
];

export const DOCUMENT_ENTITY_TYPE_OPTIONS: Array<{
  value: DocumentEntityType;
  label: string;
}> = [
  { value: 'DEAL', label: 'Deal' },
  { value: 'CONTACT', label: 'Contact' },
  { value: 'LEAD', label: 'Lead' },
  { value: 'ORGANIZATION', label: 'Organization' },
];

export const DOCUMENT_PERMISSION_OPTIONS: Array<{
  value: DocumentPermissionLevel;
  label: string;
}> = [
  { value: 'VIEW', label: 'Can View & Download' },
  { value: 'COMMENT', label: 'Can Comment' },
  { value: 'EDIT', label: 'Can Edit Metadata & Share' },
];

export function getDocumentExtension(fileName?: string | null): string {
  if (!fileName) return '';
  const idx = fileName.lastIndexOf('.');
  if (idx === -1 || idx === fileName.length - 1) return '';
  return fileName.slice(idx + 1).toLowerCase();
}

export function getDocumentFileCategory(
  doc: Pick<DocumentRecord, 'mimeType' | 'originalName' | 'fileName'>,
): Exclude<DocumentFileCategory, 'ALL'> {
  const mime = (doc.mimeType || '').toLowerCase();
  const ext = getDocumentExtension(doc.originalName || doc.fileName);

  if (mime.includes('pdf') || ext === 'pdf') {
    return 'PDF';
  }
  if (
    mime.startsWith('image/') ||
    ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)
  ) {
    return 'IMAGE';
  }
  if (
    mime.includes('spreadsheet') ||
    mime.includes('excel') ||
    mime.includes('csv') ||
    ['xls', 'xlsx', 'csv', 'ods'].includes(ext)
  ) {
    return 'SPREADSHEET';
  }
  if (
    mime.includes('presentation') ||
    mime.includes('powerpoint') ||
    ['ppt', 'pptx', 'key'].includes(ext)
  ) {
    return 'PRESENTATION';
  }
  if (
    mime.includes('zip') ||
    mime.includes('tar') ||
    mime.includes('compressed') ||
    ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)
  ) {
    return 'ARCHIVE';
  }
  if (
    mime.startsWith('text/') ||
    mime.includes('word') ||
    mime.includes('document') ||
    mime.includes('json') ||
    ['doc', 'docx', 'txt', 'md', 'rtf', 'json', 'html'].includes(ext)
  ) {
    return 'DOCUMENT';
  }
  return 'OTHER';
}

export function getDocumentTypeBadgeInfo(
  doc: Pick<DocumentRecord, 'mimeType' | 'originalName' | 'fileName'>,
): {
  category: Exclude<DocumentFileCategory, 'ALL'>;
  shortLabel: string;
  tone: 'red' | 'blue' | 'green' | 'purple' | 'amber' | 'slate';
} {
  const category = getDocumentFileCategory(doc);
  const ext = getDocumentExtension(doc.originalName || doc.fileName).toUpperCase();

  switch (category) {
    case 'PDF':
      return { category, shortLabel: ext || 'PDF', tone: 'red' };
    case 'DOCUMENT':
      return { category, shortLabel: ext || 'DOC', tone: 'blue' };
    case 'SPREADSHEET':
      return { category, shortLabel: ext || 'XLS', tone: 'green' };
    case 'IMAGE':
      return { category, shortLabel: ext || 'IMG', tone: 'purple' };
    case 'PRESENTATION':
      return { category, shortLabel: ext || 'PPT', tone: 'amber' };
    case 'ARCHIVE':
      return { category, shortLabel: ext || 'ZIP', tone: 'slate' };
    default:
      return { category, shortLabel: ext || 'FILE', tone: 'slate' };
  }
}

export function formatFileSize(bytes?: number | null): string {
  const n = Number(bytes || 0);
  if (!n || n <= 0) return '0 B';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export function isTextEditableDocument(doc: DocumentRecord): boolean {
  const ext = getDocumentExtension(doc.originalName || doc.fileName);
  const mime = (doc.mimeType || '').toLowerCase();
  return (
    mime.startsWith('text/') ||
    mime.includes('json') ||
    ['txt', 'md', 'csv', 'json', 'html', 'log'].includes(ext)
  );
}

export function getDocumentRelatedLinks(doc: DocumentRecord): Array<{
  attachmentId: string;
  entityType: string;
  entityId: string;
  label: string;
  path: string;
}> {
  return (doc.attachments || []).map((att) => {
    const type = (att.entityType || '').toUpperCase();
    if (type === 'CONTACT' || att.contactId) {
      const id = att.contactId || att.entityId;
      const name = att.contact
        ? `${att.contact.firstName || ''} ${att.contact.lastName || ''}`.trim()
        : '';
      return {
        attachmentId: att.id,
        entityType: 'Contact',
        entityId: id,
        label: name || `Contact (${id.slice(0, 8)})`,
        path: `/contacts/${id}`,
      };
    }
    if (type === 'LEAD' || att.leadId) {
      const id = att.leadId || att.entityId;
      return {
        attachmentId: att.id,
        entityType: 'Lead',
        entityId: id,
        label: att.lead?.title || `Lead (${id.slice(0, 8)})`,
        path: `/leads/${id}`,
      };
    }
    if (type === 'DEAL' || att.dealId) {
      const id = att.dealId || att.entityId;
      return {
        attachmentId: att.id,
        entityType: 'Deal',
        entityId: id,
        label: att.deal?.title || `Deal (${id.slice(0, 8)})`,
        path: `/deals/${id}`,
      };
    }
    return {
      attachmentId: att.id,
      entityType: att.entityType || 'Organization',
      entityId: att.entityId,
      label: `${att.entityType}: ${att.entityId.slice(0, 8)}`,
      path: `/documents/${doc.id}`,
    };
  });
}

