import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { TagQueryDto } from './dto/tag-query.dto';
import { AttachTagsDto } from './dto/attach-tags.dto';
import { DetachTagsDto } from './dto/detach-tags.dto';
import { BulkTagAssignDto } from './dto/bulk-tag-assign.dto';
import { BulkTagDetachDto } from './dto/bulk-tag-detach.dto';
import { TagStatus } from './enums/tag-status.enum';
import { TagEntityType, normalizeTagEntityType } from './enums/tag-entity-type.enum';
import { TagUsageDetail, TagUsageSummary } from './interfaces/tag-usage.interface';

@Injectable()
export class TagsService {
  private readonly logger = new Logger(TagsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper to normalize tag name (trimmed)
   */
  private normalizeTagName(name: string): string {
    return name.trim();
  }

  /**
   * Helper to verify target CRM entity existence in the database
   */
  async verifyEntityExists(
    entityType: TagEntityType,
    entityId: string,
  ): Promise<{ id: string; name: string }> {
    let entity: { id: string; name: string } | null = null;

    switch (entityType) {
      case TagEntityType.LEAD: {
        const lead = await this.prisma.lead.findUnique({
          where: { id: entityId },
          select: { id: true, title: true, firstName: true, lastName: true },
        });
        if (lead) {
          entity = {
            id: lead.id,
            name: lead.title || `${lead.firstName} ${lead.lastName}`.trim(),
          };
        }
        break;
      }

      case TagEntityType.CONTACT: {
        const contact = await this.prisma.contact.findUnique({
          where: { id: entityId },
          select: { id: true, firstName: true, lastName: true },
        });
        if (contact) {
          entity = {
            id: contact.id,
            name: `${contact.firstName} ${contact.lastName}`.trim(),
          };
        }
        break;
      }

      case TagEntityType.COMPANY: {
        const company = await this.prisma.organization.findUnique({
          where: { id: entityId },
          select: { id: true, name: true },
        });
        if (company) {
          entity = { id: company.id, name: company.name };
        }
        break;
      }

      case TagEntityType.DEAL: {
        const deal = await this.prisma.deal.findUnique({
          where: { id: entityId },
          select: { id: true, title: true },
        });
        if (deal) {
          entity = { id: deal.id, name: deal.title };
        }
        break;
      }

      case TagEntityType.ACTIVITY: {
        const activity = await this.prisma.activity.findUnique({
          where: { id: entityId },
          select: { id: true, subject: true },
        });
        if (activity) {
          entity = { id: activity.id, name: activity.subject };
        }
        break;
      }

      case TagEntityType.DOCUMENT: {
        const document = await this.prisma.fileRecord.findUnique({
          where: { id: entityId },
          select: { id: true, originalName: true, fileName: true },
        });
        if (document) {
          entity = {
            id: document.id,
            name: document.originalName || document.fileName,
          };
        }
        break;
      }

      default:
        throw new BadRequestException(`Unsupported entity type: ${entityType}`);
    }

    if (!entity) {
      throw new NotFoundException(
        `${entityType} with ID "${entityId}" does not exist in the database`,
      );
    }

    return entity;
  }

  // ==========================================
  // Tag CRUD & Workspace Uniqueness
  // ==========================================

  /**
   * Create a new Tag (Workspace-specific, unique name per workspace)
   */
  async create(createTagDto: CreateTagDto, currentUser?: any) {
    const normalizedName = this.normalizeTagName(createTagDto.name);

    if (!normalizedName) {
      throw new BadRequestException('Tag name cannot be empty');
    }

    const workspaceId = createTagDto.workspaceId ?? currentUser?.activeWorkspaceId ?? null;

    // Check tag name uniqueness within the target workspace
    const existingTag = await this.prisma.tag.findFirst({
      where: {
        name: { equals: normalizedName, mode: 'insensitive' },
        workspaceId: workspaceId ?? null,
      },
    });

    if (existingTag) {
      throw new ConflictException(
        `Tag with name "${normalizedName}" already exists in this workspace`,
      );
    }

    const tag = await this.prisma.tag.create({
      data: {
        name: normalizedName,
        color: createTagDto.color ?? '#3b82f6',
        description: createTagDto.description,
        status: createTagDto.status ?? TagStatus.ACTIVE,
        isProtected: createTagDto.isProtected ?? false,
        workspaceId,
        createdById: currentUser?.id ?? null,
      },
      include: {
        _count: {
          select: { assignments: true },
        },
      },
    });

    this.logger.log(`Created tag "${tag.name}" (${tag.id}) in workspace: ${workspaceId ?? 'global'}`);

    return {
      ...tag,
      usageCount: tag._count.assignments,
    };
  }

  /**
   * List all tags with search, filtering, and pagination
   */
  async findAll(query: TagQueryDto, currentUser?: any) {
    const {
      search,
      q,
      status,
      workspaceId,
      entityType,
      isProtected,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const searchTerm = (search || q)?.trim();
    const targetWorkspaceId = workspaceId ?? currentUser?.activeWorkspaceId;

    const where: any = {};

    if (targetWorkspaceId) {
      where.workspaceId = targetWorkspaceId;
    }

    if (status) {
      where.status = status;
    }

    if (isProtected !== undefined) {
      where.isProtected = isProtected;
    }

    if (searchTerm) {
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    if (entityType) {
      const normalizedEntity = normalizeTagEntityType(entityType);
      where.assignments = {
        some: {
          entityType: normalizedEntity,
        },
      };
    }

    const skip = (page - 1) * limit;

    let orderBy: any;
    if (sortBy === 'usageCount') {
      orderBy = {
        assignments: {
          _count: sortOrder,
        },
      };
    } else {
      orderBy = {
        [sortBy]: sortOrder,
      };
    }

    const [tags, total] = await Promise.all([
      this.prisma.tag.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          _count: {
            select: { assignments: true },
          },
        },
      }),
      this.prisma.tag.count({ where }),
    ]);

    const formattedData = tags.map((t) => ({
      id: t.id,
      name: t.name,
      color: t.color,
      description: t.description,
      status: t.status,
      isProtected: t.isProtected,
      workspaceId: t.workspaceId,
      createdById: t.createdById,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      usageCount: t._count.assignments,
    }));

    return {
      data: formattedData,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Get tag by ID with usage count
   */
  async findOne(id: string, workspaceId?: string) {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
      include: {
        _count: {
          select: { assignments: true },
        },
      },
    });

    if (!tag) {
      throw new NotFoundException(`Tag with ID "${id}" not found`);
    }

    if (workspaceId && tag.workspaceId && tag.workspaceId !== workspaceId) {
      throw new NotFoundException(`Tag with ID "${id}" not found in this workspace`);
    }

    return {
      ...tag,
      usageCount: tag._count.assignments,
    };
  }

  /**
   * Edit / Update Tag (validates uniqueness if name changed)
   */
  async update(id: string, updateTagDto: UpdateTagDto, _currentUser?: any) {
    const existing = await this.prisma.tag.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Tag with ID "${id}" not found`);
    }

    const dataToUpdate: any = {};

    if (updateTagDto.name !== undefined) {
      const normalizedName = this.normalizeTagName(updateTagDto.name);
      if (!normalizedName) {
        throw new BadRequestException('Tag name cannot be empty');
      }

      const targetWorkspaceId =
        updateTagDto.workspaceId !== undefined ? updateTagDto.workspaceId : existing.workspaceId;

      // Check name uniqueness if name or workspace changed
      if (
        normalizedName.toLowerCase() !== existing.name.toLowerCase() ||
        targetWorkspaceId !== existing.workspaceId
      ) {
        const conflict = await this.prisma.tag.findFirst({
          where: {
            id: { not: id },
            name: { equals: normalizedName, mode: 'insensitive' },
            workspaceId: targetWorkspaceId ?? null,
          },
        });

        if (conflict) {
          throw new ConflictException(
            `Tag with name "${normalizedName}" already exists in this workspace`,
          );
        }
      }

      dataToUpdate.name = normalizedName;
    }

    if (updateTagDto.color !== undefined) {
      dataToUpdate.color = updateTagDto.color;
    }

    if (updateTagDto.description !== undefined) {
      dataToUpdate.description = updateTagDto.description;
    }

    if (updateTagDto.status !== undefined) {
      dataToUpdate.status = updateTagDto.status;
    }

    if (updateTagDto.isProtected !== undefined) {
      dataToUpdate.isProtected = updateTagDto.isProtected;
    }

    if (updateTagDto.workspaceId !== undefined) {
      dataToUpdate.workspaceId = updateTagDto.workspaceId;
    }

    const updated = await this.prisma.tag.update({
      where: { id },
      data: dataToUpdate,
      include: {
        _count: {
          select: { assignments: true },
        },
      },
    });

    this.logger.log(`Updated tag "${updated.name}" (${updated.id})`);

    return {
      ...updated,
      usageCount: updated._count.assignments,
    };
  }

  /**
   * Delete Tag:
   * - Blocks deletion if isProtected === true
   * - If hardDelete=false (default): soft-deletes/archives tag, preserving existing entity assignments
   * - If hardDelete=true: permanently deletes tag. Requires force=true if tag has active assignments
   */
  async remove(id: string, hardDelete = false, force = false) {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
      include: {
        _count: {
          select: { assignments: true },
        },
      },
    });

    if (!tag) {
      throw new NotFoundException(`Tag with ID "${id}" not found`);
    }

    // Protection check
    if (tag.isProtected) {
      throw new ForbiddenException(
        `Tag "${tag.name}" is protected and cannot be deleted. Unprotect the tag before deleting.`,
      );
    }

    const activeAssignments = tag._count.assignments;

    // Hard delete mode
    if (hardDelete) {
      if (activeAssignments > 0 && !force) {
        throw new BadRequestException(
          `Tag "${tag.name}" is currently attached to ${activeAssignments} CRM entities. Pass force=true to remove all entity associations and delete permanently, or archive the tag instead.`,
        );
      }

      // Safe cascade delete of assignments and tag
      await this.prisma.$transaction([
        this.prisma.tagAssignment.deleteMany({
          where: { tagId: id },
        }),
        this.prisma.tag.delete({
          where: { id },
        }),
      ]);

      this.logger.log(`Hard deleted tag "${tag.name}" (${id}) with ${activeAssignments} detached assignments`);

      return {
        message: 'Tag permanently deleted successfully',
        deletedId: id,
        name: tag.name,
        detachedAssignments: activeAssignments,
      };
    }

    // Soft delete (archive) mode: preserves relationships safely
    const archivedTag = await this.prisma.tag.update({
      where: { id },
      data: { status: TagStatus.ARCHIVED },
      include: {
        _count: {
          select: { assignments: true },
        },
      },
    });

    this.logger.log(`Archived tag "${tag.name}" (${id}), preserving ${activeAssignments} assignments`);

    return {
      message: 'Tag successfully archived',
      tag: {
        ...archivedTag,
        usageCount: archivedTag._count.assignments,
      },
      assignmentsPreserved: activeAssignments,
    };
  }

  // ==========================================
  // Tag Usage Statistics
  // ==========================================

  /**
   * Get detailed usage statistics for a specific tag
   */
  async getTagUsage(id: string): Promise<TagUsageDetail> {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
      include: {
        _count: {
          select: { assignments: true },
        },
      },
    });

    if (!tag) {
      throw new NotFoundException(`Tag with ID "${id}" not found`);
    }

    // Group usage by entity type
    const grouped = await this.prisma.tagAssignment.groupBy({
      by: ['entityType'],
      where: { tagId: id },
      _count: {
        _all: true,
      },
    });

    const breakdown: Record<TagEntityType, number> = {
      [TagEntityType.LEAD]: 0,
      [TagEntityType.CONTACT]: 0,
      [TagEntityType.COMPANY]: 0,
      [TagEntityType.DEAL]: 0,
      [TagEntityType.ACTIVITY]: 0,
      [TagEntityType.DOCUMENT]: 0,
    };

    for (const group of grouped) {
      try {
        const type = normalizeTagEntityType(group.entityType);
        breakdown[type] = group._count._all;
      } catch {
        // ignore unrecognized types if any
      }
    }

    // Fetch up to 10 recent assignments with entity details
    const recentAssignments = await this.prisma.tagAssignment.findMany({
      where: { tagId: id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const recentEntities = await Promise.all(
      recentAssignments.map(async (assignment) => {
        let entityName = 'Unknown';
        try {
          const type = normalizeTagEntityType(assignment.entityType);
          const entity = await this.verifyEntityExists(type, assignment.entityId);
          entityName = entity.name;
        } catch {
          entityName = 'Entity removed or unavailable';
        }

        return {
          assignmentId: assignment.id,
          entityType: assignment.entityType as TagEntityType,
          entityId: assignment.entityId,
          entityName,
          assignedAt: assignment.createdAt,
          assignedById: assignment.assignedById,
        };
      }),
    );

    return {
      tagId: tag.id,
      name: tag.name,
      color: tag.color,
      description: tag.description,
      status: tag.status,
      isProtected: tag.isProtected,
      workspaceId: tag.workspaceId,
      totalUsage: tag._count.assignments,
      breakdown,
      recentEntities,
    };
  }

  /**
   * Get global tag usage summary and metrics
   */
  async getGlobalUsageSummary(workspaceId?: string): Promise<TagUsageSummary> {
    const whereTag: any = {};
    const whereAssignment: any = {};

    if (workspaceId) {
      whereTag.workspaceId = workspaceId;
      whereAssignment.workspaceId = workspaceId;
    }

    const [
      totalTags,
      activeTags,
      inactiveTags,
      archivedTags,
      totalAssignments,
      groupedAssignments,
      topTagsData,
    ] = await Promise.all([
      this.prisma.tag.count({ where: whereTag }),
      this.prisma.tag.count({ where: { ...whereTag, status: TagStatus.ACTIVE } }),
      this.prisma.tag.count({ where: { ...whereTag, status: TagStatus.INACTIVE } }),
      this.prisma.tag.count({ where: { ...whereTag, status: TagStatus.ARCHIVED } }),
      this.prisma.tagAssignment.count({ where: whereAssignment }),
      this.prisma.tagAssignment.groupBy({
        by: ['entityType'],
        where: whereAssignment,
        _count: { _all: true },
      }),
      this.prisma.tag.findMany({
        where: whereTag,
        take: 10,
        orderBy: {
          assignments: {
            _count: 'desc',
          },
        },
        include: {
          _count: {
            select: { assignments: true },
          },
        },
      }),
    ]);

    const assignmentsByEntityType: Record<TagEntityType, number> = {
      [TagEntityType.LEAD]: 0,
      [TagEntityType.CONTACT]: 0,
      [TagEntityType.COMPANY]: 0,
      [TagEntityType.DEAL]: 0,
      [TagEntityType.ACTIVITY]: 0,
      [TagEntityType.DOCUMENT]: 0,
    };

    for (const group of groupedAssignments) {
      try {
        const type = normalizeTagEntityType(group.entityType);
        assignmentsByEntityType[type] = group._count._all;
      } catch {
        // ignore unrecognized types
      }
    }

    const topTags = topTagsData.map((t) => ({
      id: t.id,
      name: t.name,
      color: t.color,
      status: t.status,
      isProtected: t.isProtected,
      usageCount: t._count.assignments,
    }));

    const unusedTagsCount = await this.prisma.tag.count({
      where: {
        ...whereTag,
        assignments: {
          none: {},
        },
      },
    });

    return {
      totalTags,
      activeTags,
      inactiveTags,
      archivedTags,
      totalAssignments,
      assignmentsByEntityType,
      topTags,
      unusedTagsCount,
    };
  }

  // ==========================================
  // Attach / Detach Tags to CRM Entities
  // ==========================================

  /**
   * Get all tags attached to a specific CRM entity
   */
  async getEntityTags(entityTypeInput: string, entityId: string) {
    const entityType = normalizeTagEntityType(entityTypeInput);
    await this.verifyEntityExists(entityType, entityId);

    const assignments = await this.prisma.tagAssignment.findMany({
      where: {
        entityType,
        entityId,
      },
      include: {
        tag: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return assignments.map((a) => ({
      assignmentId: a.id,
      assignedAt: a.createdAt,
      assignedById: a.assignedById,
      ...a.tag,
    }));
  }

  /**
   * Attach tags to a CRM entity (supports both existing tag IDs and on-the-fly tag names)
   */
  async attachTags(
    entityTypeInput: string,
    entityId: string,
    dto: AttachTagsDto,
    currentUser?: any,
  ) {
    const entityType = normalizeTagEntityType(entityTypeInput);
    const entity = await this.verifyEntityExists(entityType, entityId);

    const workspaceId = dto.workspaceId ?? currentUser?.activeWorkspaceId ?? null;
    const resolvedTagIds: string[] = [];

    // 1. Validate provided tag IDs
    if (dto.tagIds && dto.tagIds.length > 0) {
      const existingTags = await this.prisma.tag.findMany({
        where: {
          id: { in: dto.tagIds },
        },
      });

      if (existingTags.length !== dto.tagIds.length) {
        const foundIds = new Set(existingTags.map((t) => t.id));
        const missingIds = dto.tagIds.filter((id) => !foundIds.has(id));
        throw new NotFoundException(`Tag(s) with IDs [${missingIds.join(', ')}] not found`);
      }

      for (const t of existingTags) {
        if (t.status === TagStatus.ARCHIVED) {
          throw new BadRequestException(`Cannot attach archived tag "${t.name}"`);
        }
        resolvedTagIds.push(t.id);
      }
    }

    // 2. Resolve / Create tag names on the fly
    if (dto.tagNames && dto.tagNames.length > 0) {
      for (const rawName of dto.tagNames) {
        const name = this.normalizeTagName(rawName);
        if (!name) continue;

        let tag = await this.prisma.tag.findFirst({
          where: {
            name: { equals: name, mode: 'insensitive' },
            workspaceId: workspaceId ?? null,
          },
        });

        if (!tag) {
          tag = await this.prisma.tag.create({
            data: {
              name,
              workspaceId,
              createdById: currentUser?.id ?? null,
            },
          });
          this.logger.log(`Created new tag "${name}" (${tag.id}) via attachment to ${entityType}`);
        } else if (tag.status === TagStatus.ARCHIVED) {
          // Reactivate archived tag if explicitly re-attached by name
          tag = await this.prisma.tag.update({
            where: { id: tag.id },
            data: { status: TagStatus.ACTIVE },
          });
        }

        resolvedTagIds.push(tag.id);
      }
    }

    const uniqueTagIds = Array.from(new Set(resolvedTagIds));
    if (uniqueTagIds.length === 0) {
      throw new BadRequestException('No valid tags provided to attach');
    }

    // Upsert / Create assignments safely
    await Promise.all(
      uniqueTagIds.map((tagId) =>
        this.prisma.tagAssignment.upsert({
          where: {
            tagId_entityType_entityId: {
              tagId,
              entityType,
              entityId,
            },
          },
          create: {
            tagId,
            entityType,
            entityId,
            workspaceId,
            assignedById: currentUser?.id ?? null,
          },
          update: {},
        }),
      ),
    );

    this.logger.log(
      `Attached ${uniqueTagIds.length} tags to ${entityType} "${entity.name}" (${entityId})`,
    );

    // Return the updated tags attached to this entity
    return this.getEntityTags(entityType, entityId);
  }

  /**
   * Remove a single tag from an entity
   */
  async detachTag(entityTypeInput: string, entityId: string, tagId: string) {
    const entityType = normalizeTagEntityType(entityTypeInput);
    await this.verifyEntityExists(entityType, entityId);

    const assignment = await this.prisma.tagAssignment.findUnique({
      where: {
        tagId_entityType_entityId: {
          tagId,
          entityType,
          entityId,
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException(
        `Tag with ID "${tagId}" is not attached to ${entityType} "${entityId}"`,
      );
    }

    await this.prisma.tagAssignment.delete({
      where: { id: assignment.id },
    });

    return {
      message: 'Tag detached successfully',
      entityType,
      entityId,
      tagId,
    };
  }

  /**
   * Remove multiple tags from an entity
   */
  async detachTags(entityTypeInput: string, entityId: string, dto: DetachTagsDto) {
    const entityType = normalizeTagEntityType(entityTypeInput);
    await this.verifyEntityExists(entityType, entityId);

    const deleteResult = await this.prisma.tagAssignment.deleteMany({
      where: {
        entityType,
        entityId,
        tagId: { in: dto.tagIds },
      },
    });

    return {
      message: `Detached ${deleteResult.count} tag(s) successfully`,
      entityType,
      entityId,
      detachedCount: deleteResult.count,
    };
  }

  /**
   * Bulk assign tags to multiple CRM entities
   */
  async bulkAssign(dto: BulkTagAssignDto, currentUser?: any) {
    const entityType = normalizeTagEntityType(dto.entityType);
    const workspaceId = dto.workspaceId ?? currentUser?.activeWorkspaceId ?? null;

    // Verify tags exist
    const tags = await this.prisma.tag.findMany({
      where: {
        id: { in: dto.tagIds },
      },
    });

    if (tags.length === 0) {
      throw new BadRequestException('None of the specified tagIds were found');
    }

    const validTagIds = tags
      .filter((t) => t.status !== TagStatus.ARCHIVED)
      .map((t) => t.id);

    if (validTagIds.length === 0) {
      throw new BadRequestException('All specified tags are archived');
    }

    // Verify entities and create assignments
    let createdCount = 0;
    for (const entityId of dto.entityIds) {
      try {
        await this.verifyEntityExists(entityType, entityId);
        for (const tagId of validTagIds) {
          await this.prisma.tagAssignment.upsert({
            where: {
              tagId_entityType_entityId: {
                tagId,
                entityType,
                entityId,
              },
            },
            create: {
              tagId,
              entityType,
              entityId,
              workspaceId,
              assignedById: currentUser?.id ?? null,
            },
            update: {},
          });
          createdCount++;
        }
      } catch (err: any) {
        this.logger.warn(`Skipping invalid entityId "${entityId}" during bulk tag assign: ${err?.message || err}`);
      }
    }

    return {
      message: 'Bulk tag assignment completed',
      entityType,
      targetEntitiesCount: dto.entityIds.length,
      assignedTagsCount: validTagIds.length,
      totalOperations: createdCount,
    };
  }

  /**
   * Bulk detach tags from multiple CRM entities
   */
  async bulkDetach(dto: BulkTagDetachDto) {
    const entityType = normalizeTagEntityType(dto.entityType);

    const deleteResult = await this.prisma.tagAssignment.deleteMany({
      where: {
        entityType,
        entityId: { in: dto.entityIds },
        tagId: { in: dto.tagIds },
      },
    });

    return {
      message: 'Bulk tag detachment completed',
      entityType,
      detachedCount: deleteResult.count,
    };
  }
}
