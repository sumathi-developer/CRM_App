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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Feedback Submission Form */}
      <div className="lg:col-span-7 rounded-2xl border border-gray-200 bg-white p-6 sm:p-7 shadow-sm space-y-6">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-purple-700">
            <MessageSquareIcon size={14} />
            <span>Product Feedback & Ideas</span>
          </span>
          <h3 className="text-xl font-bold text-gray-900 mt-1">
            Help Us Shape the CRM Platform
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Have a suggestion, noticed a glitch, or want to request a new feature? We want to hear from you.
          </p>
        </div>

        {successMsg && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 flex items-center gap-2">
            <CheckCircleIcon size={16} className="text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 text-sm">
          {/* Star Rating Picker */}
          <div>
            <label className="block text-xs font-bold uppercase text-gray-600 mb-1.5">
              Overall Experience Rating
            </label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = (hoverRating || rating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 text-amber-400 hover:scale-110 transition focus:outline-none"
                    aria-label={`${star} star`}
                  >
                    <StarIcon size={24} filled={isFilled} />
                  </button>
                );
              })}
              <span className="ml-3 text-xs font-semibold text-gray-600">
                {getRatingLabel(hoverRating || rating)}
              </span>
            </div>
          </div>

          {/* Feedback Type Selector */}
          <div>
            <label className="block text-xs font-bold uppercase text-gray-600 mb-2">
              What type of feedback is this?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {FEEDBACK_TYPE_OPTIONS.map((opt) => {
                const isSelected = type === opt.value;
                return (
                  <div
                    key={opt.value}
                    onClick={() => setType(opt.value)}
                    className={`cursor-pointer rounded-xl border p-3 text-xs transition ${
                      isSelected
                        ? 'border-purple-600 bg-purple-50/70 font-semibold text-purple-900 ring-1 ring-purple-600'
                        : 'border-gray-200 hover:border-purple-300 text-gray-700'
                    }`}
                  >
                    <div className="font-bold">{opt.label}</div>
                    <div className="text-[11px] text-gray-500 font-normal mt-0.5">
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
              className="block text-xs font-bold uppercase text-gray-600 mb-1"
            >
              Related Module
            </label>
            <select
              id="feedback-module"
              value={module}
              onChange={(e) => setModule(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-800 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
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
              className="block text-xs font-bold uppercase text-gray-600 mb-1"
            >
              Your Feedback or Suggestion <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="feedback-description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What can we do better? Be as specific as you like..."
              required
              className="w-full rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 leading-relaxed"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-purple-700 disabled:opacity-50 transition"
            >
              <SendIcon size={15} />
              <span>{isSubmitting ? 'Submitting...' : 'Submit Feedback'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Your Submitted Feedback History */}
      <div className="lg:col-span-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <MessageSquareIcon size={16} className="text-purple-600" />
            <span>Your Submitted Feedback</span>
          </h3>
          <span className="text-xs text-gray-400">
            {feedbacks.length} {feedbacks.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>

        {isLoadingFeedbacks ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="h-4 w-28 bg-gray-200 rounded mb-2" />
                <div className="h-4 w-full bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-400 mb-2">
              <MessageSquareIcon size={20} />
            </div>
            <h4 className="text-sm font-semibold text-gray-800">
              No Feedback Submitted
            </h4>
            <p className="mt-1 text-xs text-gray-500">
              You haven't submitted any product ideas or feedback yet.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
            {feedbacks.map((f) => {
              return (
                <div
                  key={f.id}
                  className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-2"
                >
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="rounded bg-purple-50 text-purple-700 px-2 py-0.5 font-bold text-[10px] uppercase border border-purple-200">
                      {f.type.replace('_', ' ')}
                    </span>
                    <span className="flex items-center gap-1 text-[11px]">
                      <ClockIcon size={12} />
                      <span>{new Date(f.createdAt).toLocaleDateString()}</span>
                    </span>
                  </div>

                  <p className="text-xs text-gray-800 leading-relaxed line-clamp-3">
                    {f.description}
                  </p>

                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-gray-100 text-gray-500">
                    <span>
                      Module: <strong className="text-gray-700">{f.module || 'General'}</strong>
                    </span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-700 font-semibold">
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
  );
};

