import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { WebFormsService } from './web-forms.service';
import { PrismaService } from '../../database/prisma.service';
import { LeadScoringService } from './lead-scoring.service';
import { LeadQualificationService } from './lead-qualification.service';
import { LeadRoutingService } from './lead-routing.service';
import { FormType } from '../dto/create-web-form.dto';

describe('WebFormsService', () => {
  let service: WebFormsService;

  const mockPrisma = {
    webForm: {
      count: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    leadSource: {
      findFirst: vi.fn(),
    },
    lead: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    note: {
      create: vi.fn(),
    },
    formSubmission: {
      create: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  };

  const mockScoringService = {
    calculateAndApply: vi.fn().mockResolvedValue({}),
  };

  const mockQualificationService = {
    evaluateAndApply: vi.fn().mockResolvedValue({}),
  };

  const mockRoutingService = {
    routeLead: vi.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebFormsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: LeadScoringService, useValue: mockScoringService },
        { provide: LeadQualificationService, useValue: mockQualificationService },
        { provide: LeadRoutingService, useValue: mockRoutingService },
      ],
    }).compile();

    service = module.get<WebFormsService>(WebFormsService);
  });

  it('should block honeypot bot submissions without creating a lead', async () => {
    mockPrisma.webForm.findUnique.mockResolvedValue({
      id: 'form-1',
      slug: 'contact-us',
      isPublished: true,
      settings: { successMessage: 'Success!' },
      submissionsCount: 0,
      viewsCount: 10,
    });

    mockPrisma.formSubmission.create.mockResolvedValue({
      id: 'sub-spam',
      isSpam: true,
    });

    const dto = {
      firstName: 'Bot',
      email: 'bot@spam.com',
      _hp_trap: 'I am a bot filling this hidden field',
    };

    const result = await service.submitPublicForm('contact-us', dto, {
      ipAddress: '192.168.1.1',
    });

    expect(result.success).toBe(true);
    expect(mockPrisma.formSubmission.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          isSpam: true,
          status: 'SPAM',
        }),
      }),
    );
    // Should NOT create or update lead
    expect(mockPrisma.lead.create).not.toHaveBeenCalled();
    expect(mockPrisma.lead.update).not.toHaveBeenCalled();
  });

  it('should block disposable email domains', async () => {
    mockPrisma.webForm.findUnique.mockResolvedValue({
      id: 'form-1',
      slug: 'contact-us',
      isPublished: true,
      settings: { successMessage: 'Success!' },
      submissionsCount: 0,
      viewsCount: 10,
    });

    mockPrisma.formSubmission.create.mockResolvedValue({
      id: 'sub-disposable',
      isSpam: true,
    });

    const dto = {
      firstName: 'Temp',
      email: 'temporary.user@mailinator.com',
    };

    const result = await service.submitPublicForm('contact-us', dto, {
      ipAddress: '192.168.1.2',
    });

    expect(result.success).toBe(true);
    expect(mockPrisma.lead.create).not.toHaveBeenCalled();
  });

  it('should create new Lead in Module 06 with full attribution on legitimate submission', async () => {
    mockPrisma.webForm.findUnique.mockResolvedValue({
      id: 'form-demo',
      slug: 'request-demo',
      name: 'Demo Request Form',
      isPublished: true,
      formType: FormType.LANDING_PAGE,
      defaultSource: { id: 'src-landing', type: 'LANDING_PAGE' },
      defaultSourceId: 'src-landing',
      campaignName: 'Q4 Enterprise Inbound',
      settings: {
        successMessage: 'Demo requested!',
        duplicateHandling: 'UPDATE',
        autoScore: true,
        autoQualify: true,
        autoRoute: true,
      },
      submissionsCount: 5,
      viewsCount: 20,
    });

    mockPrisma.lead.findFirst.mockResolvedValue(null); // No duplicate exists

    mockPrisma.lead.create.mockResolvedValue({
      id: 'lead-new',
      email: 'elena@innovate.io',
      firstName: 'Elena',
      lastName: 'Rostova',
      channel: 'LANDING_PAGE',
    });

    mockPrisma.formSubmission.create.mockResolvedValue({
      id: 'sub-legit',
      leadId: 'lead-new',
    });

    mockPrisma.webForm.update.mockResolvedValue({});

    const dto = {
      firstName: 'Elena',
      lastName: 'Rostova',
      email: 'elena@innovate.io',
      phone: '+1 555-0188',
      companyName: 'Innovate AI',
      utmSource: 'google',
      utmMedium: 'cpc',
      utmCampaign: 'enterprise_q4',
      message: 'Looking for a demo for our 50-person sales team',
    };

    const result = await service.submitPublicForm('request-demo', dto, {
      ipAddress: '203.0.113.195',
      userAgent: 'Mozilla/5.0 Chrome',
      referer: 'https://google.com',
    });

    expect(result.success).toBe(true);
    expect(result.leadId).toBe('lead-new');
    expect(mockPrisma.lead.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'elena@innovate.io',
          channel: 'LANDING_PAGE',
          webFormId: 'form-demo',
          leadSourceId: 'src-landing',
          campaign: 'enterprise_q4',
          medium: 'cpc',
          attribution: expect.objectContaining({
            utmSource: 'google',
            utmMedium: 'cpc',
            utmCampaign: 'enterprise_q4',
            referrer: 'https://google.com',
          }),
        }),
      }),
    );

    // Verifies score, qualification, and routing were automatically triggered
    expect(mockScoringService.calculateAndApply).toHaveBeenCalledWith('lead-new');
    expect(mockQualificationService.evaluateAndApply).toHaveBeenCalledWith('lead-new');
    expect(mockRoutingService.routeLead).toHaveBeenCalledWith('lead-new');
  });

  it('should update existing lead details when duplicate email is submitted under UPDATE policy', async () => {
    mockPrisma.webForm.findUnique.mockResolvedValue({
      id: 'form-contact',
      slug: 'contact-us',
      name: 'Contact Form',
      isPublished: true,
      formType: FormType.WEB_FORM,
      settings: { duplicateHandling: 'UPDATE' },
      submissionsCount: 1,
      viewsCount: 10,
    });

    mockPrisma.lead.findFirst.mockResolvedValue({
      id: 'lead-existing',
      email: 'existing@corp.com',
      firstName: 'Existing',
      lastName: 'User',
      leadScore: 10,
    });

    mockPrisma.lead.update.mockResolvedValue({
      id: 'lead-existing',
      phone: '+1 888-0000',
    });

    mockPrisma.formSubmission.create.mockResolvedValue({ id: 'sub-dup' });
    mockPrisma.webForm.update.mockResolvedValue({});

    const dto = {
      firstName: 'Existing Updated',
      email: 'existing@corp.com',
      phone: '+1 888-0000',
    };

    const result = await service.submitPublicForm('contact-us', dto, {});
    expect(result.success).toBe(true);
    expect(result.isDuplicate).toBe(true);
    expect(mockPrisma.lead.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'lead-existing' },
        data: expect.objectContaining({
          phone: '+1 888-0000',
        }),
      }),
    );
  });
});
