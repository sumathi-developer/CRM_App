import { api, ApiError } from './api';
import { activityService } from './activity.service';
import type {
  AttachDocumentPayload,
  DocumentContactRef,
  DocumentDealRef,
  DocumentLeadRef,
  DocumentOrgRef,
  DocumentPermissionLevel,
  DocumentRecord,
  DocumentShareEntry,
  DocumentUploaderRef,
  UpdateDocumentMetadataPayload,
} from '../types/document.types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const DOC_META_STORAGE_KEY = 'crm_documents_metadata_v1';

interface StoredDocumentMeta {
  displayTitle?: string;
  description?: string;
  tags?: string[];
  textContent?: string;
  shares?: DocumentShareEntry[];
  updatedAt?: string;
}

function getStoredMetaMap(): Record<string, StoredDocumentMeta> {
  try {
    const raw = localStorage.getItem(DOC_META_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
}

function saveStoredMetaMap(map: Record<string, StoredDocumentMeta>) {
  try {
    localStorage.setItem(DOC_META_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore storage errors
  }
}

function normalizeDocument(raw: any): DocumentRecord {
  const metaMap = getStoredMetaMap();
  const meta = metaMap[raw.id] || {};
  const attachments = Array.isArray(raw.attachments) ? raw.attachments : [];
  const shares = Array.isArray(meta.shares) ? meta.shares : [];

  return {
    id: raw.id,
    originalName: raw.originalName || raw.fileName || 'Untitled Document',
    fileName: raw.fileName || raw.originalName || 'document',
    mimeType: raw.mimeType || 'application/octet-stream',
    size: Number(raw.size || 0),
    path: raw.path || '',
    uploadedById: raw.uploadedById ?? raw.uploadedBy?.id ?? null,
    uploadedBy: raw.uploadedBy ?? null,
    attachments,
    createdAt: raw.createdAt || new Date().toISOString(),
    displayTitle:
      meta.displayTitle || raw.originalName || raw.fileName || 'Untitled Document',
    description: meta.description || '',
    tags: Array.isArray(meta.tags) ? meta.tags : [],
    textContent: meta.textContent,
    shares,
    isShared: attachments.length > 0 || shares.length > 0,
    updatedAt: meta.updatedAt || raw.createdAt || new Date().toISOString(),
  };
}

class DocumentApiService {
  /* ---------------- Core File / Document APIs ---------------- */

  async getAllDocuments(): Promise<DocumentRecord[]> {
    const res = await api.get<any>('/files');
    const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
    return list.map(normalizeDocument);
  }

  async getRecentDocuments(limit = 15): Promise<DocumentRecord[]> {
    const all = await this.getAllDocuments();
    return [...all]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, limit);
  }

  async getSharedDocuments(): Promise<DocumentRecord[]> {
    const all = await this.getAllDocuments();
    return all.filter(
      (doc) =>
        doc.attachments.length > 0 || (doc.shares && doc.shares.length > 0),
    );
  }

  async getDocumentById(id: string): Promise<DocumentRecord> {
    const res = await api.get<any>(`/files/${id}`);
    const data = res?.data || res;
    return normalizeDocument(data);
  }

  async uploadDocumentWithProgress(
    file: File,
    onProgress?: (percent: number) => void,
  ): Promise<DocumentRecord> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('file', file);

      xhr.open('POST', `${API_BASE_URL}/files/upload`, true);
      xhr.setRequestHeader('Accept', 'application/json');

      const token = api.getAccessToken();
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && event.total > 0) {
            const pct = Math.min(
              99,
              Math.round((event.loaded / event.total) * 100),
            );
            onProgress(pct);
          }
        };
      }

      xhr.onload = () => {
        let parsed: any = {};
        try {
          parsed = JSON.parse(xhr.responseText || '{}');
        } catch {
          parsed = {};
        }

        if (xhr.status >= 200 && xhr.status < 300) {
          onProgress?.(100);
          const created = parsed?.data || parsed;
          resolve(normalizeDocument(created));
        } else {
          const msg = Array.isArray(parsed?.message)
            ? parsed.message.join(', ')
            : parsed?.message || 'Failed to upload document';
          reject(new ApiError(msg, xhr.status, parsed?.error));
        }
      };

      xhr.onerror = () => {
        reject(new ApiError('Network error while uploading document', 0));
      };

      xhr.send(formData);
    });
  }

  async deleteDocument(id: string): Promise<{ message: string }> {
    const res = await api.delete<any>(`/files/${id}`);
    const map = getStoredMetaMap();
    if (map[id]) {
      delete map[id];
      saveStoredMetaMap(map);
    }
    return res?.data || res || { message: 'Document deleted' };
  }

  /* ---------------- Entity Attachment & Sharing ---------------- */

  async attachDocument(
    fileId: string,
    payload: AttachDocumentPayload,
  ): Promise<any> {
    const res = await api.post<any>(`/files/${fileId}/attach`, payload);
    return res?.data || res;
  }

  async detachDocument(
    fileId: string,
    attachmentId?: string,
  ): Promise<{ message: string }> {
    const q = attachmentId
      ? `?attachmentId=${encodeURIComponent(attachmentId)}`
      : '';
    const res = await api.delete<any>(`/files/${fileId}/attach${q}`);
    return res?.data || res || { message: 'Document detached' };
  }

  /* ---------------- Document Editor & Permission Sharing Metadata ---------------- */

  updateDocumentMetadata(
    fileId: string,
    payload: UpdateDocumentMetadataPayload,
  ): StoredDocumentMeta {
    const map = getStoredMetaMap();
    const existing = map[fileId] || {};
    const updated: StoredDocumentMeta = {
      ...existing,
      ...payload,
      updatedAt: new Date().toISOString(),
    };
    map[fileId] = updated;
    saveStoredMetaMap(map);
    return updated;
  }

  addDocumentShare(
    fileId: string,
    entry: {
      targetType: 'USER' | 'WORKSPACE' | 'LINK';
      userId?: string;
      userName?: string;
      userEmail?: string;
      permission: DocumentPermissionLevel;
    },
  ): DocumentShareEntry[] {
    const map = getStoredMetaMap();
    const existing = map[fileId] || {};
    const currentShares = Array.isArray(existing.shares) ? existing.shares : [];

    const newEntry: DocumentShareEntry = {
      id: `share-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      targetType: entry.targetType,
      userId: entry.userId,
      userName: entry.userName,
      userEmail: entry.userEmail,
      permission: entry.permission,
      sharedAt: new Date().toISOString(),
    };

    const nextShares = [
      ...currentShares.filter(
        (s) => !(entry.userId && s.userId === entry.userId),
      ),
      newEntry,
    ];

    map[fileId] = {
      ...existing,
      shares: nextShares,
      updatedAt: new Date().toISOString(),
    };
    saveStoredMetaMap(map);
    return nextShares;
  }

  removeDocumentShare(fileId: string, shareId: string): DocumentShareEntry[] {
    const map = getStoredMetaMap();
    const existing = map[fileId] || {};
    const currentShares = Array.isArray(existing.shares) ? existing.shares : [];
    const nextShares = currentShares.filter((s) => s.id !== shareId);
    map[fileId] = {
      ...existing,
      shares: nextShares,
      updatedAt: new Date().toISOString(),
    };
    saveStoredMetaMap(map);
    return nextShares;
  }

  /* ---------------- CRM Lookups ---------------- */

  async getUsersLookup(): Promise<DocumentUploaderRef[]> {
    return activityService.getAssignableUsers();
  }

  async getContactsLookup(): Promise<DocumentContactRef[]> {
    return activityService.getContactsLookup();
  }

  async getLeadsLookup(): Promise<DocumentLeadRef[]> {
    return activityService.getLeadsLookup();
  }

  async getDealsLookup(): Promise<DocumentDealRef[]> {
    return activityService.getDealsLookup();
  }

  async getOrganizationsLookup(): Promise<DocumentOrgRef[]> {
    try {
      const res = await api.get<any>('/organizations');
      const payload = res?.data && !Array.isArray(res.data) ? res.data : res;
      const list = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
          ? payload
          : [];
      return list.map((o: any) => ({ id: o.id, name: o.name }));
    } catch {
      return [];
    }
  }
}

export const documentService = new DocumentApiService();
export default documentService;
