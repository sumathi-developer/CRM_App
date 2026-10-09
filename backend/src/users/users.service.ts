import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { HashUtil } from '../common/utils/hash.util';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { createPaginatedResponse } from '../common/utils/response.util';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: UserQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { email: { contains: query.search } },
      ];
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.roleId) {
      where.roleId = query.roleId;
    }

    if (query.organizationId) {
      where.organizationId = query.organizationId;
    }

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          avatar: true,
          status: true,
          roleId: true,
          organizationId: true,
          createdAt: true,
          updatedAt: true,
          role: true,
          organization: true,
        },
      }),
    ]);

    return createPaginatedResponse(users, total, page, limit);
  }

  async create(dto: CreateUserDto) {
    const email = dto.email.toLowerCase();
    const existing = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await HashUtil.hash(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email,
        name: dto.name,
        passwordHash,
        phone: dto.phone,
        status: dto.status || 'ACTIVE',
        roleId: dto.roleId,
        organizationId: dto.organizationId,
        profileSettings: {
          create: {
            theme: 'dark',
          },
        },
      },
      include: {
        role: true,
        organization: true,
      },
    });

    const { passwordHash: _, refreshToken: __, ...result } = user;
    return result;
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
        organization: true,
        profileSettings: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const { passwordHash, refreshToken, ...result } = user;
    return result;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);

    if (dto.email) {
      const email = dto.email.toLowerCase();
      const existing = await this.prisma.user.findUnique({
        where: { email },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('Email already in use by another user');
      }
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        email: dto.email ? dto.email.toLowerCase() : undefined,
        name: dto.name,
        phone: dto.phone,
        avatar: dto.avatar,
        status: dto.status,
        roleId: dto.roleId,
        organizationId: dto.organizationId,
      },
      include: {
        role: true,
        organization: true,
      },
    });

    const { passwordHash, refreshToken, ...result } = updated;
    return result;
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.user.delete({ where: { id } });
    return { message: `User with ID ${id} successfully deleted` };
  }

  async updateStatus(id: string, status: string) {
    await this.findOne(id);
    const updated = await this.prisma.user.update({
      where: { id },
      data: { status },
      include: { role: true, organization: true },
    });
    const { passwordHash, refreshToken, ...result } = updated;
    return result;
  }

  async updateRole(id: string, roleId: string) {
    await this.findOne(id);

    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });
    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { roleId },
      include: { role: true, organization: true },
    });
    const { passwordHash, refreshToken, ...result } = updated;
    return result;
  }

  async getUserActivities(id: string) {
    await this.findOne(id);
    return this.prisma.activity.findMany({
      where: {
        OR: [{ assignedToId: id }, { createdById: id }],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        contact: true,
        lead: true,
        deal: true,
      },
    });
  }

  async getUserTasks(id: string) {
    await this.findOne(id);
    return this.prisma.task.findMany({
      where: {
        OR: [{ assignedToId: id }, { createdById: id }],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        contact: true,
        lead: true,
        deal: true,
      },
    });
  }

  async getUserDeals(id: string) {
    await this.findOne(id);
    return this.prisma.deal.findMany({
      where: { ownerId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        stage: true,
        pipeline: true,
        organization: true,
        contact: true,
      },
    });
  }
}
