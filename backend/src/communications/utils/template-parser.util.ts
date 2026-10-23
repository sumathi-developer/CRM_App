/**
 * Utility for parsing and interpolating template variables.
 * Supports patterns like:
 * {{contact.firstName}}
 * {{deal.title}}
 * {{contact.firstName | Valued Customer}} (with fallback default)
 */

export interface TemplateContext {
  contact?: Record<string, any> | null;
  lead?: Record<string, any> | null;
  deal?: Record<string, any> | null;
  company?: Record<string, any> | null;
  organization?: Record<string, any> | null;
  user?: Record<string, any> | null;
  workspace?: Record<string, any> | null;
  custom?: Record<string, any> | null;
  [key: string]: any;
}

export class TemplateParser {
  private static readonly VARIABLE_REGEX = /\{\{\s*([a-zA-Z0-9_.]+)(?:\s*\|\s*([^}]+))?\s*\}\}/g;

  /**
   * Extract all variable placeholders from a template string.
   */
  static extractVariables(text: string): string[] {
    if (!text) return [];
    const variables = new Set<string>();
    let match: RegExpExecArray | null;
    const regex = new RegExp(this.VARIABLE_REGEX);

    while ((match = regex.exec(text)) !== null) {
      if (match[1]) {
        variables.add(match[1].trim());
      }
    }

    return Array.from(variables);
  }

  /**
   * Resolve a dot-notated path in an object (e.g. "contact.firstName")
   */
  private static resolvePath(obj: any, path: string): any {
    if (!obj || !path) return undefined;
    const parts = path.split('.');
    let current = obj;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[part];
    }

    return current;
  }

  /**
   * Replace all placeholders with actual values from context.
   */
  static interpolate(template: string, context: TemplateContext): string {
    if (!template) return '';

    return template.replace(this.VARIABLE_REGEX, (_match, tokenPath, fallback) => {
      const trimmedToken = tokenPath.trim();
      const trimmedFallback = fallback ? fallback.trim() : '';

      // Direct lookup in context (e.g. context['contact.firstName'])
      if (context[trimmedToken] !== undefined && context[trimmedToken] !== null) {
        return String(context[trimmedToken]);
      }

      // Nested dot notation resolution (e.g. context.contact.firstName)
      const resolved = this.resolvePath(context, trimmedToken);
      if (resolved !== undefined && resolved !== null) {
        return String(resolved);
      }

      // Check alias for company/organization
      if (trimmedToken.startsWith('company.') && context.organization) {
        const subPath = trimmedToken.replace('company.', 'organization.');
        const orgResolved = this.resolvePath(context, subPath);
        if (orgResolved !== undefined && orgResolved !== null) {
          return String(orgResolved);
        }
      }

      return trimmedFallback || '';
    });
  }

  /**
   * Build a structured context dictionary from CRM entities.
   */
  static buildContext(params: {
    contact?: any;
    lead?: any;
    deal?: any;
    organization?: any;
    user?: any;
    workspace?: any;
    customVariables?: Record<string, any>;
  }): TemplateContext {
    const context: TemplateContext = {
      contact: params.contact ? {
        id: params.contact.id,
        firstName: params.contact.firstName || '',
        lastName: params.contact.lastName || '',
        name: `${params.contact.firstName || ''} ${params.contact.lastName || ''}`.trim(),
        email: params.contact.email || '',
        phone: params.contact.phone || '',
        jobTitle: params.contact.jobTitle || '',
        department: params.contact.department || '',
        stage: params.contact.stage || '',
      } : null,

      lead: params.lead ? {
        id: params.lead.id,
        title: params.lead.title || '',
        firstName: params.lead.firstName || '',
        lastName: params.lead.lastName || '',
        name: `${params.lead.firstName || ''} ${params.lead.lastName || ''}`.trim(),
        email: params.lead.email || '',
        phone: params.lead.phone || '',
        companyName: params.lead.companyName || '',
        status: params.lead.status || '',
        source: params.lead.source || '',
        score: params.lead.leadScore || 0,
        estimatedValue: params.lead.estimatedValue || 0,
      } : null,

      deal: params.deal ? {
        id: params.deal.id,
        title: params.deal.title || '',
        value: params.deal.value !== undefined ? params.deal.value : 0,
        currency: params.deal.currency || 'USD',
        status: params.deal.status || '',
        probability: params.deal.probability || 0,
      } : null,

      company: params.organization ? {
        id: params.organization.id,
        name: params.organization.name || '',
        domain: params.organization.domain || '',
        industry: params.organization.industry || '',
        website: params.organization.website || '',
        phone: params.organization.phone || '',
        address: params.organization.address || '',
        city: params.organization.city || '',
        country: params.organization.country || '',
      } : null,

      organization: params.organization ? {
        id: params.organization.id,
        name: params.organization.name || '',
        domain: params.organization.domain || '',
        industry: params.organization.industry || '',
        website: params.organization.website || '',
        phone: params.organization.phone || '',
        address: params.organization.address || '',
        city: params.organization.city || '',
        country: params.organization.country || '',
      } : null,

      user: params.user ? {
        id: params.user.id,
        name: params.user.name || '',
        email: params.user.email || '',
        phone: params.user.phone || '',
      } : null,

      workspace: params.workspace ? {
        id: params.workspace.id,
        name: params.workspace.name || '',
        timezone: params.workspace.timezone || 'UTC',
        currency: params.workspace.currency || 'USD',
      } : null,

      custom: params.customVariables || {},
    };

    // Flatten custom variables if provided
    if (params.customVariables) {
      for (const [key, val] of Object.entries(params.customVariables)) {
        context[key] = val;
      }
    }

    return context;
  }

  /**
   * Catalog of all system-supported template variables.
   */
  static getAvailableVariablesCatalog() {
    return [
      {
        category: 'Contact',
        variables: [
          { token: 'contact.firstName', description: 'Contact first name' },
          { token: 'contact.lastName', description: 'Contact last name' },
          { token: 'contact.name', description: 'Full name' },
          { token: 'contact.email', description: 'Email address' },
          { token: 'contact.phone', description: 'Phone number' },
          { token: 'contact.jobTitle', description: 'Job designation' },
          { token: 'contact.department', description: 'Department' },
        ],
      },
      {
        category: 'Lead',
        variables: [
          { token: 'lead.firstName', description: 'Lead first name' },
          { token: 'lead.lastName', description: 'Lead last name' },
          { token: 'lead.name', description: 'Lead full name' },
          { token: 'lead.title', description: 'Lead title' },
          { token: 'lead.email', description: 'Lead email address' },
          { token: 'lead.companyName', description: 'Company name' },
          { token: 'lead.source', description: 'Source channel' },
          { token: 'lead.estimatedValue', description: 'Estimated value' },
        ],
      },
      {
        category: 'Deal',
        variables: [
          { token: 'deal.title', description: 'Deal title' },
          { token: 'deal.value', description: 'Deal monetary value' },
          { token: 'deal.currency', description: 'Currency code (USD, EUR)' },
          { token: 'deal.status', description: 'Deal stage status' },
          { token: 'deal.probability', description: 'Win probability percentage' },
        ],
      },
      {
        category: 'Company / Organization',
        variables: [
          { token: 'company.name', description: 'Company name' },
          { token: 'company.domain', description: 'Company web domain' },
          { token: 'company.industry', description: 'Industry' },
          { token: 'company.phone', description: 'Phone' },
          { token: 'company.website', description: 'Website URL' },
        ],
      },
      {
        category: 'Sender (User)',
        variables: [
          { token: 'user.name', description: 'Agent / Sender full name' },
          { token: 'user.email', description: 'Agent email address' },
          { token: 'user.phone', description: 'Agent phone number' },
        ],
      },
      {
        category: 'Workspace',
        variables: [
          { token: 'workspace.name', description: 'Workspace brand name' },
          { token: 'workspace.currency', description: 'Workspace default currency' },
        ],
      },
    ];
  }
}
