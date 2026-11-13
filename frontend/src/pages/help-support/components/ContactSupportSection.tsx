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

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'RESOLVED':
      case 'CLOSED':
        return {
          backgroundColor: '#F1F5F9',
          color: '#64748B',
          border: '1px solid #CBD5E1',
        };
      case 'IN_PROGRESS':
        return {
          backgroundColor: '#EFF6FF',
          color: '#2563EB',
          border: '1px solid rgba(59, 130, 246, 0.3)',
        };
      case 'WAITING_ON_CUSTOMER':
        return {
          backgroundColor: '#FEF3C7',
          color: '#D97706',
          border: '1px solid rgba(245, 158, 11, 0.3)',
        };
      case 'OPEN':
      default:
        return {
          backgroundColor: '#EAF4ED',
          color: '#10B981',
          border: '1px solid rgba(16, 185, 129, 0.3)',
        };
    }
  };

  const getPriorityBadgeStyle = (p: string) => {
    switch (p) {
      case 'URGENT':
      case 'HIGH':
        return {
          backgroundColor: '#FEF2F2',
          color: '#DC2626',
          border: '1px solid rgba(239, 68, 68, 0.3)',
        };
      case 'MEDIUM':
        return {
          backgroundColor: '#EFF6FF',
          color: '#2563EB',
          border: '1px solid rgba(59, 130, 246, 0.3)',
        };
      case 'LOW':
      default:
        return {
          backgroundColor: '#F8FCF9',
          color: '#64748B',
          border: '1px solid rgba(16, 185, 129, 0.2)',
        };
    }
  };

  return (
    <div>
      <style>{`
        .contact-support-grid {
          display: grid;
          grid-template-columns: 1.3fr 1fr;
          gap: 24px;
          align-items: start;
        }
        @media (max-width: 960px) {
          .contact-support-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="contact-support-grid">
        {/* Support Ticket Submission Form Card */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid rgba(16, 185, 129, 0.22)',
            borderRadius: '16px',
            padding: '24px 28px',
            boxShadow: '0 1px 3px rgba(6, 46, 3, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          <div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#EAF4ED',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#10B981',
                padding: '3px 10px',
                borderRadius: '9999px',
                fontSize: '11.5px',
                fontWeight: 600,
                marginBottom: '8px',
              }}
            >
              <LifeBuoyIcon size={13} />
              <span>Submit a Ticket</span>
            </span>
            <h3
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: '#062E03',
                margin: '0 0 4px',
              }}
            >
              Need Help from Our Team?
            </h3>
            <p
              style={{
                fontSize: '13px',
                color: '#64748B',
                margin: 0,
                lineHeight: 1.45,
              }}
            >
              Fill out the form below and our technical engineers will investigate your request.
            </p>
          </div>

          {formSuccess && (
            <div
              style={{
                borderRadius: '10px',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                backgroundColor: '#EAF4ED',
                padding: '12px 16px',
                fontSize: '13px',
                fontWeight: 500,
                color: '#062E03',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <CheckCircleIcon size={16} style={{ color: '#10B981', flexShrink: 0 }} />
              <span>{formSuccess}</span>
            </div>
          )}

          {formError && (
            <div
              style={{
                borderRadius: '10px',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                backgroundColor: '#FEF2F2',
                padding: '12px 16px',
                fontSize: '13px',
                fontWeight: 500,
                color: '#DC2626',
              }}
            >
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Subject */}
            <div>
              <label
                htmlFor="ticket-subject"
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#062E03',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Ticket Subject <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                id="ticket-subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Cannot connect IMAP inbox or export deals"
                required
                style={{
                  width: '100%',
                  backgroundColor: '#F8FCF9',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  fontSize: '13.5px',
                  color: '#062E03',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'all 0.15s ease',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#10B981';
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.15)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)';
                  e.currentTarget.style.backgroundColor = '#F8FCF9';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Category & Priority Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
              <div>
                <label
                  htmlFor="ticket-category"
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#062E03',
                    marginBottom: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Category
                </label>
                <select
                  id="ticket-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TicketCategory)}
                  style={{
                    width: '100%',
                    backgroundColor: '#F8FCF9',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '8px',
                    padding: '9px 12px',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#062E03',
                    outline: 'none',
                    cursor: 'pointer',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#10B981';
                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)';
                    e.currentTarget.style.backgroundColor = '#F8FCF9';
                  }}
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
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#062E03',
                    marginBottom: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Urgency / Priority
                </label>
                <select
                  id="ticket-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TicketPriority)}
                  style={{
                    width: '100%',
                    backgroundColor: '#F8FCF9',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '8px',
                    padding: '9px 12px',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#062E03',
                    outline: 'none',
                    cursor: 'pointer',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#10B981';
                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)';
                    e.currentTarget.style.backgroundColor = '#F8FCF9';
                  }}
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
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#062E03',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Detailed Description <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <textarea
                id="ticket-description"
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue, steps to reproduce, or any relevant details..."
                required
                style={{
                  width: '100%',
                  backgroundColor: '#F8FCF9',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  fontSize: '13.5px',
                  color: '#062E03',
                  outline: 'none',
                  boxSizing: 'border-box',
                  lineHeight: 1.5,
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  transition: 'all 0.15s ease',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#10B981';
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.15)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)';
                  e.currentTarget.style.backgroundColor = '#F8FCF9';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Submit Button */}
            <div style={{ paddingTop: '6px' }}>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  backgroundColor: '#10B981',
                  color: '#FFFFFF',
                  border: '1px solid #10B981',
                  borderRadius: '8px',
                  padding: '10px 22px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.75 : 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.backgroundColor = '#059669';
                    e.currentTarget.style.borderColor = '#059669';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.backgroundColor = '#10B981';
                    e.currentTarget.style.borderColor = '#10B981';
                  }
                }}
              >
                <SendIcon size={14} />
                <span>{isSubmitting ? 'Submitting Ticket...' : 'Submit Support Ticket'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Your Submitted Tickets Sidebar Card */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid rgba(16, 185, 129, 0.22)',
            borderRadius: '16px',
            padding: '24px 28px',
            boxShadow: '0 1px 3px rgba(6, 46, 3, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3
              style={{
                fontSize: '16px',
                fontWeight: 700,
                color: '#062E03',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  backgroundColor: '#EAF4ED',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  color: '#10B981',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MessageSquareIcon size={15} />
              </span>
              <span>Your Support Tickets</span>
            </h3>
            <span
              style={{
                fontSize: '11.5px',
                fontWeight: 600,
                color: '#10B981',
                backgroundColor: '#EAF4ED',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '9999px',
                padding: '2px 9px',
              }}
            >
              {tickets.length} {tickets.length === 1 ? 'ticket' : 'tickets'}
            </span>
          </div>

          {isLoadingTickets ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    borderRadius: '12px',
                    border: '1px solid rgba(16, 185, 129, 0.18)',
                    backgroundColor: '#FFFFFF',
                    padding: '16px',
                  }}
                >
                  <div style={{ height: '14px', width: '35%', backgroundColor: '#F1F5F9', borderRadius: '4px', marginBottom: '8px' }} />
                  <div style={{ height: '16px', width: '80%', backgroundColor: '#F8FCF9', borderRadius: '4px' }} />
                </div>
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <div
              style={{
                borderRadius: '12px',
                border: '1px dashed rgba(16, 185, 129, 0.25)',
                backgroundColor: '#F8FCF9',
                padding: '36px 20px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  backgroundColor: '#EAF4ED',
                  color: '#10B981',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '10px',
                }}
              >
                <LifeBuoyIcon size={20} />
              </div>
              <h4 style={{ fontSize: '14.5px', fontWeight: 600, color: '#062E03', margin: '0 0 4px' }}>
                No Active Tickets
              </h4>
              <p style={{ fontSize: '12.5px', color: '#64748B', margin: 0 }}>
                You haven't submitted any support tickets yet.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '560px', overflowY: 'auto', paddingRight: '2px' }}>
              {tickets.map((t) => {
                const statusMeta =
                  TICKET_STATUS_OPTIONS[t.status] || TICKET_STATUS_OPTIONS.OPEN;
                const priorityMeta =
                  TICKET_PRIORITY_OPTIONS.find((p) => p.value === t.priority) ||
                  TICKET_PRIORITY_OPTIONS[1];

                const statusStyle = getStatusBadgeStyle(t.status);
                const priorityStyle = getPriorityBadgeStyle(t.priority);

                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    style={{
                      cursor: 'pointer',
                      borderRadius: '12px',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      backgroundColor: '#FFFFFF',
                      padding: '14px 16px',
                      boxShadow: '0 1px 3px rgba(6, 46, 3, 0.04)',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#10B981';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.2)';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(6, 46, 3, 0.04)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#64748B', marginBottom: '6px' }}>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          color: '#10B981',
                          backgroundColor: '#EAF4ED',
                          border: '1px solid rgba(16, 185, 129, 0.25)',
                          borderRadius: '4px',
                          padding: '1px 6px',
                          fontSize: '11px',
                        }}
                      >
                        {t.ticketNumber || `TIK-${t.id.slice(0, 6)}`}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11.5px' }}>
                        <ClockIcon size={12} />
                        <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                      </span>
                    </div>

                    <h4
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#062E03',
                        margin: '0 0 10px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {t.subject}
                    </h4>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          borderRadius: '9999px',
                          padding: '2px 8px',
                          fontSize: '11px',
                          fontWeight: 600,
                          ...statusStyle,
                        }}
                      >
                        {statusMeta.label}
                      </span>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          borderRadius: '6px',
                          padding: '2px 8px',
                          fontSize: '10.5px',
                          fontWeight: 600,
                          ...priorityStyle,
                        }}
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
      </div>

      {/* Ticket Details & Thread Modal */}
      {selectedTicket && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(6, 46, 3, 0.4)',
            padding: '1rem',
            backdropFilter: 'blur(4px)',
          }}
          role="dialog"
          aria-modal="true"
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '640px',
              borderRadius: '16px',
              backgroundColor: '#FFFFFF',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '90vh',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(16, 185, 129, 0.15)',
                padding: '16px 20px',
                backgroundColor: '#F8FCF9',
              }}
            >
              <div>
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    color: '#10B981',
                    backgroundColor: '#EAF4ED',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    borderRadius: '4px',
                    padding: '2px 6px',
                  }}
                >
                  {selectedTicket.ticketNumber || `TIK-${selectedTicket.id.slice(0, 6)}`}
                </span>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#062E03', margin: '6px 0 0' }}>
                  {selectedTicket.subject}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                style={{
                  borderRadius: '8px',
                  padding: '6px',
                  color: '#64748B',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                }}
              >
                <XIcon size={18} />
              </button>
            </div>

            {/* Conversation Thread */}
            <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Original Ticket Description */}
              <div
                style={{
                  borderRadius: '10px',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  backgroundColor: '#F8FCF9',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px', color: '#64748B', fontWeight: 600 }}>
                  <span>Initial Request Details</span>
                  <span>{new Date(selectedTicket.createdAt).toLocaleString()}</span>
                </div>
                <p style={{ fontSize: '13px', color: '#062E03', lineHeight: 1.5, whiteSpace: 'pre-line', margin: 0 }}>
                  {selectedTicket.description}
                </p>
              </div>

              {/* Messages Thread */}
              {selectedTicket.messages && selectedTicket.messages.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '8px' }}>
                  <h4 style={{ fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#062E03', margin: 0 }}>
                    Discussion Thread
                  </h4>
                  {selectedTicket.messages.map((m) => {
                    const isSelf = m.senderName === 'You' || m.senderId === 'current-user';
                    return (
                      <div
                        key={m.id}
                        style={{
                          borderRadius: '10px',
                          padding: '12px 14px',
                          marginLeft: isSelf ? '24px' : '0',
                          marginRight: isSelf ? '0' : '24px',
                          backgroundColor: isSelf ? '#EAF4ED' : '#F8FCF9',
                          border: isSelf ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(16, 185, 129, 0.18)',
                          color: '#062E03',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600, color: '#64748B', marginBottom: '4px' }}>
                          <span>{m.senderName}</span>
                          <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p style={{ fontSize: '13px', lineHeight: 1.45, whiteSpace: 'pre-line', margin: 0 }}>
                          {m.message}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Reply Input Box */}
            <div
              style={{
                borderTop: '1px solid rgba(16, 185, 129, 0.15)',
                padding: '14px 18px',
                backgroundColor: '#F8FCF9',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <input
                type="text"
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleReply();
                }}
                placeholder="Type your reply message to support..."
                style={{
                  flex: 1,
                  borderRadius: '8px',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  backgroundColor: '#FFFFFF',
                  padding: '9px 12px',
                  fontSize: '13px',
                  color: '#062E03',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => void handleReply()}
                disabled={isSendingReply || !replyMessage.trim()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderRadius: '8px',
                  backgroundColor: '#10B981',
                  padding: '9px 16px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  color: '#FFFFFF',
                  border: '1px solid #10B981',
                  cursor: isSendingReply || !replyMessage.trim() ? 'not-allowed' : 'pointer',
                  opacity: isSendingReply || !replyMessage.trim() ? 0.6 : 1,
                }}
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
