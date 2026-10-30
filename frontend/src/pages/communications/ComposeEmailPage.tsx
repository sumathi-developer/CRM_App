import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { communicationService } from '../../services/communication.service';
import type {
  CommunicationContactRef,
  CommunicationDealRef,
  CommunicationLeadRef,
  EmailAttachmentItem,
  EmailTemplateItem,
} from '../../types/communication.types';
import { CommunicationsLayout } from './components/CommunicationsLayout';
import { Badge, SectionCard } from '../lead-generation/components/Cards';
import {
  ArrowLeftIcon,
  CheckIcon,
  MailIcon,
  PlusIcon,
  SendIcon,
  TrashIcon,
} from '../../components/common/Icons';
import {
  DEFAULT_TEMPLATE_TOKENS,
  formatBytes,
  stripHtmlToText,
} from './communicationConstants';

export const ComposeEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const draftId = searchParams.get('draftId') || '';
  const initialTemplateId = searchParams.get('templateId') || '';
  const initialContactId = searchParams.get('contactId') || '';
  const initialLeadId = searchParams.get('leadId') || '';
  const initialDealId = searchParams.get('dealId') || '';
  const initialTo = searchParams.get('to') || '';

  const [recipients, setRecipients] = useState<string[]>(() =>
    initialTo ? [initialTo] : [],
  );
  const [recipientInput, setRecipientInput] = useState('');

  const [showCcBcc, setShowCcBcc] = useState(false);
  const [ccList, setCcList] = useState<string[]>([]);
  const [ccInput, setCcInput] = useState('');
  const [bccList, setBccList] = useState<string[]>([]);
  const [bccInput, setBccInput] = useState('');

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] =
    useState(initialTemplateId);

  const [contactId, setContactId] = useState(initialContactId);
  const [leadId, setLeadId] = useState(initialLeadId);
  const [dealId, setDealId] = useState(initialDealId);

  const [attachments, setAttachments] = useState<EmailAttachmentItem[]>([]);
  const [customFilename, setCustomFilename] = useState('');

  const [templates, setTemplates] = useState<EmailTemplateItem[]>([]);
  const [contacts, setContacts] = useState<CommunicationContactRef[]>([]);
  const [leads, setLeads] = useState<CommunicationLeadRef[]>([]);
  const [deals, setDeals] = useState<CommunicationDealRef[]>([]);

  const [loadingInitial, setLoadingInitial] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      communicationService.getTemplates({ limit: 50 }),
      communicationService.getContactsLookup(),
      communicationService.getLeadsLookup(),
      communicationService.getDealsLookup(),
    ])
      .then(([tplRes, cList, lList, dList]) => {
        setTemplates(tplRes.items);
        setContacts(cList);
        setLeads(lList);
        setDeals(dList);
      })
      .catch(() => {});
  }, []);

  // Load existing draft if editing a saved draft
  useEffect(() => {
    if (!draftId) return;
    setLoadingInitial(true);
    communicationService
      .getEmailById(draftId)
      .then((draft) => {
        setRecipients(draft.recipients);
        setCcList(draft.cc || []);
        setBccList(draft.bcc || []);
        if ((draft.cc && draft.cc.length > 0) || (draft.bcc && draft.bcc.length > 0)) {
          setShowCcBcc(true);
        }
        setSubject(draft.subject === '(No Subject)' ? '' : draft.subject);
        setBody(draft.body || '');
        setContactId(draft.contactId || '');
        setLeadId(draft.leadId || '');
        setDealId(draft.dealId || '');
        setAttachments(draft.attachments || []);
      })
      .catch((err: any) => {
        setError(err?.message || 'Could not load draft email.');
      })
      .finally(() => {
        setLoadingInitial(false);
      });
  }, [draftId]);

  // Apply initialTemplateId if passed via query string
  useEffect(() => {
    if (!initialTemplateId || draftId) return;
    communicationService
      .getTemplateById(initialTemplateId)
      .then((tpl) => {
        setSubject(tpl.subject);
        setBody(tpl.bodyHtml);
      })
      .catch(() => {});
  }, [initialTemplateId, draftId]);

  const addEmailChip = (
    rawInput: string,
    currentList: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    inputSetter: React.Dispatch<React.SetStateAction<string>>,
  ) => {
    const parts = rawInput
      .split(/[,;\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length === 0) return;
    const merged = Array.from(new Set([...currentList, ...parts]));
    setter(merged);
    inputSetter('');
  };

  const handleApplyTemplate = async (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (!templateId) return;
    try {
      const rendered = await communicationService.renderTemplate(templateId, {
        contactId: contactId || undefined,
        leadId: leadId || undefined,
        dealId: dealId || undefined,
      });
      setSubject(rendered.subject);
      setBody(rendered.bodyHtml);
      setSuccess(`Applied template "${rendered.templateName}".`);
    } catch {
      const fallback = templates.find((t) => t.id === templateId);
      if (fallback) {
        setSubject(fallback.subject);
        setBody(fallback.bodyHtml);
      }
    }
  };

  const handleSelectContact = (newContactId: string) => {
    setContactId(newContactId);
    const found = contacts.find((c) => c.id === newContactId);
    if (found?.email && !recipients.includes(found.email)) {
      setRecipients((prev) => [...prev, found.email!]);
    }
  };

  const handleSelectLead = (newLeadId: string) => {
    setLeadId(newLeadId);
    const found = leads.find((l) => l.id === newLeadId);
    if (found?.email && !recipients.includes(found.email)) {
      setRecipients((prev) => [...prev, found.email!]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const added: EmailAttachmentItem[] = Array.from(files).map((f) => ({
      filename: f.name,
      contentType: f.type || 'application/octet-stream',
      size: f.size,
    }));
    setAttachments((prev) => [...prev, ...added]);
    e.target.value = '';
  };

  const handleAddManualAttachment = () => {
    if (!customFilename.trim()) return;
    setAttachments((prev) => [
      ...prev,
      {
        filename: customFilename.trim(),
        contentType: 'application/pdf',
        size: 1024 * 120,
      },
    ]);
    setCustomFilename('');
  };

  const handleInsertToken = (token: string) => {
    setBody((prev) => `${prev}${prev ? ' ' : ''}${token}`);
  };

  const buildFinalRecipients = (): string[] => {
    const pending = recipientInput
      .split(/[,;\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    return Array.from(new Set([...recipients, ...pending]));
  };

  const buildFinalCc = (): string[] => {
    const pending = ccInput
      .split(/[,;\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    return Array.from(new Set([...ccList, ...pending]));
  };

  const buildFinalBcc = (): string[] => {
    const pending = bccInput
      .split(/[,;\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    return Array.from(new Set([...bccList, ...pending]));
  };

  const handleDispatchOrDraft = async (asDraft: boolean) => {
    setError(null);
    setSuccess(null);

    const finalTo = buildFinalRecipients();
    const finalCc = buildFinalCc();
    const finalBcc = buildFinalBcc();

    if (finalTo.length === 0) {
      setError('Please add at least one recipient email address.');
      return;
    }
    if (!subject.trim()) {
      setError('Please enter an email subject line.');
      return;
    }
    if (!body.trim()) {
      setError('Please enter an email message body.');
      return;
    }

    if (asDraft) {
      setSavingDraft(true);
    } else {
      setSubmitting(true);
    }

    try {
      const created = await communicationService.composeEmail({
        recipients: finalTo,
        cc: finalCc,
        bcc: finalBcc,
        subject: subject.trim(),
        body: body.trim(),
        bodyText: stripHtmlToText(body),
        contactId: contactId || undefined,
        leadId: leadId || undefined,
        dealId: dealId || undefined,
        templateId: selectedTemplateId || undefined,
        isDraft: asDraft,
        attachments: attachments.length > 0 ? attachments : undefined,
      });

      if (asDraft) {
        setSuccess('Draft saved to Drafts folder.');
      } else {
        navigate(`/communications/emails/${created.id}`, {
          state: { flash: 'Email dispatched and logged to CRM communications.' },
        });
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to process email.');
    } finally {
      setSubmitting(false);
      setSavingDraft(false);
    }
  };

  return (
    <CommunicationsLayout
      title={draftId ? 'Edit Draft Email' : 'Compose Email'}
      subtitle="Draft, personalize with templates, attach files, link CRM records, and dispatch emails via workspace provider."
      error={error}
      success={success}
      onDismissError={() => setError(null)}
      onDismissSuccess={() => setSuccess(null)}
      actions={
        <div className="lg-badge-row">
          <Link
            to="/communications/emails"
            className="auth-btn btn-secondary btn-size-small"
          >
            <ArrowLeftIcon size={15} /> Back to Emails
          </Link>
        </div>
      }
    >
      {loadingInitial ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-500">
          Loading draft email...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Main Compose Form */}
          <div className="space-y-6 lg:col-span-8">
            <SectionCard
              title="Recipient, Subject & Message Editor"
              subtitle="Add one or more recipients, apply a template, and compose your message"
            >
              <div className="space-y-4">
                {/* To Recipients */}
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-700">
                      To Recipients <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowCcBcc((prev) => !prev)}
                      className="text-xs font-medium text-blue-600 hover:underline"
                    >
                      {showCcBcc ? 'Hide CC / BCC' : '+ Add CC / BCC'}
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-gray-300 bg-white p-2 focus-within:border-blue-500">
                    {recipients.map((email) => (
                      <span
                        key={email}
                        className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-800"
                      >
                        {email}
                        <button
                          type="button"
                          onClick={() =>
                            setRecipients((prev) =>
                              prev.filter((item) => item !== email),
                            )
                          }
                          className="text-blue-500 hover:text-blue-900"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <input
                      type="email"
                      value={recipientInput}
                      onChange={(e) => setRecipientInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault();
                          addEmailChip(
                            recipientInput,
                            recipients,
                            setRecipients,
                            setRecipientInput,
                          );
                        }
                      }}
                      onBlur={() =>
                        addEmailChip(
                          recipientInput,
                          recipients,
                          setRecipients,
                          setRecipientInput,
                        )
                      }
                      placeholder="Type recipient email and press Enter..."
                      className="min-w-[220px] flex-1 border-none bg-transparent text-xs text-gray-900 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Optional CC & BCC */}
                {showCcBcc && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700">
                        CC
                      </label>
                      <div className="flex flex-wrap items-center gap-1 rounded-lg border border-gray-300 bg-white p-2">
                        {ccList.map((email) => (
                          <span
                            key={email}
                            className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-800"
                          >
                            {email}
                            <button
                              type="button"
                              onClick={() =>
                                setCcList((prev) =>
                                  prev.filter((i) => i !== email),
                                )
                              }
                            >
                              ×
                            </button>
                          </span>
                        ))}
                        <input
                          type="email"
                          value={ccInput}
                          onChange={(e) => setCcInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ',') {
                              e.preventDefault();
                              addEmailChip(
                                ccInput,
                                ccList,
                                setCcList,
                                setCcInput,
                              );
                            }
                          }}
                          onBlur={() =>
                            addEmailChip(ccInput, ccList, setCcList, setCcInput)
                          }
                          placeholder="Add CC email..."
                          className="min-w-[140px] flex-1 border-none bg-transparent text-xs focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700">
                        BCC
                      </label>
                      <div className="flex flex-wrap items-center gap-1 rounded-lg border border-gray-300 bg-white p-2">
                        {bccList.map((email) => (
                          <span
                            key={email}
                            className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-800"
                          >
                            {email}
                            <button
                              type="button"
                              onClick={() =>
                                setBccList((prev) =>
                                  prev.filter((i) => i !== email),
                                )
                              }
                            >
                              ×
                            </button>
                          </span>
                        ))}
                        <input
                          type="email"
                          value={bccInput}
                          onChange={(e) => setBccInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ',') {
                              e.preventDefault();
                              addEmailChip(
                                bccInput,
                                bccList,
                                setBccList,
                                setBccInput,
                              );
                            }
                          }}
                          onBlur={() =>
                            addEmailChip(
                              bccInput,
                              bccList,
                              setBccList,
                              setBccInput,
                            )
                          }
                          placeholder="Add BCC email..."
                          className="min-w-[140px] flex-1 border-none bg-transparent text-xs focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Subject */}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">
                    Subject Line <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g., Proposal & Next Steps for Enterprise Rollout"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* Dynamic Token Toolbar & Message Editor */}
                <div>
                  <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                    <label className="text-xs font-semibold text-gray-700">
                      Message Editor <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="text-[11px] text-gray-500">
                        Insert token:
                      </span>
                      {DEFAULT_TEMPLATE_TOKENS.slice(0, 5).map((item) => (
                        <button
                          key={item.token}
                          type="button"
                          onClick={() => handleInsertToken(item.token)}
                          className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    rows={12}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Write your email message here (supports text, HTML markup, and {{variable}} tokens)..."
                    className="w-full rounded-lg border border-gray-300 bg-white p-3 text-xs leading-relaxed text-gray-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* Attachments Section */}
                <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-800">
                      <MailIcon size={14} />
                      <span>Attachments ({attachments.length})</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <label className="cursor-pointer rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50">
                        + Attach Local File
                        <input
                          type="file"
                          multiple
                          onChange={handleFileInputChange}
                          className="hidden"
                        />
                      </label>

                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={customFilename}
                          onChange={(e) => setCustomFilename(e.target.value)}
                          placeholder="or filename (e.g. quote.pdf)"
                          className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleAddManualAttachment}
                          className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          <PlusIcon size={12} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {attachments.length > 0 && (
                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {attachments.map((att, idx) => (
                        <div
                          key={`${att.filename}-${idx}`}
                          className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-gray-800">
                              {att.filename}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              {att.contentType || 'Document'} ·{' '}
                              {formatBytes(att.size)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setAttachments((prev) =>
                                prev.filter((_, i) => i !== idx),
                              )
                            }
                            className="text-red-500 hover:text-red-700"
                            title="Remove attachment"
                          >
                            <TrashIcon size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Footer */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                  <button
                    type="button"
                    disabled={savingDraft || submitting}
                    onClick={() => handleDispatchOrDraft(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <CheckIcon size={14} />
                    {savingDraft ? 'Saving Draft...' : 'Save as Draft'}
                  </button>

                  <div className="flex items-center gap-2">
                    <Link
                      to="/communications/emails"
                      className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </Link>
                    <button
                      type="button"
                      disabled={submitting || savingDraft}
                      onClick={() => handleDispatchOrDraft(false)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      <SendIcon size={14} />
                      {submitting ? 'Sending Email...' : 'Send Email'}
                    </button>
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>

          {/* Right Sidebar: Template Selector & CRM Record Linking */}
          <div className="space-y-6 lg:col-span-4">
            <SectionCard
              title="Use Email Template"
              subtitle="Populate subject and message body from reusable templates"
            >
              <div className="space-y-3">
                <select
                  value={selectedTemplateId}
                  onChange={(e) => handleApplyTemplate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-800 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">— Select a Template —</option>
                  {templates.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      [{tpl.category}] {tpl.name}
                    </option>
                  ))}
                </select>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">
                    {templates.length} available templates
                  </span>
                  <Link
                    to="/communications/templates"
                    className="font-medium text-blue-600 hover:underline"
                  >
                    Manage Templates →
                  </Link>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Link CRM Records"
              subtitle="Associate this email with a Contact, Lead, or Deal for automatic timeline logging"
            >
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    Contact (auto-adds email to To)
                  </label>
                  <select
                    value={contactId}
                    onChange={(e) => handleSelectContact(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-800 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">No Contact Linked</option>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {`${c.firstName || ''} ${c.lastName || ''}`.trim()}{' '}
                        {c.email ? `(${c.email})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    Lead (auto-adds email to To)
                  </label>
                  <select
                    value={leadId}
                    onChange={(e) => handleSelectLead(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-800 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">No Lead Linked</option>
                    {leads.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.title} {l.email ? `(${l.email})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    Related Deal
                  </label>
                  <select
                    value={dealId}
                    onChange={(e) => setDealId(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-800 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">No Deal Linked</option>
                    {deals.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.title}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedTemplateId && (contactId || leadId || dealId) && (
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate(selectedTemplateId)}
                    className="w-full rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                  >
                    Re-interpolate Template with Linked Record
                  </button>
                )}
              </div>
            </SectionCard>

            <SectionCard
              title="Delivery Note"
              subtitle="Handled securely by the backend provider"
            >
              <div className="space-y-2 text-xs text-gray-600">
                <Badge tone="blue">Server-Side Delivery</Badge>
                <p>
                  Email dispatch, provider selection, open/click tracking, and
                  CRM activity logging are executed automatically by the backend
                  Communications service.
                </p>
              </div>
            </SectionCard>
          </div>
        </div>
      )}
    </CommunicationsLayout>
  );
};

export default ComposeEmailPage;
