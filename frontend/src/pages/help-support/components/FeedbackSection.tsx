import React, { useState } from 'react';
import type {
  FeedbackType,
  SubmitFeedbackPayload,
  UserFeedback,
} from '../../../types/help-support.types';
import { FEEDBACK_TYPE_OPTIONS } from '../helpSupportConstants';
import { MessageSquareIcon, StarIcon } from '../helpIcons';
import {
  CheckCircleIcon,
  ClockIcon,
  SendIcon,
} from '../../../components/common/Icons';

interface FeedbackSectionProps {
  feedbacks: UserFeedback[];
  isLoadingFeedbacks: boolean;
  onSubmitFeedback: (payload: SubmitFeedbackPayload) => Promise<boolean>;
}

export const FeedbackSection: React.FC<FeedbackSectionProps> = ({
  feedbacks,
  isLoadingFeedbacks,
  onSubmitFeedback,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [type, setType] = useState<FeedbackType>('FEATURE_REQUEST');
  const [module, setModule] = useState('LEADS');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const getRatingLabel = (stars: number) => {
    switch (stars) {
      case 5:
        return '5 Stars - Outstanding & Loved It';
      case 4:
        return '4 Stars - Good Experience';
      case 3:
        return '3 Stars - Average, Has Room to Improve';
      case 2:
        return '2 Stars - Poor, Needs Attention';
      case 1:
        return '1 Star - Very Frustrating';
      default:
        return 'Select a rating';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMsg('Please enter your feedback description or suggestion.');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const ok = await onSubmitFeedback({
        type,
        rating,
        module,
        description: description.trim(),
        pageUrl: window.location.pathname,
      });

      if (ok) {
        setDescription('');
        setSuccessMsg(
          'Thank you for your valuable feedback! Our product team reviews all suggestions.',
        );
        setTimeout(() => setSuccessMsg(null), 5000);
      }
    } catch {
      setErrorMsg('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <style>{`
        .feedback-section-grid {
          display: grid;
          grid-template-columns: 1.3fr 1fr;
          gap: 24px;
          align-items: start;
        }
        @media (max-width: 960px) {
          .feedback-section-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="feedback-section-grid">
        {/* Feedback Submission Form Card */}
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
              <MessageSquareIcon size={13} />
              <span>Product Feedback & Ideas</span>
            </span>
            <h3
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: '#062E03',
                margin: '0 0 4px',
              }}
            >
              Help Us Shape the CRM Platform
            </h3>
            <p
              style={{
                fontSize: '13px',
                color: '#64748B',
                margin: 0,
                lineHeight: 1.45,
              }}
            >
              Have a suggestion, noticed a glitch, or want to request a new feature? We want to hear from you.
            </p>
          </div>

          {successMsg && (
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
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
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
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Star Rating Picker */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#062E03',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Overall Experience Rating
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled = (hoverRating || rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      style={{
                        padding: '2px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: isFilled ? '#F59E0B' : '#CBD5E1',
                        display: 'inline-flex',
                        transition: 'transform 0.1s ease',
                      }}
                      onMouseEnterCapture={(e) => {
                        e.currentTarget.style.transform = 'scale(1.15)';
                      }}
                      onMouseLeaveCapture={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                      aria-label={`${star} star`}
                    >
                      <StarIcon size={24} filled={isFilled} />
                    </button>
                  );
                })}
                <span style={{ marginLeft: '10px', fontSize: '12.5px', fontWeight: 600, color: '#062E03' }}>
                  {getRatingLabel(hoverRating || rating)}
                </span>
              </div>
            </div>

            {/* Feedback Type Selector */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#062E03',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                What type of feedback is this?
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                {FEEDBACK_TYPE_OPTIONS.map((opt) => {
                  const isSelected = type === opt.value;
                  return (
                    <div
                      key={opt.value}
                      onClick={() => setType(opt.value)}
                      style={{
                        cursor: 'pointer',
                        borderRadius: '10px',
                        border: isSelected
                          ? '1.5px solid #10B981'
                          : '1px solid rgba(16, 185, 129, 0.2)',
                        backgroundColor: isSelected ? '#F8FCF9' : '#FFFFFF',
                        padding: '12px 14px',
                        boxShadow: '0 1px 3px rgba(6, 46, 3, 0.03)',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = '#10B981';
                          e.currentTarget.style.backgroundColor = '#F8FCF9';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.2)';
                          e.currentTarget.style.backgroundColor = '#FFFFFF';
                        }
                      }}
                    >
                      <div style={{ fontSize: '13px', fontWeight: isSelected ? 700 : 600, color: '#062E03' }}>
                        {opt.label}
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px', lineHeight: 1.35 }}>
                        {opt.desc}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Target Module */}
            <div>
              <label
                htmlFor="feedback-module"
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
                Related Module
              </label>
              <select
                id="feedback-module"
                value={module}
                onChange={(e) => setModule(e.target.value)}
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
                <option value="GENERAL">General Platform Experience</option>
                <option value="LEADS">Leads & Lead Scoring</option>
                <option value="DEALS">Deals & Opportunities</option>
                <option value="PIPELINES">Sales Pipelines & Stages</option>
                <option value="CONTACTS">Contacts & Companies</option>
                <option value="ACTIVITIES">Activities & Calendar</option>
                <option value="COMMUNICATIONS">Email & Communications</option>
                <option value="ANALYTICS">Analytics & Dashboards</option>
                <option value="SETTINGS">Settings & Integrations</option>
              </select>
            </div>

            {/* Feedback Description */}
            <div>
              <label
                htmlFor="feedback-description"
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
                Your Feedback or Suggestion <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <textarea
                id="feedback-description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What can we do better? Be as specific as you like..."
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

            {/* Submit Action */}
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
                <span>{isSubmitting ? 'Submitting...' : 'Submit Feedback'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Your Submitted Feedback History Card */}
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
              <span>Your Submitted Feedback</span>
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
              {feedbacks.length} {feedbacks.length === 1 ? 'entry' : 'entries'}
            </span>
          </div>

          {isLoadingFeedbacks ? (
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
          ) : feedbacks.length === 0 ? (
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
                <MessageSquareIcon size={20} />
              </div>
              <h4 style={{ fontSize: '14.5px', fontWeight: 600, color: '#062E03', margin: '0 0 4px' }}>
                No Feedback Submitted
              </h4>
              <p style={{ fontSize: '12.5px', color: '#64748B', margin: 0 }}>
                You haven't submitted any product ideas or feedback yet.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '560px', overflowY: 'auto', paddingRight: '2px' }}>
              {feedbacks.map((f) => {
                return (
                  <div
                    key={f.id}
                    style={{
                      borderRadius: '12px',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      backgroundColor: '#FFFFFF',
                      padding: '14px 16px',
                      boxShadow: '0 1px 3px rgba(6, 46, 3, 0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#64748B' }}>
                      <span
                        style={{
                          backgroundColor: '#EAF4ED',
                          color: '#10B981',
                          border: '1px solid rgba(16, 185, 129, 0.25)',
                          borderRadius: '6px',
                          padding: '2px 8px',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                        }}
                      >
                        {f.type.replace(/_/g, ' ')}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11.5px' }}>
                        <ClockIcon size={12} />
                        <span>{new Date(f.createdAt).toLocaleDateString()}</span>
                      </span>
                    </div>

                    <p style={{ fontSize: '13px', color: '#062E03', lineHeight: 1.5, margin: 0 }}>
                      {f.description}
                    </p>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: '8px',
                        borderTop: '1px solid rgba(16, 185, 129, 0.12)',
                        fontSize: '11.5px',
                        color: '#64748B',
                      }}
                    >
                      <span>
                        Module: <strong style={{ color: '#062E03' }}>{f.module || 'General'}</strong>
                      </span>
                      <span
                        style={{
                          borderRadius: '9999px',
                          backgroundColor: '#F8FCF9',
                          border: '1px solid rgba(16, 185, 129, 0.25)',
                          padding: '2px 8px',
                          fontSize: '10.5px',
                          fontWeight: 600,
                          color: '#10B981',
                        }}
                      >
                        {f.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
