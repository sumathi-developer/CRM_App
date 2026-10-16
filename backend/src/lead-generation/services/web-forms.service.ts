import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateWebFormDto, FormStatus, FormType } from '../dto/create-web-form.dto';
import { UpdateWebFormDto } from '../dto/update-web-form.dto';
import { WebFormQueryDto } from '../dto/web-form-query.dto';
import { PublicFormSubmitDto } from '../dto/public-form-submit.dto';
import { SubmissionQueryDto } from '../dto/submission-query.dto';
import { LeadScoringService } from './lead-scoring.service';
import { LeadQualificationService } from './lead-qualification.service';
import { LeadRoutingService } from './lead-routing.service';
import { createPaginatedResponse } from '../../common/utils/response.util';
import * as crypto from 'crypto';

// Known disposable/temporary email provider domains
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com',
  'guerrillamail.com',
  'tempmail.com',
  '10minutemail.com',
  'throwawaymail.com',
  'trashmail.com',
  'yopmail.com',
  'dispostable.com',
  'fakeinbox.com',
  'getairmail.com',
  'burnermail.io',
  'sharklasers.com',
  'grr.la',
]);

@Injectable()
export class WebFormsService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scoringService: LeadScoringService,
    private readonly qualificationService: LeadQualificationService,
    private readonly routingService: LeadRoutingService,
  ) {}

  private get db(): any {
    return this.prisma;
  }

  async onModuleInit() {
    await this.seedDefaultFormsIfEmpty();
  }

  private generateSlug(name: string): string {
    const base = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    return base || 'lead-form';
  }

  /**
   * Seed default forms if table is empty.
   */
  async seedDefaultFormsIfEmpty() {
    try {
      const count = await this.db.webForm.count();
      if (count === 0) {
        const defaultSource = await this.db.leadSource.findFirst({
          where: { code: 'WEBSITE_CONTACT_FORM' },
        });

        const defaultLandingSource = await this.db.leadSource.findFirst({
          where: { code: 'LANDING_PAGE_DEMO' },
        });

        const forms = [
          {
            name: 'Contact Us - Main Website',
            slug: 'contact-us',
            title: 'Contact Our Sales Team',
            description: 'Have questions about our CRM platform? Reach out to speak with a product specialist.',
            status: FormStatus.PUBLISHED,
            formType: FormType.WEB_FORM,
            isPublished: true,
            publishedAt: new Date(),
            defaultSourceId: defaultSource?.id,
            fields: [
              { name: 'firstName', label: 'First Name', type: 'text', required: true, placeholder: 'John' },
              { name: 'lastName', label: 'Last Name', type: 'text', required: true, placeholder: 'Doe' },
              { name: 'email', label: 'Work Email', type: 'email', required: true, placeholder: 'john@company.com' },
              { name: 'phone', label: 'Phone Number', type: 'phone', required: false, placeholder: '+1 (555) 012-3456' },
              { name: 'companyName', label: 'Company Name', type: 'text', required: false, placeholder: 'Acme Inc.' },
              { name: 'message', label: 'How can we help you?', type: 'textarea', required: false, placeholder: 'Describe your requirements...' },
            ],
            styling: {
              primaryColor: '#3b82f6',
              buttonText: 'Submit Inquiry',
              borderRadius: '8px',
              theme: 'light',
            },
            settings: {
              successMessage: 'Thank you for reaching out! Our team will get back to you within 24 business hours.',
              duplicateHandling: 'UPDATE',
              autoScore: true,
              autoQualify: true,
              autoRoute: true,
            },
            viewsCount: 142,
            submissionsCount: 18,
            conversionRate: 12.67,
          },
          {
            name: 'Enterprise Demo Request Landing Page',
            slug: 'request-enterprise-demo',
            title: 'Experience the Full Enterprise CRM Demo',
            description: 'See how our platform streamlines end-to-end sales operations and boosts pipeline velocity.',
            status: FormStatus.PUBLISHED,
            formType: FormType.LANDING_PAGE,
            isPublished: true,
            publishedAt: new Date(),
            defaultSourceId: defaultLandingSource?.id,
            fields: [
              { name: 'firstName', label: 'First Name', type: 'text', required: true },
              { name: 'lastName', label: 'Last Name', type: 'text', required: true },
              { name: 'email', label: 'Business Email', type: 'email', required: true },
              { name: 'phone', label: 'Direct Phone', type: 'phone', required: true },
              { name: 'companyName', label: 'Company Name', type: 'text', required: true },
              { name: 'jobTitle', label: 'Job Title / Role', type: 'text', required: true },
              { name: 'estimatedValue', label: 'Expected Team Budget ($)', type: 'number', required: false },
            ],
            styling: {
              primaryColor: '#10b981',
              buttonText: 'Request VIP Demo',
              borderRadius: '10px',
              theme: 'dark',
            },
            settings: {
              successMessage: 'VIP Demo booked! A senior sales consultant has been notified.',
              duplicateHandling: 'MERGE',
              autoScore: true,
              autoQualify: true,
              autoRoute: true,
            },
            viewsCount: 89,
            submissionsCount: 14,
            conversionRate: 15.73,
          },
        ];

        for (const item of forms) {
          await this.db.webForm.create({
            data: {
              id: crypto.randomUUID(),
              name: item.name,
              slug: item.slug,
              title: item.title,
              description: item.description,
              status: item.status,
              formType: item.formType,
              isPublished: item.isPublished,
              publishedAt: item.publishedAt,
              defaultSourceId: item.defaultSourceId,
              fields: item.fields as any,
              styling: item.styling as any,
              settings: item.settings as any,
              viewsCount: item.viewsCount,
              submissionsCount: item.submissionsCount,
              conversionRate: item.conversionRate,
            },
          });
        }
      }
    } catch {
      // Ignore if table still initializing
    }
  }

  // ==========================================
  // WEB FORMS CRUD
  // ==========================================

  async create(dto: CreateWebFormDto) {
    let slug = dto.slug ? this.generateSlug(dto.slug) : this.generateSlug(dto.name);

    // Ensure slug uniqueness
    const existing = await this.db.webForm.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${crypto.randomBytes(2).toString('hex')}`;
    }

    return this.db.webForm.create({
      data: {
        id: crypto.randomUUID(),
        name: dto.name,
        slug,
        title: dto.title,
        description: dto.description,
        status: dto.status || FormStatus.DRAFT,
        formType: dto.formType || FormType.WEB_FORM,
        fields: (dto.fields || []) as any,
        styling: (dto.styling || {}) as any,
        settings: (dto.settings || { successMessage: 'Thank you! Your submission has been received.' }) as any,
        defaultSourceId: dto.defaultSourceId,
        defaultOwnerId: dto.defaultOwnerId,
        campaignName: dto.campaignName,
        isPublished: dto.status === FormStatus.PUBLISHED,
        publishedAt: dto.status === FormStatus.PUBLISHED ? new Date() : null,
        workspaceId: dto.workspaceId,
      },
      include: {
        defaultSource: true,
      },
    });
  }

  async findAll(query: WebFormQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Number(query.limit) || 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { title: { contains: query.search, mode: 'insensitive' } },
        { slug: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.formType) {
      where.formType = query.formType;
    }
    if (query.workspaceId) {
      where.workspaceId = query.workspaceId;
    }

    const [total, forms] = await Promise.all([
      this.db.webForm.count({ where }),
      this.db.webForm.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          defaultSource: { select: { id: true, name: true, code: true, type: true } },
          _count: {
            select: { submissions: true, leads: true },
          },
        },
      }),
    ]);

    return createPaginatedResponse(forms, total, page, limit);
  }

  async findOne(id: string) {
    const form = await this.db.webForm.findUnique({
      where: { id },
      include: {
        defaultSource: true,
        _count: {
          select: { submissions: true, leads: true },
        },
      },
    });

    if (!form) {
      throw new NotFoundException(`Web form with ID '${id}' not found`);
    }

    const publicUrl = `/api/lead-generation/forms/public/${form.slug}`;
    const embedSnippet = `<iframe src="${publicUrl}" width="100%" height="600" frameborder="0" style="border:none;border-radius:8px;"></iframe>`;

    return {
      ...form,
      publicUrl,
      embedSnippet,
    };
  }

  async update(id: string, dto: UpdateWebFormDto) {
    await this.findOne(id);

    if (dto.slug) {
      const slug = this.generateSlug(dto.slug);
      const existing = await this.db.webForm.findFirst({
        where: { slug, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException(`Web form with slug '${slug}' already exists`);
      }
      dto.slug = slug;
    }

    const isPublished = dto.status === FormStatus.PUBLISHED;

    return this.db.webForm.update({
      where: { id },
      data: {
        ...dto,
        fields: dto.fields ? (dto.fields as any) : undefined,
        styling: dto.styling ? (dto.styling as any) : undefined,
        settings: dto.settings ? (dto.settings as any) : undefined,
        isPublished: dto.status ? isPublished : undefined,
        publishedAt: isPublished ? new Date() : undefined,
      },
      include: {
        defaultSource: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.db.webForm.delete({ where: { id } });
    return { message: `Web form with ID '${id}' successfully deleted` };
  }

  // ==========================================
  // PUBLISHING
  // ==========================================

  async publish(id: string) {
    const form = await this.findOne(id);

    const updated = await this.db.webForm.update({
      where: { id },
      data: {
        status: FormStatus.PUBLISHED,
        isPublished: true,
        publishedAt: new Date(),
      },
      include: { defaultSource: true },
    });

    const publicUrl = `/api/lead-generation/forms/public/${form.slug}`;
    const embedSnippet = `<iframe src="${publicUrl}" width="100%" height="650" frameborder="0" style="border:none;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.1);"></iframe>`;

    return {
      message: `Form '${form.name}' published successfully`,
      form: updated,
      publicUrl,
      embedSnippet,
    };
  }

  async unpublish(id: string) {
    await this.findOne(id);

    const updated = await this.db.webForm.update({
      where: { id },
      data: {
        status: FormStatus.ARCHIVED,
        isPublished: false,
      },
    });

    return {
      message: `Form '${updated.name}' unpublished/archived successfully`,
      form: updated,
    };
  }

  // ==========================================
  // PUBLIC FORM ACCESS & SUBMISSION
  // ==========================================

  /**
   * Public retrieval of published form schema for web rendering.
   */
  async getPublicForm(slug: string) {
    const form = await this.db.webForm.findUnique({
      where: { slug },
      include: { defaultSource: { select: { id: true, name: true, type: true } } },
    });

    if (!form || !form.isPublished) {
      throw new NotFoundException(`Published form with slug '${slug}' was not found or is currently inactive`);
    }

    // Increment view count asynchronously
    await this.db.webForm.update({
      where: { id: form.id },
      data: { viewsCount: { increment: 1 } },
    });

    return {
      id: form.id,
      name: form.name,
      slug: form.slug,
      title: form.title,
      description: form.description,
      formType: form.formType,
      fields: form.fields,
      styling: form.styling,
      settings: {
        buttonText: (form.styling as any)?.buttonText || 'Submit',
        theme: (form.styling as any)?.theme || 'light',
      },
    };
  }

  /**
   * Public lead form submission with spam validation, lead score calculation, qualification, and routing.
   */
  async submitPublicForm(
    slug: string,
    dto: PublicFormSubmitDto,
    meta: { ipAddress?: string; userAgent?: string; referer?: string },
  ) {
    const form = await this.db.webForm.findUnique({
      where: { slug },
      include: { defaultSource: true },
    });

    if (!form || !form.isPublished) {
      throw new NotFoundException(`Form '${slug}' is not published or does not exist`);
    }

    const email = dto.email.trim().toLowerCase();
    const settings = (form.settings as any) || {};

    // 1. SPAM VALIDATION
    let isSpam = false;
    let spamScore = 0.0;
    const spamReasons: string[] = [];

    // Honeypot check: Bots fill hidden field _hp_trap
    if (dto._hp_trap && dto._hp_trap.trim().length > 0) {
      isSpam = true;
      spamScore = 1.0;
      spamReasons.push('Honeypot trap triggered');
    }

    // Disposable email check
    const emailDomain = email.split('@')[1] || '';
    if (DISPOSABLE_EMAIL_DOMAINS.has(emailDomain)) {
      spamScore += 0.8;
      spamReasons.push(`Disposable email provider detected: ${emailDomain}`);
      if (spamScore >= 0.8) {
        isSpam = true;
      }
    }

    // If marked as spam, record submission as SPAM and silently return success to deceive bot
    if (isSpam) {
      const spamSubmission = await this.db.formSubmission.create({
        data: {
          id: crypto.randomUUID(),
          formId: form.id,
          payload: { ...dto, spamReasons } as any,
          status: 'SPAM',
          isSpam: true,
          spamScore,
          errorMessage: spamReasons.join('; '),
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
          referer: meta.referer || dto.referrer,
          workspaceId: form.workspaceId,
        },
      });

      return {
        success: true,
        message: settings.successMessage || 'Thank you! Your submission has been received.',
        submissionId: spamSubmission.id,
      };
    }

    // 2. DUPLICATE HANDLING & LEAD MANAGEMENT (MODULE 06 INTEGRATION)
    const duplicateHandling = settings.duplicateHandling || 'UPDATE';
    let lead: any = await this.db.lead.findFirst({
      where: { email },
    });

    let isDuplicate = false;
    const leadTitle = dto.title || `${dto.firstName} ${dto.lastName || ''} - ${form.name}`.trim();
    const channel = form.formType === FormType.LANDING_PAGE ? 'LANDING_PAGE' : 'WEBSITE';

    const attribution = {
      utmSource: dto.utmSource || form.defaultSource?.utmSource || 'website',
      utmMedium: dto.utmMedium || form.defaultSource?.utmMedium || 'form',
      utmCampaign: dto.utmCampaign || form.campaignName || null,
      utmContent: dto.utmContent || null,
      utmTerm: dto.utmTerm || null,
      referrer: dto.referrer || meta.referer || null,
      ipAddress: meta.ipAddress || null,
      userAgent: meta.userAgent || null,
      formSlug: form.slug,
      formName: form.name,
      submittedAt: new Date().toISOString(),
    };

    if (lead) {
      isDuplicate = true;

      if (duplicateHandling === 'REJECT') {
        throw new BadRequestException('A lead with this email address has already been submitted');
      }

      if (duplicateHandling === 'MERGE') {
        // Append note and preserve original lead
        await this.db.note.create({
          data: {
            id: crypto.randomUUID(),
            title: `Form Resubmission: ${form.name}`,
            content: `Lead resubmitted form '${form.name}'. Details:\nPhone: ${dto.phone || 'N/A'}\nCompany: ${dto.companyName || 'N/A'}\nMessage: ${dto.message || 'N/A'}`,
            leadId: lead.id,
          },
        });

        // Update attribution
        lead = await this.db.lead.update({
          where: { id: lead.id },
          data: {
            webFormId: form.id,
            attribution: attribution as any,
          },
        });
      } else {
        // 'UPDATE' mode (default)
        lead = await this.db.lead.update({
          where: { id: lead.id },
          data: {
            firstName: dto.firstName,
            lastName: dto.lastName || lead.lastName,
            phone: dto.phone || lead.phone,
            companyName: dto.companyName || lead.companyName,
            estimatedValue: dto.estimatedValue !== undefined ? dto.estimatedValue : lead.estimatedValue,
            webFormId: form.id,
            leadSourceId: form.defaultSourceId || lead.leadSourceId,
            campaign: dto.utmCampaign || form.campaignName || lead.campaign,
            medium: dto.utmMedium || lead.medium,
            channel: channel || lead.channel,
            attribution: attribution as any,
          },
        });
      }
    } else {
      // Create new Lead in Module 06
      lead = await this.db.lead.create({
        data: {
          id: crypto.randomUUID(),
          title: leadTitle,
          firstName: dto.firstName,
          lastName: dto.lastName || '',
          email,
          phone: dto.phone,
          companyName: dto.companyName,
          status: 'NEW',
          source: form.defaultSource?.type || 'WEBSITE',
          estimatedValue: dto.estimatedValue || 0.0,
          webFormId: form.id,
          leadSourceId: form.defaultSourceId,
          campaign: dto.utmCampaign || form.campaignName,
          medium: dto.utmMedium,
          channel,
          attribution: attribution as any,
          ownerId: form.defaultOwnerId || null,
          workspaceId: form.workspaceId,
        },
      });

      // Add message as a note if provided
      if (dto.message) {
        await this.db.note.create({
          data: {
            id: crypto.randomUUID(),
            title: `Form Inquiry: ${form.name}`,
            content: dto.message,
            leadId: lead.id,
          },
        });
      }
    }

    // 3. EXECUTE SCORING RULES
    if (settings.autoScore !== false) {
      try {
        await this.scoringService.calculateAndApply(lead.id);
      } catch {
        // Non-blocking
      }
    }

    // 4. EXECUTE QUALIFICATION RULES
    if (settings.autoQualify !== false) {
      try {
        await this.qualificationService.evaluateAndApply(lead.id);
      } catch {
        // Non-blocking
      }
    }

    // 5. EXECUTE ROUTING RULES
    if (settings.autoRoute !== false && !lead.ownerId) {
      try {
        await this.routingService.routeLead(lead.id);
      } catch {
        // Non-blocking
      }
    }

    // 6. RECORD FORM SUBMISSION
    const submission = await this.db.formSubmission.create({
      data: {
        id: crypto.randomUUID(),
        formId: form.id,
        leadId: lead.id,
        leadSourceId: form.defaultSourceId,
        payload: {
          ...dto,
          isDuplicate,
          customFields: dto.customFields || {},
        } as any,
        status: isDuplicate ? 'DUPLICATE' : 'PROCESSED',
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        referer: meta.referer || dto.referrer,
        spamScore: 0.0,
        isSpam: false,
        workspaceId: form.workspaceId,
      },
    });

    // 7. UPDATE FORM STATS
    const newSubmissionsCount = form.submissionsCount + 1;
    const views = Math.max(form.viewsCount, newSubmissionsCount);
    const newConversionRate = views > 0 ? Number(((newSubmissionsCount / views) * 100).toFixed(2)) : 0.0;

    await this.db.webForm.update({
      where: { id: form.id },
      data: {
        submissionsCount: newSubmissionsCount,
        viewsCount: views,
        conversionRate: newConversionRate,
      },
    });

    return {
      success: true,
      message: settings.successMessage || 'Thank you! Your submission has been received.',
      redirectUrl: settings.redirectUrl || null,
      leadId: lead.id,
      submissionId: submission.id,
      isDuplicate,
    };
  }

  // ==========================================
  // SUBMISSIONS MANAGEMENT
  // ==========================================

  async findAllSubmissions(query: SubmissionQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Number(query.limit) || 20);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.formId) {
      where.formId = query.formId;
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.isSpam !== undefined) {
      where.isSpam = query.isSpam;
    }
    if (query.workspaceId) {
      where.workspaceId = query.workspaceId;
    }

    const [total, submissions] = await Promise.all([
      this.db.formSubmission.count({ where }),
      this.db.formSubmission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { submittedAt: 'desc' },
        include: {
          form: { select: { id: true, name: true, slug: true, formType: true } },
          lead: { select: { id: true, title: true, email: true, status: true, leadScore: true } },
          leadSource: { select: { id: true, name: true, code: true } },
        },
      }),
    ]);

    return createPaginatedResponse(submissions, total, page, limit);
  }

  async findSubmissionById(id: string) {
    const submission = await this.db.formSubmission.findUnique({
      where: { id },
      include: {
        form: true,
        lead: {
          include: {
            owner: { select: { id: true, name: true, email: true } },
          },
        },
        leadSource: true,
      },
    });

    if (!submission) {
      throw new NotFoundException(`Form submission with ID '${id}' not found`);
    }

    return submission;
  }

  async markSubmissionSpam(id: string, isSpam: boolean) {
    await this.findSubmissionById(id);

    return this.db.formSubmission.update({
      where: { id },
      data: {
        isSpam,
        status: isSpam ? 'SPAM' : 'PROCESSED',
        spamScore: isSpam ? 1.0 : 0.0,
      },
    });
  }

  async reprocessSubmission(id: string) {
    const sub = await this.findSubmissionById(id);
    const payload = sub.payload as any;

    if (!payload?.email) {
      throw new BadRequestException('Submission payload has no email to reprocess');
    }

    const res = await this.submitPublicForm(
      sub.form.slug,
      {
        firstName: payload.firstName || 'Lead',
        lastName: payload.lastName || '',
        email: payload.email,
        phone: payload.phone,
        companyName: payload.companyName,
        jobTitle: payload.jobTitle,
        estimatedValue: payload.estimatedValue,
        message: payload.message,
      },
      {
        ipAddress: sub.ipAddress || undefined,
        userAgent: sub.userAgent || undefined,
        referer: sub.referer || undefined,
      },
    );

    return {
      message: 'Submission reprocessed successfully',
      result: res,
    };
  }
}
