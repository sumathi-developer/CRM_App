import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CommunicationsController } from './communications.controller';
import { CommunicationsService } from './communications.service';

describe('CommunicationsController', () => {
  let controller: CommunicationsController;
  let serviceMock: Partial<CommunicationsService>;

  beforeEach(() => {
    serviceMock = {
      getCenterStats: vi.fn().mockResolvedValue({ overview: { totalEmails: 25 } }),
      getCenterStream: vi.fn().mockResolvedValue([]),
      findAllEmails: vi.fn().mockResolvedValue({ data: [], meta: { total: 0 } }),
      getInbox: vi.fn().mockResolvedValue({ data: [], meta: { total: 0 } }),
      getSent: vi.fn().mockResolvedValue({ data: [], meta: { total: 0 } }),
      getDrafts: vi.fn().mockResolvedValue({ data: [], meta: { total: 0 } }),
      getTrash: vi.fn().mockResolvedValue({ data: [], meta: { total: 0 } }),
      getStarred: vi.fn().mockResolvedValue({ data: [], meta: { total: 0 } }),
      findEmailById: vi.fn().mockResolvedValue({ id: 'email-1', subject: 'Subject' }),
      composeEmail: vi.fn().mockResolvedValue({ id: 'email-1', status: 'SENT' }),
      replyEmail: vi.fn().mockResolvedValue({ id: 'email-2', status: 'SENT' }),
      forwardEmail: vi.fn().mockResolvedValue({ id: 'email-3', status: 'SENT' }),
      updateEmail: vi.fn().mockResolvedValue({ id: 'email-1', isRead: true }),
      batchEmailAction: vi.fn().mockResolvedValue({ success: true, count: 2 }),
      deleteEmail: vi.fn().mockResolvedValue({ message: 'Deleted' }),
      findAllComments: vi.fn().mockResolvedValue({ data: [], meta: { total: 0 } }),
      createComment: vi.fn().mockResolvedValue({ id: 'comm-1', content: 'Internal note' }),
      findCommentById: vi.fn().mockResolvedValue({ id: 'comm-1' }),
      updateComment: vi.fn().mockResolvedValue({ id: 'comm-1', content: 'Updated' }),
      deleteComment: vi.fn().mockResolvedValue({ message: 'Deleted' }),
      comments: {
        getByEmail: vi.fn().mockResolvedValue([]),
      } as any,
      findAllTemplates: vi.fn().mockResolvedValue({ data: [], meta: { total: 0 } }),
      createTemplate: vi.fn().mockResolvedValue({ id: 'tmpl-1' }),
      findTemplateById: vi.fn().mockResolvedValue({ id: 'tmpl-1' }),
      updateTemplate: vi.fn().mockResolvedValue({ id: 'tmpl-1' }),
      deleteTemplate: vi.fn().mockResolvedValue({ message: 'Deleted' }),
      cloneTemplate: vi.fn().mockResolvedValue({ id: 'tmpl-2' }),
      renderTemplate: vi.fn().mockResolvedValue({ subject: 'Rendered' }),
      getTemplateVariablesCatalog: vi.fn().mockReturnValue([]),
      getHistoryTimeline: vi.fn().mockResolvedValue({ data: [], meta: { total: 0 } }),
      findAllIntegrations: vi.fn().mockResolvedValue({ data: [], meta: { total: 0 } }),
      createIntegration: vi.fn().mockResolvedValue({ id: 'integ-1', passwordMasked: '••••••••' }),
      findIntegrationById: vi.fn().mockResolvedValue({ id: 'integ-1' }),
      updateIntegration: vi.fn().mockResolvedValue({ id: 'integ-1' }),
      deleteIntegration: vi.fn().mockResolvedValue({ message: 'Deleted' }),
      setIntegrationDefault: vi.fn().mockResolvedValue({ id: 'integ-1', isDefault: true }),
      testIntegration: vi.fn().mockResolvedValue({ success: true, message: 'Connected' }),
      handleIntegrationWebhook: vi.fn().mockResolvedValue({ success: true }),
    };

    controller = new CommunicationsController(serviceMock as CommunicationsService);
  });

  it('should get center stats', async () => {
    const res = await controller.getCenterStats('ws-1');
    expect(res).toEqual({ overview: { totalEmails: 25 } });
    expect(serviceMock.getCenterStats).toHaveBeenCalledWith('ws-1');
  });

  it('should compose email with current user context', async () => {
    const dto = { recipients: ['user@test.com'], subject: 'Test', body: 'Body' };
    const user = { id: 'u-1', name: 'User' };
    const res = await controller.composeEmail(dto, user);
    expect(res).toEqual({ id: 'email-1', status: 'SENT' });
    expect(serviceMock.composeEmail).toHaveBeenCalledWith(dto, user);
  });

  it('should fetch contact communication timeline', async () => {
    await controller.getContactCommunications('contact-1', { page: 1 });
    expect(serviceMock.getHistoryTimeline).toHaveBeenCalledWith(
      expect.objectContaining({
        contactId: 'contact-1',
        entityId: 'contact-1',
      }),
    );
  });

  it('should test email integration', async () => {
    const res = await controller.testIntegration('integ-1');
    expect(res).toEqual({ success: true, message: 'Connected' });
    expect(serviceMock.testIntegration).toHaveBeenCalledWith('integ-1');
  });
});
