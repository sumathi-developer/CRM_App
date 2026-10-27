import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HelpSupportController } from './help-support.controller';
import { HelpSupportService } from './help-support.service';
import { TicketStatus } from './enums/ticket-status.enum';

describe('HelpSupportController', () => {
  let controller: HelpSupportController;
  let serviceMock: Partial<HelpSupportService>;

  beforeEach(() => {
    serviceMock = {
      findAllHelpCategories: vi.fn().mockResolvedValue([{ id: 'cat-1', name: 'General' }]),
      createHelpCategory: vi.fn().mockResolvedValue({ id: 'cat-1', name: 'General' }),
      updateHelpCategory: vi.fn().mockResolvedValue({ id: 'cat-1', name: 'General Updated' }),
      deleteHelpCategory: vi.fn().mockResolvedValue({ message: 'Deleted' }),
      findAllHelpArticles: vi.fn().mockResolvedValue({ data: [], meta: { total: 0 } }),
      createHelpArticle: vi.fn().mockResolvedValue({ id: 'art-1', title: 'Article 1' }),
      findHelpArticleById: vi.fn().mockResolvedValue({ id: 'art-1', title: 'Article 1', relatedArticles: [] }),
      updateHelpArticle: vi.fn().mockResolvedValue({ id: 'art-1', title: 'Updated' }),
      deleteHelpArticle: vi.fn().mockResolvedValue({ message: 'Deleted' }),
      voteHelpArticle: vi.fn().mockResolvedValue({ helpfulCount: 1 }),
      findAllDocCategories: vi.fn().mockResolvedValue([{ id: 'dcat-1', name: 'API' }]),
      createDocCategory: vi.fn().mockResolvedValue({ id: 'dcat-1', name: 'API' }),
      updateDocCategory: vi.fn().mockResolvedValue({ id: 'dcat-1', name: 'API Updated' }),
      deleteDocCategory: vi.fn().mockResolvedValue({ message: 'Deleted' }),
      findAllDocPages: vi.fn().mockResolvedValue({ data: [], meta: { total: 0 } }),
      createDocPage: vi.fn().mockResolvedValue({ id: 'page-1', title: 'Page 1' }),
      findDocPageById: vi.fn().mockResolvedValue({ id: 'page-1', title: 'Page 1' }),
      updateDocPage: vi.fn().mockResolvedValue({ id: 'page-1', title: 'Page Updated' }),
      deleteDocPage: vi.fn().mockResolvedValue({ message: 'Deleted' }),
      findAllFaqs: vi.fn().mockResolvedValue({ data: [], meta: { total: 0 } }),
      createFaq: vi.fn().mockResolvedValue({ id: 'faq-1', question: 'Q1' }),
      findFaqById: vi.fn().mockResolvedValue({ id: 'faq-1', question: 'Q1' }),
      updateFaq: vi.fn().mockResolvedValue({ id: 'faq-1', question: 'Q1 Updated' }),
      deleteFaq: vi.fn().mockResolvedValue({ message: 'Deleted' }),
      createSupportTicket: vi.fn().mockResolvedValue({ id: 't-1', ticketNumber: 'TIK-100' }),
      findAllTickets: vi.fn().mockResolvedValue({ data: [], meta: { total: 0 } }),
      findTicketById: vi.fn().mockResolvedValue({ id: 't-1', ticketNumber: 'TIK-100', messages: [], history: [] }),
      updateTicketStatus: vi.fn().mockResolvedValue({ id: 't-1', status: TicketStatus.RESOLVED }),
      assignTicket: vi.fn().mockResolvedValue({ id: 't-1', assignedToId: 'agent-1' }),
      addTicketMessage: vi.fn().mockResolvedValue({ id: 'm-1', message: 'Hello' }),
      submitFeedback: vi.fn().mockResolvedValue({ id: 'fb-1', rating: 5 }),
      findAllFeedback: vi.fn().mockResolvedValue({ data: [], meta: { total: 0 } }),
      findFeedbackById: vi.fn().mockResolvedValue({ id: 'fb-1', rating: 5 }),
      updateFeedback: vi.fn().mockResolvedValue({ id: 'fb-1', status: 'RESOLVED' }),
    };

    controller = new HelpSupportController(serviceMock as HelpSupportService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('Help Center', () => {
    it('should delegate category and article calls', async () => {
      const cats = await controller.getHelpCategories('ws-1', 'true');
      expect(serviceMock.findAllHelpCategories).toHaveBeenCalledWith('ws-1', true);
      expect(cats).toHaveLength(1);

      const art = await controller.getHelpArticleById('art-1', { id: 'u-1' });
      expect(serviceMock.findHelpArticleById).toHaveBeenCalledWith('art-1', { id: 'u-1' });
      expect(art).toHaveProperty('id', 'art-1');

      const vote = await controller.voteHelpArticle('art-1', 'true');
      expect(serviceMock.voteHelpArticle).toHaveBeenCalledWith('art-1', true);
      expect(vote).toHaveProperty('helpfulCount', 1);
    });
  });

  describe('Documentation', () => {
    it('should delegate doc category and page calls', async () => {
      const dcat = await controller.getDocCategories('ws-1', '1.0.0', 'PUBLISHED');
      expect(serviceMock.findAllDocCategories).toHaveBeenCalledWith('ws-1', '1.0.0', 'PUBLISHED');
      expect(dcat).toHaveLength(1);

      const page = await controller.getDocPageById('page-1', { id: 'u-1' });
      expect(serviceMock.findDocPageById).toHaveBeenCalledWith('page-1', { id: 'u-1' });
      expect(page).toHaveProperty('id', 'page-1');
    });
  });

  describe('FAQs', () => {
    it('should delegate FAQ calls', async () => {
      const faqs = await controller.getFaqs({}, { id: 'u-1' });
      expect(serviceMock.findAllFaqs).toHaveBeenCalled();
      expect(faqs.data).toEqual([]);

      const faq = await controller.getFaqById('faq-1');
      expect(serviceMock.findFaqById).toHaveBeenCalledWith('faq-1');
      expect(faq).toHaveProperty('id', 'faq-1');
    });
  });

  describe('Tickets', () => {
    it('should delegate ticket creation and management', async () => {
      const user = { id: 'u-1' };
      const dto = { subject: 'Help', description: 'Issue' };
      const created = await controller.createTicket(dto, user);
      expect(serviceMock.createSupportTicket).toHaveBeenCalledWith(dto, user);
      expect(created).toHaveProperty('ticketNumber', 'TIK-100');

      const ticket = await controller.getTicketById('t-1', user);
      expect(serviceMock.findTicketById).toHaveBeenCalledWith('t-1', user);
      expect(ticket).toHaveProperty('id', 't-1');

      const statusRes = await controller.updateTicketStatus('t-1', { status: TicketStatus.RESOLVED }, user);
      expect(serviceMock.updateTicketStatus).toHaveBeenCalledWith('t-1', { status: TicketStatus.RESOLVED }, user);
      expect(statusRes.status).toBe(TicketStatus.RESOLVED);
    });
  });

  describe('Feedback', () => {
    it('should delegate feedback operations', async () => {
      const user = { id: 'u-1' };
      const fb = await controller.submitFeedback({ description: 'Good job', rating: 5 }, user);
      expect(serviceMock.submitFeedback).toHaveBeenCalled();
      expect(fb).toHaveProperty('rating', 5);

      const list = await controller.getFeedback({}, user);
      expect(serviceMock.findAllFeedback).toHaveBeenCalled();
      expect(list.data).toEqual([]);
    });
  });
});
