import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { documentService } from '../../services/document.service';
import type {
  DocumentContactRef,
  DocumentDealRef,
  DocumentEntityType,
  DocumentLeadRef,
  DocumentOrgRef,
  DocumentRecord,
} from '../../types/document.types';
import { DocumentsLayout } from './components/DocumentsLayout';
import { Badge, SectionCard } from '../lead-generation/components/Cards';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  PlusIcon,
  TrashIcon,
} from '../../components/common/Icons';
import {
  DOCUMENT_ENTITY_TYPE_OPTIONS,
  formatFileSize,
} from './documentConstants';

interface QueuedUploadItem {
  id: string;
  file: File;
  progress: number;
  status: 'PENDING' | 'UPLOADING' | 'COMPLETED' | 'ERROR';
  uploadedRecord?: DocumentRecord;
  errorMessage?: string;
}

export const UploadDocumentPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialEntityType =
    (searchParams.get('entityType') as DocumentEntityType) || 'DEAL';
  const initialEntityId = searchParams.get('entityId') || '';

  const [queue, setQueue] = useState<QueuedUploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  const [attachToEntity, setAttachToEntity] = useState<boolean>(
    Boolean(initialEntityId),
  );
  const [entityType, setEntityType] =
    useState<DocumentEntityType>(initialEntityType);
  const [entityId, setEntityId] = useState<string>(initialEntityId);

  const [contacts, setContacts] = useState<DocumentContactRef[]>([]);
  const [leads, setLeads] = useState<DocumentLeadRef[]>([]);
  const [deals, setDeals] = useState<DocumentDealRef[]>([]);
  const [organizations, setOrganizations] = useState<DocumentOrgRef[]>([]);

  const [isUploadingAll, setIsUploadingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      documentService.getContactsLookup(),
      documentService.getLeadsLookup(),
      documentService.getDealsLookup(),
      documentService.getOrganizationsLookup(),
    ])
      .then(([c, l, d, o]) => {
        setContacts(c);
        setLeads(l);
        setDeals(d);
        setOrganizations(o);
      })
      .catch(() => {});
  }, []);

  const addFilesToQueue = (files: FileList | File[]) => {
    const incoming: QueuedUploadItem[] = Array.from(files).map((file) => ({
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      file,
      progress: 0,
      status: 'PENDING',
    }));
    setQueue((prev) => [...prev, ...incoming]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFilesToQueue(e.target.files);
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFilesToQueue(e.dataTransfer.files);
    }
  };

  const handleUploadQueue = async () => {
    const pendingItems = queue.filter((item) => item.status !== 'COMPLETED');
    if (pendingItems.length === 0) {
      setError('Please select at least one file to upload.');
      return;
    }
    if (attachToEntity && !entityId) {
      setError(`Please select a ${entityType.toLowerCase()} record to attach to.`);
      return;
    }

    setIsUploadingAll(true);
    setError(null);
    setSuccess(null);

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    let lastUploaded: DocumentRecord | null = null;
    let completedCount = 0;

    for (const item of pendingItems) {
      setQueue((prev) =>
        prev.map((q) =>
          q.id === item.id
            ? { ...q, status: 'UPLOADING', progress: 5, errorMessage: undefined }
            : q,
        ),
      );

      try {
        // Read text content if it is a small text/markdown/csv/json file for rich preview & editor
        let textContent: string | undefined;
        if (
          item.file.size <= 256 * 1024 &&
          (item.file.type.startsWith('text/') ||
            /\.(txt|md|csv|json|html)$/i.test(item.file.name))
        ) {
          textContent = await item.file.text().catch(() => undefined);
        }

        const record = await documentService.uploadDocumentWithProgress(
          item.file,
          (pct) => {
            setQueue((prev) =>
              prev.map((q) => (q.id === item.id ? { ...q, progress: pct } : q)),
            );
          },
        );

        if (description.trim() || parsedTags.length > 0 || textContent) {
          documentService.updateDocumentMetadata(record.id, {
            displayTitle: record.originalName,
            description: description.trim() || undefined,
            tags: parsedTags.length > 0 ? parsedTags : undefined,
            textContent,
          });
        }

        if (attachToEntity && entityId) {
          await documentService.attachDocument(record.id, {
            entityType,
            entityId,
            contactId: entityType === 'CONTACT' ? entityId : undefined,
            leadId: entityType === 'LEAD' ? entityId : undefined,
            dealId: entityType === 'DEAL' ? entityId : undefined,
          });
        }

        lastUploaded = record;
        completedCount += 1;

        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? {
                  ...q,
                  progress: 100,
                  status: 'COMPLETED',
                  uploadedRecord: record,
                }
              : q,
          ),
        );
      } catch (err: any) {
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? {
                  ...q,
                  status: 'ERROR',
                  errorMessage: err?.message || 'Upload failed',
                }
              : q,
          ),
        );
      }
    }

    setIsUploadingAll(false);

    if (completedCount > 0) {
      setSuccess(`Successfully uploaded ${completedCount} document(s).`);
      if (completedCount === 1 && lastUploaded) {
        setTimeout(() => {
          navigate(`/documents/${lastUploaded!.id}`);
        }, 600);
      }
    }
  };

  return (
    <DocumentsLayout
      title="Upload Document"
      subtitle="Upload files through the CRM Files API with real-time progress tracking and optional record attachment."
      error={error}
      success={success}
      onDismissError={() => setError(null)}
      onDismissSuccess={() => setSuccess(null)}
      actions={
        <Link to="/documents" className="auth-btn btn-secondary btn-size-small">
          <ArrowLeftIcon size={15} /> Back to Documents
        </Link>
      }
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Dropzone & Upload Progress Queue */}
        <div className="space-y-6 lg:col-span-8">
          <SectionCard
            title="1. Select or Drag & Drop Files"
            subtitle="Supports PDFs, Word docs, Excel spreadsheets, CSVs, presentations, images, and text files"
          >
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-all ${
                isDragging
                  ? 'border-blue-600 bg-blue-50/70'
                  : 'border-gray-300 bg-gray-50/60 hover:border-blue-400'
              }`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <PlusIcon size={22} />
              </div>
              <p className="mt-3 text-sm font-bold text-gray-900">
                Drag and drop documents here, or browse from your computer
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Files are uploaded directly to the backend `/files/upload` endpoint
              </p>

              <label className="mt-4 inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700">
                <PlusIcon size={14} /> Choose Files
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Upload Queue & Progress */}
            {queue.length > 0 && (
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <strong className="text-xs uppercase tracking-wider text-gray-600">
                    Upload Queue & Progress ({queue.length})
                  </strong>
                  <button
                    type="button"
                    disabled={isUploadingAll}
                    onClick={() => setQueue([])}
                    className="text-xs text-gray-500 hover:text-red-600"
                  >
                    Clear Queue
                  </button>
                </div>

                {queue.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-2xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-gray-900">
                          {item.file.name}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {formatFileSize(item.file.size)} ·{' '}
                          {item.file.type || 'application/octet-stream'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          tone={
                            item.status === 'COMPLETED'
                              ? 'green'
                              : item.status === 'ERROR'
                                ? 'red'
                                : item.status === 'UPLOADING'
                                  ? 'blue'
                                  : 'slate'
                          }
                        >
                          {item.status === 'UPLOADING'
                            ? `Uploading ${item.progress}%`
                            : item.status}
                        </Badge>

                        {item.uploadedRecord && (
                          <Link
                            to={`/documents/${item.uploadedRecord.id}`}
                            className="text-xs font-semibold text-blue-600 hover:underline"
                          >
                            Open →
                          </Link>
                        )}

                        {item.status !== 'UPLOADING' && (
                          <button
                            type="button"
                            onClick={() =>
                              setQueue((prev) =>
                                prev.filter((q) => q.id !== item.id),
                              )
                            }
                            className="text-gray-400 hover:text-red-600"
                            title="Remove from queue"
                          >
                            <TrashIcon size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full transition-all duration-200 ${
                          item.status === 'ERROR'
                            ? 'bg-red-500'
                            : item.status === 'COMPLETED'
                              ? 'bg-emerald-500'
                              : 'bg-blue-600'
                        }`}
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>

                    {item.errorMessage && (
                      <p className="mt-1.5 text-xs font-medium text-red-600">
                        {item.errorMessage}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Right: Metadata & CRM Record Attachment */}
        <div className="space-y-6 lg:col-span-4">
          <SectionCard
            title="2. Metadata & CRM Record Link"
            subtitle="Add optional tags, notes, and link to a Deal, Contact, or Lead"
          >
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">
                  Document Description / Notes
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Signed MSA and Q4 Enterprise pricing sheet..."
                  className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="contract, proposal, legal, q4"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="border-t border-gray-100 pt-3">
                <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-gray-800">
                  <input
                    type="checkbox"
                    checked={attachToEntity}
                    onChange={(e) => setAttachToEntity(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600"
                  />
                  <span>Attach uploaded file(s) to a CRM record</span>
                </label>

                {attachToEntity && (
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">
                        CRM Entity Type
                      </label>
                      <select
                        value={entityType}
                        onChange={(e) => {
                          setEntityType(e.target.value as DocumentEntityType);
                          setEntityId('');
                        }}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-800"
                      >
                        {DOCUMENT_ENTITY_TYPE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">
                        Select {entityType} Record
                      </label>
                      <select
                        value={entityId}
                        onChange={(e) => setEntityId(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-800"
                      >
                        <option value="">— Select {entityType} —</option>
                        {entityType === 'DEAL' &&
                          deals.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.title}
                            </option>
                          ))}
                        {entityType === 'CONTACT' &&
                          contacts.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.firstName} {c.lastName}
                            </option>
                          ))}
                        {entityType === 'LEAD' &&
                          leads.map((l) => (
                            <option key={l.id} value={l.id}>
                              {l.title}
                            </option>
                          ))}
                        {entityType === 'ORGANIZATION' &&
                          organizations.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                disabled={isUploadingAll || queue.length === 0}
                onClick={handleUploadQueue}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <CheckCircleIcon size={15} />
                {isUploadingAll
                  ? 'Uploading Files...'
                  : `Start Upload (${queue.filter((q) => q.status !== 'COMPLETED').length} file${queue.length === 1 ? '' : 's'})`}
              </button>
            </div>
          </SectionCard>
        </div>
      </div>
    </DocumentsLayout>
  );
};

export default UploadDocumentPage;

