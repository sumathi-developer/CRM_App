import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { documentService } from '../../services/document.service';
import type { DocumentRecord } from '../../types/document.types';
import { DocumentsLayout } from './components/DocumentsLayout';
import { Badge, SectionCard } from '../lead-generation/components/Cards';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingIndicator } from '../../components/auth/LoadingIndicator';
import { formatDateTime } from '../lead-generation/leadGenConstants';
import {
  EditIcon,
  PlusIcon,
  UsersIcon,
} from '../../components/common/Icons';
import {
  formatFileSize,
  getDocumentFileCategory,
  getDocumentTypeBadgeInfo,
} from './documentConstants';

export const DocumentPreviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [allDocs, setAllDocs] = useState<DocumentRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string>(id || '');
  const [doc, setDoc] = useState<DocumentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoomPercent, setZoomPercent] = useState<number>(100);

  const loadPreviewData = useCallback(async () => {
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
      } else {
        setDoc(null);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load document preview.');
    } finally {
      setLoading(false);
    }
  }, [id, selectedId]);

  useEffect(() => {
    loadPreviewData();
  }, [loadPreviewData]);

  const handleSelectDocument = (nextId: string) => {
    setSelectedId(nextId);
    if (nextId) {
      navigate(`/documents/${nextId}/preview`);
    }
  };

  if (loading) {
    return (
      <DocumentsLayout
        title="Document Preview"
        subtitle="Loading document viewer..."
      >
        <div className="lg-card" style={{ padding: '2.5rem' }}>
          <LoadingIndicator message="Preparing document preview..." />
        </div>
      </DocumentsLayout>
    );
  }

  if (!doc) {
    return (
      <DocumentsLayout
        title="Document Preview"
        subtitle="Select or upload a document to preview its contents"
        error={error}
      >
        <EmptyState
          title="No documents available to preview"
          description="Upload a document first to inspect and preview it."
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

  const badge = getDocumentTypeBadgeInfo(doc);
  const category = getDocumentFileCategory(doc);

  const samplePreviewContent =
    doc.textContent ||
    doc.description ||
    [
      `Document Title: ${doc.displayTitle || doc.originalName}`,
      `Original File: ${doc.originalName}`,
      `MIME Type: ${doc.mimeType}`,
      `File Size: ${formatFileSize(doc.size)}`,
      `Storage Path: ${doc.path}`,
      `Uploaded: ${formatDateTime(doc.createdAt)}`,
      '',
      '--- Preview Summary ---',
      'This document is registered in the CRM Files repository.',
      'You can add or edit notes, tags, or text content in the Document Editor.',
    ].join('\n');

  return (
    <DocumentsLayout
      title={`Preview: ${doc.displayTitle || doc.originalName}`}
      subtitle={`${badge.shortLabel} · ${formatFileSize(doc.size)} · Interactive Document Viewer`}
      activeDocument={doc}
      error={error}
      onDismissError={() => setError(null)}
      actions={
        <div className="lg-badge-row">
          <select
            className="lg-select"
            value={doc.id}
            onChange={(e) => handleSelectDocument(e.target.value)}
            aria-label="Switch document to preview"
          >
            {allDocs.map((d) => (
              <option key={d.id} value={d.id}>
                {d.displayTitle || d.originalName}
              </option>
            ))}
          </select>

          <Link
            to={`/documents/${doc.id}/edit`}
            className="auth-btn btn-secondary btn-size-small"
          >
            <EditIcon size={14} /> Open in Editor
          </Link>
          <Link
            to={`/documents/${doc.id}/sharing`}
            className="auth-btn btn-primary btn-size-small"
          >
            <UsersIcon size={14} /> Share
          </Link>
        </div>
      }
    >
      <SectionCard
        title="Document Preview Canvas"
        subtitle={`Rendering ${doc.originalName} (${doc.mimeType})`}
        actions={
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setZoomPercent((z) => Math.max(75, z - 15))}
              className="rounded border border-gray-300 bg-white px-2 py-1 font-semibold text-gray-700 hover:bg-gray-50"
            >
              −
            </button>
            <span className="font-semibold text-gray-700">{zoomPercent}%</span>
            <button
              type="button"
              onClick={() => setZoomPercent((z) => Math.min(150, z + 15))}
              className="rounded border border-gray-300 bg-white px-2 py-1 font-semibold text-gray-700 hover:bg-gray-50"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => setZoomPercent(100)}
              className="rounded border border-gray-200 bg-gray-50 px-2 py-1 text-gray-600 hover:bg-gray-100"
            >
              Reset
            </button>
          </div>
        }
      >
        <div className="rounded-2xl border border-gray-200 bg-slate-900 p-6 text-slate-100 shadow-inner">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 pb-3">
            <div className="flex items-center gap-2">
              <Badge tone={badge.tone}>{badge.shortLabel}</Badge>
              <span className="text-xs font-semibold text-slate-200">
                {doc.originalName}
              </span>
            </div>
            <span className="text-xs text-slate-400">
              {category} Preview · {formatFileSize(doc.size)}
            </span>
          </div>

          <div
            className="mx-auto rounded-xl bg-white p-6 text-gray-900 shadow-lg transition-all"
            style={{
              maxWidth: `${Math.round((820 * zoomPercent) / 100)}px`,
              fontSize: `${Math.round((13 * zoomPercent) / 100)}px`,
            }}
          >
            {category === 'SPREADSHEET' && samplePreviewContent.includes(',') ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <tbody>
                    {samplePreviewContent
                      .split(/\r?\n/)
                      .filter(Boolean)
                      .slice(0, 20)
                      .map((row, rIdx) => (
                        <tr
                          key={rIdx}
                          className={
                            rIdx === 0
                              ? 'bg-gray-100 font-bold text-gray-900'
                              : 'border-t border-gray-200'
                          }
                        >
                          {row.split(',').map((cell, cIdx) => (
                            <td key={cIdx} className="p-2">
                              {cell.trim()}
                            </td>
                          ))}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <pre className="whitespace-pre-wrap font-mono leading-relaxed text-gray-800">
                {samplePreviewContent}
              </pre>
            )}
          </div>
        </div>
      </SectionCard>
    </DocumentsLayout>
  );
};

export default DocumentPreviewPage;

