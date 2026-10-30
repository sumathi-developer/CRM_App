import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useWorkspace } from '../../context/useWorkspace';
import { helpSupportService } from '../../services/help-support.service';
import type {
  CreateSupportTicketPayload,
  DocCategory,
  DocPage,
  FaqItem,
  HelpArticle,
  HelpCategory,
  HelpScreenSlug,
  SubmitFeedbackPayload,
  SupportTicket,
  UserFeedback,
} from '../../types/help-support.types';
import { HelpLayout } from './components/HelpLayout';
import { HelpCenterSection } from './components/HelpCenterSection';
import { DocumentationSection } from './components/DocumentationSection';
import { FaqsSection } from './components/FaqsSection';
import { ContactSupportSection } from './components/ContactSupportSection';
import { FeedbackSection } from './components/FeedbackSection';

interface HelpSupportExplorerPageProps {
  screen: HelpScreenSlug;
}

export const HelpSupportExplorerPage: React.FC<HelpSupportExplorerPageProps> = ({
  screen,
}) => {
  const { currentWorkspace } = useWorkspace();
  const [searchParams, setSearchParams] = useSearchParams();

  // Common UI feedback state
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Search and Category Filter State
  const initialSearch = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  const [faqCategory, setFaqCategory] = useState<string>('ALL');

  // Help Center Data
  const [helpCategories, setHelpCategories] = useState<HelpCategory[]>([]);
  const [helpArticles, setHelpArticles] = useState<HelpArticle[]>([]);
  const [isLoadingHelp, setIsLoadingHelp] = useState(false);

  // Documentation Data
  const [docCategories, setDocCategories] = useState<DocCategory[]>([]);
  const [docPages, setDocPages] = useState<DocPage[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);

  // FAQs Data
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [isLoadingFaqs, setIsLoadingFaqs] = useState(false);

  // Support Tickets Data
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);

  // Feedback Data
  const [feedbacks, setFeedbacks] = useState<UserFeedback[]>([]);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);

  // =========================================================================
  // DATA LOADERS
  // =========================================================================

  // 1. Load Help Center
  const loadHelpCenter = useCallback(async () => {
    setIsLoadingHelp(true);
    try {
      const [cats, arts] = await Promise.all([
        helpSupportService.getHelpCategories(currentWorkspace?.id),
        helpSupportService.getHelpArticles({
          search: searchQuery || undefined,
          categoryId: selectedCategoryId,
        }),
      ]);
      setHelpCategories(cats);
      setHelpArticles(arts.data);
    } catch {
      // Handled inside service fallback
    } finally {
      setIsLoadingHelp(false);
    }
  }, [currentWorkspace?.id, searchQuery, selectedCategoryId]);

  // 2. Load Documentation
  const loadDocumentation = useCallback(async () => {
    setIsLoadingDocs(true);
    try {
      const [cats, pages] = await Promise.all([
        helpSupportService.getDocCategories(currentWorkspace?.id),
        helpSupportService.getDocPages({
          search: searchQuery || undefined,
          categoryId: selectedCategoryId,
        }),
      ]);
      setDocCategories(cats);
      setDocPages(pages.data);
    } catch {
      // Handled inside service fallback
    } finally {
      setIsLoadingDocs(false);
    }
  }, [currentWorkspace?.id, searchQuery, selectedCategoryId]);

  // 3. Load FAQs
  const loadFaqs = useCallback(async () => {
    setIsLoadingFaqs(true);
    try {
      const res = await helpSupportService.getFaqs({
        search: searchQuery || undefined,
        category: faqCategory,
      });
      setFaqs(res.data);
    } catch {
      // Handled inside service fallback
    } finally {
      setIsLoadingFaqs(false);
    }
  }, [searchQuery, faqCategory]);

  // 4. Load Support Tickets
  const loadTickets = useCallback(async () => {
    setIsLoadingTickets(true);
    try {
      const res = await helpSupportService.getTickets();
      setTickets(res.data);
    } catch {
      // Handled inside service
    } finally {
      setIsLoadingTickets(false);
    }
  }, []);

  // 5. Load Feedback History
  const loadFeedback = useCallback(async () => {
    setIsLoadingFeedback(true);
    try {
      const res = await helpSupportService.getFeedbackList();
      setFeedbacks(res.data);
    } catch {
      // Handled inside service
    } finally {
      setIsLoadingFeedback(false);
    }
  }, []);

  // Screen Switcher Effect
  useEffect(() => {
    setError(null);
    if (screen === 'center') {
      void loadHelpCenter();
    } else if (screen === 'documentation') {
      void loadDocumentation();
    } else if (screen === 'faqs') {
      void loadFaqs();
    } else if (screen === 'support') {
      void loadTickets();
    } else if (screen === 'feedback') {
      void loadFeedback();
    }
  }, [screen, loadHelpCenter, loadDocumentation, loadFaqs, loadTickets, loadFeedback]);

  // Handle Search Input Change
  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    const next = new URLSearchParams(searchParams);
    if (q.trim()) {
      next.set('q', q.trim());
    } else {
      next.delete('q');
    }
    setSearchParams(next);
  };

  // Article Vote Handler
  const handleVoteArticle = async (articleId: string, isHelpful: boolean) => {
    await helpSupportService.voteHelpArticle(articleId, isHelpful);
  };

  // Support Ticket Submission Handler
  const handleSubmitTicket = async (
    payload: CreateSupportTicketPayload,
  ): Promise<boolean> => {
    try {
      const created = await helpSupportService.createTicket({
        ...payload,
        workspaceId: currentWorkspace?.id,
      });
      setTickets((prev) => [created, ...prev]);
      setSuccess(`Support ticket ${created.ticketNumber || ''} created successfully.`);
      return true;
    } catch (err: any) {
      setError(err?.message || 'Could not submit support ticket.');
      return false;
    }
  };

  // Support Reply Handler
  const handleSendReply = async (
    ticketId: string,
    message: string,
  ): Promise<boolean> => {
    try {
      await helpSupportService.addTicketMessage(ticketId, message);
      return true;
    } catch {
      return false;
    }
  };

  // Feedback Submission Handler
  const handleSubmitFeedback = async (
    payload: SubmitFeedbackPayload,
  ): Promise<boolean> => {
    try {
      const fb = await helpSupportService.submitFeedback({
        ...payload,
        workspaceId: currentWorkspace?.id,
      });
      setFeedbacks((prev) => [fb, ...prev]);
      setSuccess('Feedback submitted successfully. Thank you!');
      return true;
    } catch (err: any) {
      setError(err?.message || 'Could not submit feedback.');
      return false;
    }
  };

  return (
    <HelpLayout
      screen={screen}
      error={error}
      success={success}
      onDismissError={() => setError(null)}
      onDismissSuccess={() => setSuccess(null)}
    >
      {screen === 'center' && (
        <HelpCenterSection
          categories={helpCategories}
          articles={helpArticles}
          isLoading={isLoadingHelp}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
          onVoteArticle={handleVoteArticle}
        />
      )}

      {screen === 'documentation' && (
        <DocumentationSection
          categories={docCategories}
          pages={docPages}
          isLoading={isLoadingDocs}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
        />
      )}

      {screen === 'faqs' && (
        <FaqsSection
          faqs={faqs}
          isLoading={isLoadingFaqs}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          selectedCategory={faqCategory}
          onSelectCategory={setFaqCategory}
        />
      )}

      {screen === 'support' && (
        <ContactSupportSection
          tickets={tickets}
          isLoadingTickets={isLoadingTickets}
          onSubmitTicket={handleSubmitTicket}
          onSendReply={handleSendReply}
        />
      )}

      {screen === 'feedback' && (
        <FeedbackSection
          feedbacks={feedbacks}
          isLoadingFeedbacks={isLoadingFeedback}
          onSubmitFeedback={handleSubmitFeedback}
        />
      )}
    </HelpLayout>
  );
};

