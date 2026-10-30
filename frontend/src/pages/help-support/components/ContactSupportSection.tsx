import React, { useState } from 'react';
import type {
  CreateSupportTicketPayload,
  SupportTicket,
  TicketCategory,
  TicketPriority,
} from '../../../types/help-support.types';
import {
  TICKET_CATEGORY_OPTIONS,
  TICKET_PRIORITY_OPTIONS,
  TICKET_STATUS_OPTIONS,
} from '../helpSupportConstants';
import { LifeBuoyIcon, MessageSquareIcon } from '../helpIcons';
import {
  CheckCircleIcon,
  ClockIcon,
  SendIcon,
  XIcon,
} from '../../../components/common/Icons';

interface ContactSupportSectionProps {
  tickets: SupportTicket[];
  isLoadingTickets: boolean;
  onSubmitTicket: (payload: CreateSupportTicketPayload) => Promise<boolean>;
  onSendReply: (ticketId: string, message: string) => Promise<boolean>;
}

export const ContactSupportSection: React.FC<ContactSupportSectionProps> = ({
  tickets,
  isLoadingTickets,
  onSubmitTicket,
  onSendReply,
}) => {
  // Form State
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<TicketCategory>('TECHNICAL');
  const [priority, setPriority] = useState<TicketPriority>('MEDIUM');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Active Ticket Thread Modal
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(
    null,
  );
  const [replyMessage, setReplyMessage] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      setFormError('Please enter a ticket subject.');
      return;
    }
    if (!description.trim()) {
      setFormError('Please provide a detailed description of your issue.');
      return;
    }

    setFormError(null);
    setIsSubmitting(true);
    try {
      const ok = await onSubmitTicket({
        subject: subject.trim(),
        category,
        priority,
        description: description.trim(),
      });

      if (ok) {
        setSubject('');
        setDescription('');
        setCategory('TECHNICAL');
        setPriority('MEDIUM');
        setFormSuccess('Support ticket created successfully. Our team will review it shortly.');
        setTimeout(() => setFormSuccess(null), 5000);
      }
    } catch {
      setFormError('Failed to submit support ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;
    setIsSendingReply(true);
    try {
      const ok = await onSendReply(selectedTicket.id, replyMessage.trim());
      if (ok) {
        // Optimistically add message
        const newMsg = {
          id: `msg-${Date.now()}`,
          ticketId: selectedTicket.id,
          senderId: 'current-user',
          senderName: 'You',
          message: replyMessage.trim(),
          isInternal: false,
          createdAt: new Date().toISOString(),
        };
        setSelectedTicket((prev) =>
          prev
            ? {
                ...prev,
                messages: [...(prev.messages || []), newMsg],
              }
            : null,
        );
        setReplyMessage('');
      }
    } catch {
      // Handle error
    } finally {
      setIsSendingReply(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Support Ticket Submission Form */}
      <div className="lg:col-span-7 rounded-2xl border border-gray-200 bg-white p-6 sm:p-7 shadow-sm space-y-6">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-purple-700">
            <LifeBuoyIcon size={14} />
            <span>Submit a Ticket</span>
          </span>
          <h3 className="text-xl font-bold text-gray-900 mt-1">
            Need Help from Our Team?
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Fill out the form below and our technical engineers will investigate your request.
          </p>
        </div>

        {formSuccess && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 flex items-center gap-2">
            <CheckCircleIcon size={16} className="text-emerald-600 shrink-0" />
            <span>{formSuccess}</span>
          </div>
        )}

        {formError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          {/* Subject */}
          <div>
            <label
              htmlFor="ticket-subject"
              className="block text-xs font-bold uppercase text-gray-600 mb-1"
            >
              Ticket Subject <span className="text-rose-500">*</span>
            </label>
            <input
              id="ticket-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Cannot connect IMAP inbox or export deals"
              required
              className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          {/* Category & Priority Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="ticket-category"
                className="block text-xs font-bold uppercase text-gray-600 mb-1"
              >
                Category
              </label>
              <select
                id="ticket-category"
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as TicketCategory)
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-800 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                {TICKET_CATEGORY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="ticket-priority"
                className="block text-xs font-bold uppercase text-gray-600 mb-1"
              >
                Urgency / Priority
              </label>
              <select
                id="ticket-priority"
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as TicketPriority)
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-800 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                {TICKET_PRIORITY_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="ticket-description"
              className="block text-xs font-bold uppercase text-gray-600 mb-1"
            >
              Detailed Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="ticket-description"
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue, steps to reproduce, or any relevant details..."
              required
              className="w-full rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 leading-relaxed"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-purple-700 disabled:opacity-50 transition"
            >
              <SendIcon size={15} />
              <span>{isSubmitting ? 'Submitting Ticket...' : 'Submit Support Ticket'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Your Submitted Tickets Sidebar */}
      <div className="lg:col-span-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <MessageSquareIcon size={16} className="text-purple-600" />
            <span>Your Support Tickets</span>
          </h3>
          <span className="text-xs text-gray-400">
            {tickets.length} {tickets.length === 1 ? 'ticket' : 'tickets'}
          </span>
        </div>

        {isLoadingTickets ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="h-4 w-28 bg-gray-200 rounded mb-2" />
                <div className="h-5 w-full bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-400 mb-2">
              <LifeBuoyIcon size={20} />
            </div>
            <h4 className="text-sm font-semibold text-gray-800">
              No Active Tickets
            </h4>
            <p className="mt-1 text-xs text-gray-500">
              You haven't submitted any support tickets yet.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
            {tickets.map((t) => {
              const statusMeta =
                TICKET_STATUS_OPTIONS[t.status] || TICKET_STATUS_OPTIONS.OPEN;
              const priorityMeta =
                TICKET_PRIORITY_OPTIONS.find((p) => p.value === t.priority) ||
                TICKET_PRIORITY_OPTIONS[1];

              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicket(t)}
                  className="cursor-pointer rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-purple-300 hover:shadow-md"
                >
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
                    <span className="font-mono font-semibold text-purple-700">
                      {t.ticketNumber || `TICK-${t.id.slice(0, 6)}`}
                    </span>
                    <span className="flex items-center gap-1">
                      <ClockIcon size={12} />
                      <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                    </span>
                  </div>

                  <h4 className="font-bold text-gray-900 text-sm truncate">
                    {t.subject}
                  </h4>

                  <div className="mt-2.5 flex items-center justify-between text-xs">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusMeta.badgeClass}`}
                    >
                      {statusMeta.label}
                    </span>
                    <span
                      className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium ${priorityMeta.badgeClass}`}
                    >
                      {priorityMeta.label} Priority
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Ticket Details & Thread Modal */}
      {selectedTicket && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4 bg-gray-50">
              <div>
                <span className="font-mono text-xs font-bold text-purple-700">
                  {selectedTicket.ticketNumber || `TICK-${selectedTicket.id.slice(0, 6)}`}
                </span>
                <h3 className="text-base font-bold text-gray-900 mt-1">
                  {selectedTicket.subject}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <XIcon size={18} />
              </button>
            </div>

            {/* Conversation Thread */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
              {/* Original Ticket Description */}
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-gray-500 font-semibold">
                  <span>Initial Request Details</span>
                  <span>{new Date(selectedTicket.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-gray-800 leading-relaxed whitespace-pre-line">
                  {selectedTicket.description}
                </p>
              </div>

              {/* Messages Thread */}
              {selectedTicket.messages && selectedTicket.messages.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Discussion Thread
                  </h4>
                  {selectedTicket.messages.map((m) => (
                    <div
                      key={m.id}
                      className={`rounded-xl p-3.5 ${
                        m.senderName === 'You' || m.senderId === 'current-user'
                          ? 'ml-6 bg-purple-50 text-purple-900 border border-purple-200'
                          : 'mr-6 bg-white text-gray-800 border border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-semibold mb-1 opacity-75">
                        <span>{m.senderName}</span>
                        <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="leading-relaxed whitespace-pre-line">{m.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reply Input Box */}
            <div className="border-t border-gray-200 p-4 bg-gray-50 flex items-center gap-2">
              <input
                type="text"
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleReply();
                }}
                placeholder="Type your reply message to support..."
                className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => void handleReply()}
                disabled={isSendingReply || !replyMessage.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700 disabled:opacity-50"
              >
                <SendIcon size={13} />
                <span>{isSendingReply ? 'Sending...' : 'Reply'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

