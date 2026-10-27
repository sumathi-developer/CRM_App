import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { HelpSupportService } from './help-support.service';
import { TicketStatus } from './enums/ticket-status.enum';
import { TicketPriority } from './enums/ticket-priority.enum';
import { TicketCategory } from './enums/ticket-category.enum';

describe('HelpSupportService', () => {
  let service: HelpSupportService;
  let prismaMock: any;
  let auditLogsMock: any;

  beforeEach(() => {
    prismaMock = {
      helpCategory: {
        create: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      helpArticle: {
        create: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
      docCategory: {
        create: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      docPage: {
        create: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
      faqItem: {
        create: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
      supportTicket: {
        create: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
      },
      supportTicketMessage: {
        create: vi.fn(),
      },
      supportTicketHistory: {
        create: vi.fn(),
      },
      userFeedback: {
        create: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
      },
      $transaction: vi.fn((promises) => Promise.all(promises)),
    };

    auditLogsMock = {
      create: vi.fn().mockResolvedValue({ id: 'audit-1' }),
    };

    service = new HelpSupportService(prismaMock, auditLogsMock);
  });

  describe('Help Center', () => {
    it('should create a help category with slugified name', async () => {
      prismaMock.helpCategory.create.mockResolvedValue({
        id: 'cat-1',
        name: 'Getting Started',
        slug: 'getting-started',
      });

      const result = await service.createHelpCategory({ name: 'Getting Started' });
      expect(result.id).toBe('cat-1');
      expect(prismaMock.helpCategory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Getting Started',
            slug: 'getting-started',
          }),
        }),
      );
    });

    it('should return article details and resolve related articles', async () => {
      prismaMock.helpArticle.findUnique.mockResolvedValue({
        id: 'art-1',
        categoryId: 'cat-1',
        title: 'CSV Import',
        viewsCount: 10,
        isPublished: true,
        relatedArticleIds: [],
      });
      prismaMock.helpArticle.update.mockResolvedValue({ id: 'art-1' });
      prismaMock.helpArticle.findMany.mockResolvedValue([
        { id: 'art-2', title: 'Exporting Data', viewsCount: 5 },
      ]);

      const result = await service.findHelpArticleById('art-1', { role: 'MEMBER' });
      expect(result.id).toBe('art-1');
      expect(result.viewsCount).toBe(11);
      expect(result.relatedArticles).toHaveLength(1);
    });

    it('should record helpful vote on an article', async () => {
      prismaMock.helpArticle.findUnique.mockResolvedValue({ id: 'art-1' });
      prismaMock.helpArticle.update.mockResolvedValue({
        id: 'art-1',
        helpfulCount: 5,
        notHelpfulCount: 1,
      });

      const result = await service.voteHelpArticle('art-1', true);
      expect(result.helpfulCount).toBe(5);
      expect(prismaMock.helpArticle.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { helpfulCount: { increment: 1 } },
        }),
      );
    });
  });

  describe('Documentation', () => {
    it('should create doc category and doc page', async () => {
      prismaMock.docCategory.create.mockResolvedValue({
        id: 'dcat-1',
        name: 'API Docs',
        version: '1.0.0',
      });
      prismaMock.docCategory.findUnique.mockResolvedValue({
        id: 'dcat-1',
        version: '1.0.0',
      });
      prismaMock.docPage.create.mockResolvedValue({
        id: 'page-1',
        title: 'Auth Guide',
        version: '1.0.0',
      });

      const cat = await service.createDocCategory({ name: 'API Docs' });
      expect(cat.id).toBe('dcat-1');

      const page = await service.createDocPage({
        categoryId: 'dcat-1',
        title: 'Auth Guide',
        content: 'Use Bearer tokens',
      });
      expect(page.id).toBe('page-1');
    });
  });

  describe('FAQs', () => {
    it('should create, list, and view FAQ', async () => {
      prismaMock.faqItem.create.mockResolvedValue({
        id: 'faq-1',
        question: 'Where is billing?',
        answer: 'In settings',
        category: 'BILLING',
      });
      prismaMock.faqItem.findUnique.mockResolvedValue({
        id: 'faq-1',
        question: 'Where is billing?',
        viewsCount: 2,
      });
      prismaMock.faqItem.update.mockResolvedValue({ id: 'faq-1' });

      const created = await service.createFaq({
        question: 'Where is billing?',
        answer: 'In settings',
        category: 'billing',
      });
      expect(created.id).toBe('faq-1');

      const found = await service.findFaqById('faq-1');
      expect(found.viewsCount).toBe(3);
    });
  });

  describe('Contact Support & Tickets', () => {
    it('should create a support ticket with generated ticket number and history', async () => {
      const mockUser = { id: 'u-1', email: 'client@crm.com', name: 'Client A' };
      prismaMock.supportTicket.create.mockResolvedValue({
        id: 't-1',
        ticketNumber: 'TIK-9999XYZ',
        subject: 'Cannot login',
        description: 'Error 500',
        userId: 'u-1',
        status: TicketStatus.OPEN,
        history: [{ id: 'h-1', action: 'CREATED' }],
      });

      const result = await service.createSupportTicket(
        {
          subject: 'Cannot login',
          description: 'Error 500',
          category: TicketCategory.TECHNICAL,
          priority: TicketPriority.HIGH,
        },
        mockUser,
      );

      expect(result.id).toBe('t-1');
      expect(result.ticketNumber).toBe('TIK-9999XYZ');
      expect(auditLogsMock.create).toHaveBeenCalled();
    });

    it('should enforce ticket access: normal user can ONLY see their own tickets', async () => {
      prismaMock.supportTicket.findMany.mockResolvedValue([]);
      prismaMock.supportTicket.count.mockResolvedValue(0);

      await service.findAllTickets({}, { id: 'u-client', role: 'MEMBER' });

      expect(prismaMock.supportTicket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'u-client',
          }),
        }),
      );
    });

    it('should hide internal staff notes from regular CRM users', async () => {
      const mockTicket = {
        id: 't-1',
        userId: 'u-client',
        messages: [
          { id: 'm-1', message: 'Hello client', isInternalNote: false },
          { id: 'm-2', message: 'Internal bug identified', isInternalNote: true },
        ],
        history: [
          { id: 'h-1', action: 'CREATED', isInternal: false },
          { id: 'h-2', action: 'ASSIGNED', isInternal: true },
        ],
      };

      prismaMock.supportTicket.findUnique.mockResolvedValue(mockTicket);

      // Normal user
      const clientView = await service.findTicketById('t-1', {
        id: 'u-client',
        role: 'MEMBER',
      });
      expect(clientView.messages).toHaveLength(1);
      expect(clientView.messages[0].id).toBe('m-1');
      expect(clientView.history).toHaveLength(1);
      expect(clientView.history[0].id).toBe('h-1');

      // Admin user sees everything
      const adminView = await service.findTicketById('t-1', {
        id: 'u-admin',
        role: 'ADMIN',
      });
      expect(adminView.messages).toHaveLength(2);
      expect(adminView.history).toHaveLength(2);
    });

    it('should throw ForbiddenException if regular user accesses another user ticket', async () => {
      prismaMock.supportTicket.findUnique.mockResolvedValue({
        id: 't-1',
        userId: 'other-user',
        messages: [],
        history: [],
      });

      await expect(
        service.findTicketById('t-1', { id: 'u-intruder', role: 'MEMBER' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should assign ticket only if user has admin/support role', async () => {
      prismaMock.supportTicket.findUnique.mockResolvedValue({
        id: 't-1',
        ticketNumber: 'TIK-100',
        status: TicketStatus.OPEN,
      });
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'u-agent',
        name: 'Agent Smith',
        email: 'smith@crm.com',
      });
      prismaMock.supportTicket.update.mockResolvedValue({
        id: 't-1',
        assignedToId: 'u-agent',
      });
      prismaMock.supportTicketHistory.create.mockResolvedValue({ id: 'h-1' });

      // Normal user forbidden
      await expect(
        service.assignTicket(
          't-1',
          { assignedToId: 'u-agent' },
          { id: 'u-user', role: 'MEMBER' },
        ),
      ).rejects.toThrow(ForbiddenException);

      // Admin succeeds
      const result = await service.assignTicket(
        't-1',
        { assignedToId: 'u-agent' },
        { id: 'u-admin', role: 'ADMIN' },
      );
      expect(result.id).toBe('t-1');
    });

    it('should allow support to add internal note, but block normal user from adding internal note', async () => {
      prismaMock.supportTicket.findUnique.mockResolvedValue({
        id: 't-1',
        userId: 'u-client',
        status: TicketStatus.OPEN,
      });

      // Normal user cannot add internal note
      await expect(
        service.addTicketMessage(
          't-1',
          { message: 'Secret note', isInternalNote: true },
          { id: 'u-client', role: 'MEMBER' },
        ),
      ).rejects.toThrow(ForbiddenException);

      // Support can add internal note
      prismaMock.supportTicketMessage.create.mockResolvedValue({
        id: 'm-1',
        message: 'Secret note',
        isInternalNote: true,
      });
      prismaMock.supportTicketHistory.create.mockResolvedValue({ id: 'h-1' });

      const msg = await service.addTicketMessage(
        't-1',
        { message: 'Secret note', isInternalNote: true },
        { id: 'u-support', role: 'SUPPORT' },
      );
      expect(msg.id).toBe('m-1');
    });
  });

  describe('Feedback', () => {
    it('should submit feedback and strip adminNotes for regular users', async () => {
      prismaMock.userFeedback.create.mockResolvedValue({
        id: 'fb-1',
        description: 'Great UI',
        rating: 5,
        userId: 'u-1',
      });

      const submitted = await service.submitFeedback(
        { description: 'Great UI', rating: 5 },
        { id: 'u-1', email: 'u1@crm.com' },
      );
      expect(submitted.id).toBe('fb-1');

      prismaMock.userFeedback.findMany.mockResolvedValue([
        {
          id: 'fb-1',
          description: 'Great UI',
          userId: 'u-1',
          adminNotes: 'Candidate for testimonial',
        },
      ]);
      prismaMock.userFeedback.count.mockResolvedValue(1);

      // Regular user: adminNotes stripped
      const regularList = await service.findAllFeedback(
        {},
        { id: 'u-1', role: 'MEMBER' },
      );
      expect(regularList.data[0]).not.toHaveProperty('adminNotes');

      // Admin user: adminNotes preserved
      const adminList = await service.findAllFeedback(
        {},
        { id: 'u-admin', role: 'ADMIN' },
      );
      expect(adminList.data[0]).toHaveProperty('adminNotes');
    });
  });
});
