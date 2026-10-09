import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.role.findMany({
      include: {
        permissions: {
          include: { permission: true },
        },
        _count: {
          select: { users: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(dto: CreateRoleDto) {
    const existing = await this.prisma.role.findUnique({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException(`Role with name '${dto.name}' already exists`);
    }

    return this.prisma.role.create({
      data: {
        name: dto.name,
        description: dto.description,
        permissions: dto.permissionIds
          ? {
              create: dto.permissionIds.map((pId) => ({
                permissionId: pId,
              })),
            }
          : undefined,
      },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: { permission: true },
        },
        users: {
          select: { id: true, name: true, email: true, status: true },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return role;
  }

  async update(id: string, dto: UpdateRoleDto) {
    const role = await this.findOne(id);
    if (role.isSystem && dto.name && dto.name !== role.name) {
      throw new BadRequestException('Cannot rename system role');
    }

    return this.prisma.role.update({
      where: { id },
      data: dto,
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });
  }

  async remove(id: string) {
    const role = await this.findOne(id);
    if (role.isSystem) {
      throw new BadRequestException('Cannot delete system role');
    }

    await this.prisma.role.delete({ where: { id } });
    return { message: `Role with ID ${id} successfully deleted` };
  }

  async findAllPermissions() {
    return this.prisma.permission.findMany({
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });
  }

  async getRolePermissions(roleId: string) {
    await this.findOne(roleId);
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { roleId },
      include: { permission: true },
    });
    return rolePermissions.map((rp) => rp.permission);
  }

  async updateRolePermissions(roleId: string, dto: UpdateRolePermissionsDto) {
    await this.findOne(roleId);

    // Delete existing role permissions
    await this.prisma.rolePermission.deleteMany({
      where: { roleId },
    });

    // Create new ones
    if (dto.permissionIds.length > 0) {
      await this.prisma.rolePermission.createMany({
        data: dto.permissionIds.map((pId) => ({
          roleId,
          permissionId: pId,
        })),
      });
    }

    return this.getRolePermissions(roleId);
  }
}
