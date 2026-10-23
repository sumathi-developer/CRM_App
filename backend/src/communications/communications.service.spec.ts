import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CommunicationsService } from './communications.service';
import { CommunicationCenterService } from './services/communication-center.service';
import { EmailsService } from './services/emails.service';
import { CommentsService } from './services/comments.service';
import { TemplatesService } from './services/templates.service';
import { CommunicationHistoryService } from './services/communication-history.service';
import { EmailIntegrationsService } from './services/email-integrations.service';
import { EmailProviderFactory } from './providers/email-provider.factory';
import { TemplateParser } from './utils/template-parser.util';
import { CredentialMasker } from './utils/credential-masker.util';
import { MentionsParser } from './utils/mentions-parser.util';

describe('Communications Module Core Services', () => {
  let prismaMock: any;
  let emailIntegrationsService: EmailIntegrationsService;
  let templatesService: TemplatesService;
  let commentsService: CommentsService;
  let emailsService: EmailsService;
  let historyService: CommunicationHistoryService;
  let centerService: CommunicationCenterService;
  let communicationsService: CommunicationsService;
  let providerFactory: EmailProviderFactory;

  beforeEach(() => {
    prismaMock = {
      emailMessage: {
        count: vi.fn().mockResolvedValue(10),
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn().mockResolvedValue({ count: 2 }),
        delete: vi.fn().mockResolvedValue({ id: 'email-1' }),
        groupBy: vi.fn().mockResolvedValue([
          { status: 'SENT', _count: { status: 5 } },
          { status: 'DELIVERED', _count: { status: 3 } },
        ]),
      },
      emailTemplate: {
        count: vi.fn().mockResolvedValue(4),
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn().mockResolvedValue({ id: 'tmpl-1' }),
      },
      communicationComment: {
        count: vi.fn().mockResolvedValue(8),
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn().mockResolvedValue({ id: 'comm-1' }),
      },
      emailIntegration: {
        count: vi.fn().mockResolvedValue(2),
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        delete: vi.fn().mockResolvedValue({ id: 'integ-1' }),
      },
      user: {
        findUnique: vi.fn(),
        findMany: vi.fn().mockResolvedValue([]),
      },
      contact: {
        findUnique: vi.fn(),
      },
      lead: {
        findUnique: vi.fn(),
      },
      deal: {
        findUnique: vi.fn(),
      },
      organization: {
        findUnique: vi.fn(),
      },
      activity: {
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn().mockResolvedValue({ id: 'act-1' }),
      },
      note: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      notification: {
        create: vi.fn().mockResolvedValue({ id: 'notif-1' }),
      },
    };

    providerFactory = new EmailProviderFactory();
    emailIntegrationsService = new EmailIntegrationsService(prismaMock, providerFactory);
    templatesService = new TemplatesService(prismaMock);
    commentsService = new CommentsService(prismaMock);
    emailsService = new EmailsService(
      prismaMock,
      emailIntegrationsService,
      templatesService,
      providerFactory,
    );
    historyService = new CommunicationHistoryService(prismaMock);
    centerService = new CommunicationCenterService(prismaMock);

    communicationsService = new CommunicationsService(
      centerService,
      emailsService,
      commentsService,
      templatesService,
      historyService,
      emailIntegrationsService,
    );
  });

  describe('TemplateParser Utility', () => {
    it('should correctly interpolate tokens from context', () => {
      const template = 'Hi {{contact.firstName}}, follow up on {{deal.title}}!';
      const context = {
        contact: { firstName: 'Alice' },
        deal: { title: 'Enterprise Contract' },
      };

      const result = TemplateParser.interpolate(template, context);
      expect(result).toBe('Hi Alice, follow up on Enterprise Contract!');
    });

    it('should support default fallback values when token is missing', () => {
      const template = 'Hello {{contact.firstName | Valued Client}}, welcome!';
      const result = TemplateParser.interpolate(template, {});
      expect(result).toBe('Hello Valued Client, welcome!');
    });

    it('should extract unique variable placeholders', () => {
      const text = 'Hello {{contact.firstName}} {{contact.lastName}}, deal: {{deal.title}} and {{contact.firstName}}';
      const extracted = TemplateParser.extractVariables(text);
      expect(extracted).toEqual(['contact.firstName', 'contact.lastName', 'deal.title']);
    });
  });

  describe('CredentialMasker Utility (Module 25 Security)', () => {
    it('should encrypt plaintext and decrypt back correctly', () => {
      const plainSecret = 'SuperSecretSmtpPass!@123';
      const encrypted = CredentialMasker.encrypt(plainSecret);
      expect(encrypted).not.toBe(plainSecret);
      expect(encrypted).toContain(':');

      const decrypted = CredentialMasker.decrypt(encrypted);
      expect(decrypted).toBe(plainSecret);
    });

    it('should sanitize integrations by removing encrypted secrets and adding masked values', () => {
      const rawIntegration = {
        id: 'integ-1',
        name: 'Corporate SMTP',
        encryptedPassword: CredentialMasker.encrypt('mypassword'),
        encryptedApiKey: CredentialMasker.encrypt('SG.1234567890'),
      };

      const sanitized = CredentialMasker.sanitizeIntegration(rawIntegration);
      expect(sanitized.encryptedPassword).toBeUndefined();
      expect(sanitized.encryptedApiKey).toBeUndefined();
      expect(sanitized.hasPassword).toBe(true);
      expect(sanitized.hasApiKey).toBe(true);
      expect(sanitized.passwordMasked).toBe('••••••••');
      expect(sanitized.apiKeyMasked).toBe('••••••••••••');
    });
  });

  describe('MentionsParser Utility', () => {
    it('should extract @email, @username, and @uuid mentions', () => {
      const content = 'Hey @alex and @sarah@company.com please review @12345678-1234-1234-1234-123456789abc';
      const mentions = MentionsParser.extractMentions(content);

      expect(mentions.some((m) => m.type === 'username' && m.value === 'alex')).toBe(true);
      expect(mentions.some((m) => m.type === 'email' && m.value === 'sarah@company.com')).toBe(true);
      expect(mentions.some((m) => m.type === 'uuid')).toBe(true);
    });
  });

  describe('EmailsService', () => {
    it('should compose and dispatch outbound email', async () => {
      const composeDto = {
        recipients: ['client@example.com'],
        subject: 'Welcome',
        body: '<p>Welcome to our platform</p>',
      };

      const fakeCreated = {
        id: 'email-1',
        subject: 'Welcome',
        sender: 'noreply@crm.com',
        recipients: ['client@example.com'],
        status: 'SENT',
        folder: 'SENT',
        direction: 'OUTBOUND',
        isRead: true,
      };

      prismaMock.emailMessage.create.mockResolvedValue(fakeCreated);

      const result = await emailsService.compose(composeDto, {
        id: 'user-1',
        name: 'Sales Rep',
        email: 'sales@crm.com',
      });

      expect(result.id).toBe('email-1');
      expect(prismaMock.emailMessage.create).toHaveBeenCalled();
    });

    it('should support saving as draft without sending', async () => {
      const draftDto = {
        recipients: ['client@example.com'],
        subject: 'Draft Proposal',
        body: '<p>Draft</p>',
        isDraft: true,
      };

      prismaMock.emailMessage.create.mockResolvedValue({
        id: 'draft-1',
        status: 'DRAFT',
        folder: 'DRAFTS',
        isDraft: true,
      });

      const result = await emailsService.compose(draftDto, { id: 'user-1' });
      expect(result.isDraft).toBe(true);
      expect(result.folder).toBe('DRAFTS');
    });

    it('should execute batch actions on emails', async () => {
      const batchDto = {
        emailIds: ['email-1', 'email-2'],
        action: 'MARK_READ' as any,
      };

      const res = await emailsService.batchAction(batchDto);
      expect(res.count).toBe(2);
      expect(prismaMock.emailMessage.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['email-1', 'email-2'] } },
        data: expect.objectContaining({ isRead: true }),
      });
    });
  });

  describe('CommentsService (Internal Comments & Mentions)', () => {
    it('should create an internal comment and generate notifications for mentioned users', async () => {
      prismaMock.user.findMany.mockResolvedValue([
        { id: 'user-2', name: 'Alex Johnson', email: 'alex@crm.com' },
      ]);

      const commentDto = {
        content: 'Check this out @alex',
        emailId: 'email-1',
      };

      prismaMock.emailMessage.findUnique.mockResolvedValue({
        id: 'email-1',
        threadId: 'thread-1',
        workspaceId: 'ws-1',
      });

      prismaMock.communicationComment.create.mockResolvedValue({
        id: 'comm-1',
        content: commentDto.content,
        emailId: 'email-1',
        isInternal: true,
        author: { name: 'John Doe' },
      });

      const comment = await commentsService.create(commentDto, 'user-1');

      expect(comment.id).toBe('comm-1');
      expect(prismaMock.communicationComment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isInternal: true,
            emailId: 'email-1',
          }),
        }),
      );

      // Verify notification was generated for mentioned user
      expect(prismaMock.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-2',
            title: expect.stringContaining('Mentioned by'),
          }),
        }),
      );
    });
  });

  describe('TemplatesService', () => {
    it('should create template and detect variable placeholders automatically', async () => {
      const templateDto = {
        name: 'Follow-up',
        subject: 'Hello {{contact.firstName}}',
        bodyHtml: '<p>About {{deal.title}}</p>',
      };

      prismaMock.emailTemplate.create.mockImplementation((args: any) => ({
        id: 'tmpl-1',
        ...args.data,
      }));

      const created = await templatesService.create(templateDto, 'user-1');
      expect(created.variables).toEqual(expect.arrayContaining(['contact.firstName', 'deal.title']));
    });

    it('should preview and render template with CRM records', async () => {
      prismaMock.emailTemplate.findUnique.mockResolvedValue({
        id: 'tmpl-1',
        name: 'Intro',
        subject: 'Greetings {{contact.firstName}}',
        bodyHtml: '<p>Your deal {{deal.title}} is valued at {{deal.value}}.</p>',
      });

      prismaMock.contact.findUnique.mockResolvedValue({
        id: 'contact-1',
        firstName: 'Alice',
        lastName: 'Smith',
      });

      prismaMock.deal.findUnique.mockResolvedValue({
        id: 'deal-1',
        title: 'Acme SaaS',
        value: 12000,
      });

      const rendered = await templatesService.render(
        'tmpl-1',
        { contactId: 'contact-1', dealId: 'deal-1' },
        { name: 'Bob Agent' },
      );

      expect(rendered.subject).toBe('Greetings Alice');
      expect(rendered.bodyHtml).toBe('<p>Your deal Acme SaaS is valued at 12000.</p>');
    });
  });

  describe('CommunicationHistoryService', () => {
    it('should aggregate emails, activities, notes, and comments into a unified timeline', async () => {
      prismaMock.emailMessage.findMany.mockResolvedValue([
        {
          id: 'email-1',
          subject: 'Contract details',
          snippet: 'Please find attached...',
          createdAt: new Date('2026-10-20T10:00:00Z'),
          direction: 'OUTBOUND',
          status: 'SENT',
        },
      ]);

      prismaMock.activity.findMany.mockResolvedValue([
        {
          id: 'act-1',
          type: 'CALL',
          subject: 'Discovery Call',
          description: 'Client is interested in enterprise tier',
          createdAt: new Date('2026-10-21T14:00:00Z'),
          status: 'COMPLETED',
        },
      ]);

      const timeline = await historyService.getTimeline({ contactId: 'contact-1' });

      expect(timeline.data.length).toBe(2);
      expect(timeline.summary.totalCommunications).toBe(2);
      // Timeline is sorted descending
      expect(timeline.data[0].type).toBe('CALL');
      expect(timeline.data[1].type).toBe('EMAIL');
    });
  });

  describe('CommunicationCenterService', () => {
    it('should return aggregated metrics, status breakdown, and rates', async () => {
      const stats = await centerService.getCenterStats();

      expect(stats.overview.totalEmails).toBe(10);
      expect(stats.overview.inboxTotal).toBe(10);
      expect(stats.overview.commentsTotal).toBe(8);
      expect(stats.overview.templatesTotal).toBe(4);
      expect(stats.performance.statusBreakdown).toBeDefined();

      // Test main communicationsService facade method
      const facadeStats = await communicationsService.getCenterStats();
      expect(facadeStats).toEqual(stats);
    });
  });
});
