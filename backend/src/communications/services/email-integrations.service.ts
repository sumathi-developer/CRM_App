import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateEmailIntegrationDto } from '../dto/create-email-integration.dto';
import { UpdateEmailIntegrationDto } from '../dto/update-email-integration.dto';
import { EmailIntegrationQueryDto } from '../dto/email-integration-query.dto';
import { IntegrationWebhookDto, EmailWebhookEventType } from '../dto/integration-webhook.dto';
import { CredentialMasker } from '../utils/credential-masker.util';
import { EmailProviderFactory } from '../providers/email-provider.factory';
import { createPaginatedResponse } from '../../common/utils/response.util';

@Injectable()
export class EmailIntegrationsService {
  private readonly logger = new Logger(EmailIntegrationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly providerFactory: EmailProviderFactory,
  ) {}

  private get db(): any {
    return this.prisma;
  }

  async findAll(query: EmailIntegrationQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.provider) {
      where.provider = query.provider;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query.workspaceId) {
      where.workspaceId = query.workspaceId;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { fromEmail: { contains: query.search, mode: 'insensitive' } },
        { host: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [total, integrations] = await Promise.all([
      this.db.emailIntegration.count({ where }),
      this.db.emailIntegration.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

    // Sanitize credentials from all records
    const sanitized = integrations.map((item: any) =>
      CredentialMasker.sanitizeIntegration(item),
    );

    return createPaginatedResponse(sanitized, total, page, limit);
  }

  async findOne(id: string) {
    const integration = await this.db.emailIntegration.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!integration) {
      throw new NotFoundException(`Email integration with ID ${id} not found`);
    }

    return CredentialMasker.sanitizeIntegration(integration);
  }

  async create(dto: CreateEmailIntegrationDto, currentUserId?: string) {
    // If marked as default, unset any existing default in workspace
    if (dto.isDefault) {
      await this.unsetDefaultInWorkspace(dto.workspaceId);
    }

    // Encrypt sensitive secrets before persisting
    const encryptedPassword = dto.password ? CredentialMasker.encrypt(dto.password) : null;
    const encryptedApiKey = dto.apiKey ? CredentialMasker.encrypt(dto.apiKey) : null;

    const record = await this.db.emailIntegration.create({
      data: {
        provider: dto.provider,
        name: dto.name,
        fromEmail: dto.fromEmail,
        fromName: dto.fromName,
        host: dto.host,
        port: dto.port,
        secure: dto.secure ?? true,
        username: dto.username,
        encryptedPassword,
        encryptedApiKey,
        isDefault: dto.isDefault ?? false,
        isActive: dto.isActive ?? true,
        workspaceId: dto.workspaceId,
        createdById: currentUserId,
        settings: dto.settings || {},
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    return CredentialMasker.sanitizeIntegration(record);
  }

  async update(id: string, dto: UpdateEmailIntegrationDto) {
    const existing = await this.db.emailIntegration.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Email integration with ID ${id} not found`);
    }

    if (dto.isDefault) {
      await this.unsetDefaultInWorkspace(dto.workspaceId || existing.workspaceId);
    }

    const data: any = {
      ...dto,
    };

    // Re-encrypt password if provided
    if (dto.password) {
      data.encryptedPassword = CredentialMasker.encrypt(dto.password);
      delete data.password;
    }

    // Re-encrypt apiKey if provided
    if (dto.apiKey) {
      data.encryptedApiKey = CredentialMasker.encrypt(dto.apiKey);
      delete data.apiKey;
    }

    const updated = await this.db.emailIntegration.update({
      where: { id },
      data,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    return CredentialMasker.sanitizeIntegration(updated);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.db.emailIntegration.delete({ where: { id } });
    return { message: `Email integration ${id} successfully removed` };
  }

  async setDefault(id: string) {
    const existing = await this.db.emailIntegration.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Email integration with ID ${id} not found`);
    }

    await this.unsetDefaultInWorkspace(existing.workspaceId);

    const updated = await this.db.emailIntegration.update({
      where: { id },
      data: { isDefault: true },
    });

    return CredentialMasker.sanitizeIntegration(updated);
  }

  async testConnection(id: string) {
    const raw = await this.db.emailIntegration.findUnique({ where: { id } });
    if (!raw) {
      throw new NotFoundException(`Email integration with ID ${id} not found`);
    }

    const provider = this.providerFactory.createProvider(raw);
    return provider.testConnection();
  }

  /**
   * Internal lookup to get the active provider configuration for sending emails.
   */
  async resolveActiveIntegration(integrationId?: string, workspaceId?: string) {
    if (integrationId) {
      const specific = await this.db.emailIntegration.findUnique({
        where: { id: integrationId },
      });
      if (specific && specific.isActive) {
        return specific;
      }
    }

    // Look for default integration in workspace
    const where: any = { isActive: true, isDefault: true };
    if (workspaceId) {
      where.workspaceId = workspaceId;
    }

    let defaultIntegration = await this.db.emailIntegration.findFirst({ where });

    // Fallback: any active integration
    if (!defaultIntegration) {
      defaultIntegration = await this.db.emailIntegration.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      });
    }

    return defaultIntegration;
  }

  /**
   * Handle webhook events (delivered, opened, bounced, etc.)
   */
  async handleWebhook(dto: IntegrationWebhookDto) {
    this.logger.log(`[Email Webhook] Processing event "${dto.event}" for messageId "${dto.messageId}"`);

    const email = await this.db.emailMessage.findFirst({
      where: {
        OR: [
          { messageId: dto.messageId },
          { providerMessageId: dto.messageId },
          { id: dto.messageId },
        ],
      },
    });

    if (!email) {
      this.logger.warn(`[Email Webhook] No matching email found for messageId: ${dto.messageId}`);
      return { success: false, message: 'No matching email message found' };
    }

    const updateData: any = {};

    switch (dto.event) {
      case EmailWebhookEventType.DELIVERED:
        updateData.status = 'DELIVERED';
        break;
      case EmailWebhookEventType.OPENED:
        updateData.status = 'OPENED';
        updateData.openCount = { increment: 1 };
        break;
      case EmailWebhookEventType.CLICKED:
        updateData.status = 'CLICKED';
        updateData.clickCount = { increment: 1 };
        break;
      case EmailWebhookEventType.BOUNCED:
      case EmailWebhookEventType.DROPPED:
        updateData.status = 'BOUNCED';
        updateData.errorMessage = dto.reason || 'Message bounced';
        break;
      case EmailWebhookEventType.SPAM_REPORT:
        updateData.folder = 'SPAM';
        break;
    }

    if (Object.keys(updateData).length > 0) {
      await this.db.emailMessage.update({
        where: { id: email.id },
        data: updateData,
      });
    }

    return {
      success: true,
      emailId: email.id,
      event: dto.event,
      status: updateData.status || email.status,
    };
  }

  private async unsetDefaultInWorkspace(workspaceId?: string | null) {
    const where: any = { isDefault: true };
    if (workspaceId) {
      where.workspaceId = workspaceId;
    }
    await this.db.emailIntegration.updateMany({
      where,
      data: { isDefault: false },
    });
  }
}
