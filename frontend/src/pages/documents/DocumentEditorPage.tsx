import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { documentService } from '../../services/document.service';
import type { DocumentRecord } from '../../types/document.types';
import { DocumentsLayout } from './components/DocumentsLayout';
import { SectionCard } from '../lead-generation/components/Cards';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import {
  CheckIcon,
  EyeIcon,
  PlusIcon,
} from '../../components/common/Icons';
import { formatFileSize } from './documentConstants';

export const DocumentEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [allDocs, setAllDocs] = useState<DocumentRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string>(id || '');
  const [doc, setDoc] = useState<DocumentRecord | null>(null);

  const [displayTitle, setDisplayTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [textContent, setTextContent] = useState('');

  // Optional replacement file upload
  const [replacementFile, setReplacementFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadEditorData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await documentService.getAllDocuments();
      setAllDocs(list);

      const targetId = id || selectedId || list[0]?.id || '';
      if (targetId) {
        setSelectedId(targetId);
        const detail = await documentService.getDocumentById(targetId);
        setDoc(detail);
        setDisplayTitle(detail.displayTitle || detail.originalName);
        setDescription(detail.description || '');
        setTagsInput((detail.tags || []).join(', '));
        setTextContent(
          detail.textContent ||
            `# ${detail.displayTitle || detail.originalName}\n\nAdd structured document notes, clauses, or markdown content here...`,
        );
      } else {
        setDoc(null);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load document editor.');
    } finally {
      setLoading(false);
    }
  }, [id, selectedId]);

  useEffect(() => {
    loadEditorData();
  }, [loadEditorData]);

  const handleSelectDocument = (nextId: string) => {
    setSelectedId(nextId);
    if (nextId) {
      navigate(`/documents/${nextId}/edit`);
    }
  };

  const handleSaveEditor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doc) return;
    if (!displayTitle.trim()) {
      setError('Document title is required.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const parsedTags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      let targetDocId = doc.id;

      // If user selected a replacement file version, upload via /files/upload
      if (replacementFile) {
        setUploadProgress(10);
        const uploaded = await documentService.uploadDocumentWithProgress(
          replacementFile,
          (pct) => setUploadProgress(pct),
        );
        targetDocId = uploaded.id;
        setReplacementFile(null);
      }

      documentService.updateDocumentMetadata(targetDocId, {
        displayTitle: displayTitle.trim(),
        description: description.trim(),
        tags: parsedTags,
        textContent,
      });

      setSuccess('Document changes saved.');
      if (targetDocId !== doc.id) {
        navigate(`/documents/${targetDocId}`);
      } else {
        await loadEditorData();
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to save document changes.');
    } finally {
      setSaving(false);
      setUploadProgress(0);
    }
  };

  if (loading) {
    return (
      <DocumentsLayout
        title="Document Editor"
        subtitle="Loading document editor..."
      >
        <div className="lg-card" style={{ padding: '2.5rem' }}>
          <LoadingIndicator message="Loading document editor..." />
        </div>
      </DocumentsLayout>
    );
  }

  if (!doc) {
    return (
      <DocumentsLayout
        title="Document Editor"
        subtitle="Select or upload a document to edit"
        error={error}
      >
        <EmptyState
          title="No documents available to edit"
          description="Upload a document first to edit its metadata, notes, or content."
          action={
            <Link
              to="/documents/upload"
              className="auth-btn btn-primary btn-size-small"
            >
              <PlusIcon size={14} /> Upload Document
            </Link>
          }
        />
      </DocumentsLayout>
    );
  }

  return (
    <DocumentsLayout
      title={`Edit: ${doc.displayTitle || doc.originalName}`}
      subtitle="Update document title, description, tags, editable content, or upload a revised file version."
      activeDocument={doc}
      error={error}
      success={success}
      onDismissError={() => setError(null)}
      onDismissSuccess={() => setSuccess(null)}
      actions={
        <div className="lg-badge-row">
          <select
            className="lg-select"
            value={doc.id}
            onChange={(e) => handleSelectDocument(e.target.value)}
            aria-label="Switch document in editor"
          >
            {allDocs.map((d) => (
              <option key={d.id} value={d.id}>
                {d.displayTitle || d.originalName}
              </option>
            ))}
          </select>

          <Link
            to={`/documents/${doc.id}/preview`}
            className="auth-btn btn-secondary btn-size-small"
          >
            <EyeIcon size={14} /> Preview
          </Link>
        </div>
      }
    >
      <form onSubmit={handleSaveEditor} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <SectionCard
              title="Document Content & Notes Editor"
              subtitle="Edit structured document content, clauses, or markdown summary"
            >
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">
                    Document Display Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={displayTitle}
                    onChange={(e) => setDisplayTitle(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">
                    Editable Document Content / Clauses
                  </label>
                  <textarea
                    rows={14}
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white p-3 font-mono text-xs leading-relaxed text-gray-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="space-y-6 lg:col-span-4">
            <SectionCard
              title="Metadata, Tags & Version Upload"
              subtitle="Organize document attributes"
            >
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">
                    Summary / Description
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of this document..."
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
                    placeholder="contract, enterprise, legal"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs">
                  <p className="font-semibold text-gray-800">
                    Upload New File Version (Optional)
                  </p>
                  <p className="mt-0.5 text-[11px] text-gray-500">
                    Current: {doc.originalName} ({formatFileSize(doc.size)})
                  </p>

                  <input
                    type="file"
                    onChange={(e) =>
                      setReplacementFile(e.target.files?.[0] || null)
                    }
                    className="mt-2 block w-full text-xs text-gray-600"
                  />

                  {uploadProgress > 0 && (
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full bg-blue-600 transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Link
                    to={`/documents/${doc.id}`}
                    className="rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    <CheckIcon size={14} />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>
      </form>
    </DocumentsLayout>
  );
};

export default DocumentEditorPage;

