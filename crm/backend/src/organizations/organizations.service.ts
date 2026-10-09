import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../database/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { OrganizationQueryDto } from './dto/organization-query.dto';
import { createPaginatedResponse } from '../common/utils/response.util';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: OrganizationQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { domain: { contains: query.search } },
      ];
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.industry) {
      where.industry = { contains: query.industry };
    }

    const [total, items] = await Promise.all([
      this.prisma.organization.count({ where }),
      this.prisma.organization.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              users: true,
              contacts: true,
              deals: true,
            },
          },
        },
      }),
    ]);

    return createPaginatedResponse(items, total, page, limit);
  }

  async create(dto: CreateOrganizationDto) {
    return this.prisma.organization.create({
      data: {
        name: dto.name,
        domain: dto.domain,
        industry: dto.industry,
        website: dto.website,
        phone: dto.phone,
        address: dto.address,
        city: dto.city,
        country: dto.country,
        status: dto.status || 'ACTIVE',
      },
    });
  }

  async findOne(id: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            status: true,
          },
        },
        contacts: { take: 10 },
        deals: { take: 10 },
        invites: true,
      },
    });

    if (!org) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }

    return org;
  }

  async update(id: string, dto: UpdateOrganizationDto) {
    await this.findOne(id);
    return this.prisma.organization.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.organization.delete({ where: { id } });
    return { message: `Organization with ID ${id} successfully deleted` };
  }

  async getOrganizationUsers(id: string) {
    await this.findOne(id);
    return this.prisma.user.findMany({
      where: { organizationId: id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        status: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async inviteUser(id: string, dto: InviteUserDto) {
    await this.findOne(id);

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000); // 7 days

    const invite = await this.prisma.organizationInvite.create({
      data: {
        organizationId: id,
        email: dto.email.toLowerCase(),
        roleId: dto.roleId,
        token,
        expiresAt,
        status: 'PENDING',
      },
    });

    return {
      message: 'Invitation generated successfully',
      invite,
    };
  }

  async removeUserFromOrganization(id: string, userId: string) {
    await this.findOne(id);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.organizationId !== id) {
      throw new BadRequestException('User is not part of this organization');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { organizationId: null },
    });

    return { message: `User removed from organization successfully` };
  }
}
