import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { LeadGenerationController } from './lead-generation.controller';
import { LeadGenerationService } from './lead-generation.service';
import { LeadSourceType } from './dto/create-lead-source.dto';
import { FormType } from './dto/create-web-form.dto';
import { ScoringCategory, RuleOperator } from './dto/create-scoring-rule.dto';
import { RoutingStrategy } from './dto/create-assignment-rule.dto';

describe('LeadGenerationController', () => {
  let controller: LeadGenerationController;

  const mockLeadGenService = {
    analytics: {
      getOverview: vi.fn(),
      getSourcesAnalytics: vi.fn(),
      getFormsAnalytics: vi.fn(),
    },
    sources: {
      create: vi.fn(),
      findAll: vi.fn(),
      findOne: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    },
    forms: {
      create: vi.fn(),
      findAll: vi.fn(),
      findOne: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      publish: vi.fn(),
      unpublish: vi.fn(),
      getPublicForm: vi.fn(),
      submitPublicForm: vi.fn(),
      findAllSubmissions: vi.fn(),
      findSubmissionById: vi.fn(),
      markSubmissionSpam: vi.fn(),
      reprocessSubmission: vi.fn(),
    },
    scoring: {
      create: vi.fn(),
      findAll: vi.fn(),
      findOne: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      calculateScore: vi.fn(),
      calculateAndApply: vi.fn(),
    },
    qualification: {
      create: vi.fn(),
      findAll: vi.fn(),
      findOne: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      evaluate: vi.fn(),
      evaluateAndApply: vi.fn(),
    },
    routing: {
      create: vi.fn(),
      findAll: vi.fn(),
      findOne: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      routeLead: vi.fn(),
      bulkAssign: vi.fn(),
    },
    getCampaignLeads: vi.fn(),
    getSocialLeads: vi.fn(),
    getWebsiteLeads: vi.fn(),
    getLandingPageLeads: vi.fn(),
    getEmailLeads: vi.fn(),
    getReferralLeads: vi.fn(),
    getManualLeads: vi.fn(),
    captureManualLead: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LeadGenerationController],
      providers: [
        {
          provide: LeadGenerationService,
          useValue: mockLeadGenService,
        },
      ],
    }).compile();

    controller = module.get<LeadGenerationController>(LeadGenerationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ==========================================
  // 1. OVERVIEW & ANALYTICS
  // ==========================================
  describe('Overview & Analytics', () => {
    it('should return overview metrics', async () => {
      const mockResult = {
        kpis: { totalLeadsGenerated: 50, averageLeadScore: 65 },
        forms: { totalForms: 3, overallConversionRate: 14.5 },
      };
      mockLeadGenService.analytics.getOverview.mockResolvedValue(mockResult);

      const res = await controller.getOverview();
      expect(res).toEqual(mockResult);
      expect(mockLeadGenService.analytics.getOverview).toHaveBeenCalled();
    });

    it('should return lead source analytics', async () => {
      const mockSources = {
        summary: { totalCost: 5000, totalLeads: 120, overallCPL: 41.67 },
        sources: [],
      };
      mockLeadGenService.analytics.getSourcesAnalytics.mockResolvedValue(mockSources);

      const res = await controller.getSourceAnalytics();
      expect(res).toEqual(mockSources);
      expect(mockLeadGenService.analytics.getSourcesAnalytics).toHaveBeenCalled();
    });
  });

  // ==========================================
  // 2. LEAD SOURCES CRUD
  // ==========================================
  describe('Lead Sources CRUD', () => {
    it('should create a lead source', async () => {
      const dto = {
        name: 'LinkedIn Sponsored Ads',
        type: LeadSourceType.SOCIAL_MEDIA,
        cost: 1500,
      };
      const created = { id: 'src-1', ...dto, code: 'LINKEDIN_SPONSORED_ADS' };
      mockLeadGenService.sources.create.mockResolvedValue(created);

      const res = await controller.createSource(dto);
      expect(res).toEqual(created);
      expect(mockLeadGenService.sources.create).toHaveBeenCalledWith(dto);
    });

    it('should find all lead sources', async () => {
      const paginated = { data: [{ id: 'src-1', name: 'Website' }], meta: { total: 1 } };
      mockLeadGenService.sources.findAll.mockResolvedValue(paginated);

      const res = await controller.findAllSources({ page: 1, limit: 10 });
      expect(res).toEqual(paginated);
    });

    it('should find one lead source with metrics', async () => {
      const source = { id: 'src-1', name: 'Website', metrics: { totalLeads: 25 } };
      mockLeadGenService.sources.findOne.mockResolvedValue(source);

      const res = await controller.findOneSource('src-1');
      expect(res).toEqual(source);
      expect(mockLeadGenService.sources.findOne).toHaveBeenCalledWith('src-1');
    });

    it('should delete a lead source', async () => {
      mockLeadGenService.sources.remove.mockResolvedValue({ message: 'Deleted' });

      const res = await controller.removeSource('src-1');
      expect(res).toEqual({ message: 'Deleted' });
    });
  });

  // ==========================================
  // 3. WEB FORMS & PUBLIC SUBMISSION
  // ==========================================
  describe('Web Forms & Public Submissions', () => {
    it('should create a web form', async () => {
      const dto = {
        name: 'Enterprise Demo',
        title: 'Request a Demo',
        formType: FormType.LANDING_PAGE,
      };
      const created = { id: 'form-1', slug: 'enterprise-demo', ...dto };
      mockLeadGenService.forms.create.mockResolvedValue(created);

      const res = await controller.createForm(dto);
      expect(res).toEqual(created);
    });

    it('should publish a form', async () => {
      const published = {
        message: 'Published',
        publicUrl: '/api/lead-generation/forms/public/demo',
      };
      mockLeadGenService.forms.publish.mockResolvedValue(published);

      const res = await controller.publishForm('form-1');
      expect(res).toEqual(published);
      expect(mockLeadGenService.forms.publish).toHaveBeenCalledWith('form-1');
    });

    it('should retrieve public form schema without authentication', async () => {
      const publicSchema = {
        name: 'Contact Us',
        slug: 'contact-us',
        fields: [{ name: 'email', type: 'email' }],
      };
      mockLeadGenService.forms.getPublicForm.mockResolvedValue(publicSchema);

      const res = await controller.getPublicForm('contact-us');
      expect(res).toEqual(publicSchema);
      expect(mockLeadGenService.forms.getPublicForm).toHaveBeenCalledWith('contact-us');
    });

    it('should handle public form submission', async () => {
      const dto = {
        firstName: 'Sarah',
        email: 'sarah@example.com',
        companyName: 'Apex',
      };
      const mockReq = {
        headers: { 'x-forwarded-for': '127.0.0.1', 'user-agent': 'Vitest Browser' },
        socket: {},
      };
      const submissionResponse = {
        success: true,
        message: 'Thank you!',
        leadId: 'lead-123',
      };
      mockLeadGenService.forms.submitPublicForm.mockResolvedValue(submissionResponse);

      const res = await controller.submitPublicForm('contact-us', dto, mockReq);
      expect(res).toEqual(submissionResponse);
      expect(mockLeadGenService.forms.submitPublicForm).toHaveBeenCalled();
    });
  });

  // ==========================================
  // 4. CHANNEL-SPECIFIC LEAD RETRIEVAL
  // ==========================================
  describe('Channel-Specific Lead Retrieval', () => {
    it('should retrieve campaign leads', async () => {
      const result = { data: [{ id: 'lead-1', campaign: 'summer_promo' }], meta: { total: 1 } };
      mockLeadGenService.getCampaignLeads.mockResolvedValue(result);

      const res = await controller.getCampaignLeads({ campaign: 'summer_promo' });
      expect(res).toEqual(result);
      expect(mockLeadGenService.getCampaignLeads).toHaveBeenCalledWith({ campaign: 'summer_promo' });
    });

    it('should retrieve social leads', async () => {
      const result = { data: [{ id: 'lead-2', channel: 'SOCIAL_MEDIA' }], meta: { total: 1 } };
      mockLeadGenService.getSocialLeads.mockResolvedValue(result);

      const res = await controller.getSocialLeads({});
      expect(res).toEqual(result);
    });

    it('should retrieve website leads', async () => {
      const result = { data: [{ id: 'lead-3', channel: 'WEBSITE' }], meta: { total: 1 } };
      mockLeadGenService.getWebsiteLeads.mockResolvedValue(result);

      const res = await controller.getWebsiteLeads({});
      expect(res).toEqual(result);
    });

    it('should retrieve landing page leads', async () => {
      const result = { data: [{ id: 'lead-4', channel: 'LANDING_PAGE' }], meta: { total: 1 } };
      mockLeadGenService.getLandingPageLeads.mockResolvedValue(result);

      const res = await controller.getLandingPageLeads({});
      expect(res).toEqual(result);
    });

    it('should retrieve email leads', async () => {
      const result = { data: [{ id: 'lead-5', channel: 'EMAIL' }], meta: { total: 1 } };
      mockLeadGenService.getEmailLeads.mockResolvedValue(result);

      const res = await controller.getEmailLeads({});
      expect(res).toEqual(result);
    });

    it('should retrieve referral leads', async () => {
      const result = { data: [{ id: 'lead-6', channel: 'REFERRAL' }], meta: { total: 1 } };
      mockLeadGenService.getReferralLeads.mockResolvedValue(result);

      const res = await controller.getReferralLeads({});
      expect(res).toEqual(result);
    });
  });

  // ==========================================
  // 5. MANUAL LEAD CAPTURE
  // ==========================================
  describe('Manual Lead Capture', () => {
    it('should capture a lead manually with scoring and routing', async () => {
      const dto = {
        title: 'Booth inquiry',
        firstName: 'David',
        lastName: 'Miller',
        email: 'david@corp.com',
        channel: 'EVENT',
      };
      const result = {
        message: 'Manual lead captured successfully',
        lead: { id: 'lead-m1', ...dto, leadScore: 35 },
      };
      mockLeadGenService.captureManualLead.mockResolvedValue(result);

      const res = await controller.captureManualLead(dto, 'user-admin');
      expect(res).toEqual(result);
      expect(mockLeadGenService.captureManualLead).toHaveBeenCalledWith(dto, 'user-admin');
    });
  });

  // ==========================================
  // 6. SCORING RULES & SCORE CALCULATION
  // ==========================================
  describe('Scoring Rules & Score Calculation', () => {
    it('should create a scoring rule', async () => {
      const dto = {
        name: 'Executive Title',
        category: ScoringCategory.DEMOGRAPHIC,
        conditionField: 'jobTitle',
        operator: RuleOperator.CONTAINS,
        conditionValue: 'CEO,VP',
        scoreChange: 25,
      };
      const created = { id: 'score-rule-1', ...dto };
      mockLeadGenService.scoring.create.mockResolvedValue(created);

      const res = await controller.createScoringRule(dto);
      expect(res).toEqual(created);
    });

    it('should calculate and apply lead score to existing lead', async () => {
      const scoreOutput = {
        lead: { id: 'lead-1', leadScore: 50 },
        scoreResult: { totalScore: 50, breakdown: [] },
      };
      mockLeadGenService.scoring.calculateAndApply.mockResolvedValue(scoreOutput);

      const res = await controller.calculateLeadScore('lead-1');
      expect(res).toEqual(scoreOutput);
      expect(mockLeadGenService.scoring.calculateAndApply).toHaveBeenCalledWith('lead-1');
    });

    it('should preview score calculation for payload', async () => {
      const previewRes = { totalScore: 40, breakdown: [] };
      mockLeadGenService.scoring.calculateScore.mockResolvedValue(previewRes);

      const res = await controller.previewScore({ lead: { email: 'test@corp.com' } });
      expect(res).toEqual(previewRes);
    });
  });

  // ==========================================
  // 7. QUALIFICATION RULES & EVALUATION
  // ==========================================
  describe('Qualification Rules & Evaluation', () => {
    it('should create a qualification rule', async () => {
      const dto = {
        name: 'Enterprise MQL',
        targetStatus: 'QUALIFIED',
        minScore: 40,
        conditions: [],
        autoQualify: true,
      };
      const created = { id: 'qual-1', ...dto };
      mockLeadGenService.qualification.create.mockResolvedValue(created);

      const res = await controller.createQualificationRule(dto);
      expect(res).toEqual(created);
    });

    it('should evaluate qualification for a lead', async () => {
      const qualOutput = {
        lead: { id: 'lead-1', status: 'QUALIFIED' },
        qualification: { isQualified: true, targetStatus: 'QUALIFIED' },
      };
      mockLeadGenService.qualification.evaluateAndApply.mockResolvedValue(qualOutput);

      const res = await controller.evaluateLeadQualification('lead-1');
      expect(res).toEqual(qualOutput);
      expect(mockLeadGenService.qualification.evaluateAndApply).toHaveBeenCalledWith('lead-1');
    });
  });

  // ==========================================
  // 8. ROUTING RULES & ASSIGNMENT
  // ==========================================
  describe('Routing Rules & Lead Assignment', () => {
    it('should create an assignment rule', async () => {
      const dto = {
        name: 'Round Robin Inbound',
        routingStrategy: RoutingStrategy.ROUND_ROBIN,
        targetUserIds: ['u1', 'u2'],
      };
      const created = { id: 'assign-1', ...dto };
      mockLeadGenService.routing.create.mockResolvedValue(created);

      const res = await controller.createAssignmentRule(dto);
      expect(res).toEqual(created);
    });

    it('should route and assign a lead', async () => {
      const routeRes = {
        leadId: 'lead-1',
        assignedTo: { id: 'u1', name: 'Alice', email: 'alice@crm.com' },
        strategy: 'ROUND_ROBIN',
        reason: 'Assigned via Round Robin',
      };
      mockLeadGenService.routing.routeLead.mockResolvedValue(routeRes);

      const res = await controller.routeLead('lead-1', {});
      expect(res).toEqual(routeRes);
      expect(mockLeadGenService.routing.routeLead).toHaveBeenCalledWith('lead-1', undefined, undefined);
    });

    it('should bulk assign multiple leads', async () => {
      const bulkRes = { total: 2, successful: 2, results: [] };
      mockLeadGenService.routing.bulkAssign.mockResolvedValue(bulkRes);

      const res = await controller.bulkAssign({ leadIds: ['lead-1', 'lead-2'] });
      expect(res).toEqual(bulkRes);
      expect(mockLeadGenService.routing.bulkAssign).toHaveBeenCalledWith(['lead-1', 'lead-2'], undefined, undefined);
    });
  });
});
