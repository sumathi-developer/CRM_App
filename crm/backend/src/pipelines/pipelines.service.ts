import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreatePipelineDto } from './dto/create-pipeline.dto';
import { UpdatePipelineDto } from './dto/update-pipeline.dto';
import { CreatePipelineStageDto } from './dto/create-stage.dto';
import { UpdatePipelineStageDto } from './dto/update-stage.dto';

@Injectable()
export class PipelinesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.pipeline.findMany({
      include: {
        stages: { orderBy: { order: 'asc' } },
        _count: { select: { deals: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(dto: CreatePipelineDto) {
    if (dto.isDefault) {
      await this.prisma.pipeline.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.pipeline.create({
      data: {
        name: dto.name,
        description: dto.description,
        isDefault: dto.isDefault ?? false,
      },
      include: { stages: true },
    });
  }

  async findOne(id: string) {
    const pipeline = await this.prisma.pipeline.findUnique({
      where: { id },
      include: {
        stages: {
          orderBy: { order: 'asc' },
          include: {
            _count: { select: { deals: true } },
          },
        },
        deals: {
          take: 10,
          include: { contact: true, organization: true, stage: true },
        },
      },
    });

    if (!pipeline) {
      throw new NotFoundException(`Pipeline with ID ${id} not found`);
    }

    return pipeline;
  }

  async update(id: string, dto: UpdatePipelineDto) {
    await this.findOne(id);

    if (dto.isDefault) {
      await this.prisma.pipeline.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.pipeline.update({
      where: { id },
      data: dto,
      include: { stages: { orderBy: { order: 'asc' } } },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.pipeline.delete({ where: { id } });
    return { message: `Pipeline with ID ${id} successfully deleted` };
  }

  async getStages(pipelineId: string) {
    await this.findOne(pipelineId);
    return this.prisma.pipelineStage.findMany({
      where: { pipelineId },
      orderBy: { order: 'asc' },
      include: { _count: { select: { deals: true } } },
    });
  }

  async createStage(pipelineId: string, dto: CreatePipelineStageDto) {
    await this.findOne(pipelineId);
    return this.prisma.pipelineStage.create({
      data: {
        pipelineId,
        name: dto.name,
        order: dto.order,
        winProbability: dto.winProbability ?? 10,
        color: dto.color || '#3b82f6',
      },
    });
  }

  async updateStage(pipelineId: string, stageId: string, dto: UpdatePipelineStageDto) {
    await this.findOne(pipelineId);
    const stage = await this.prisma.pipelineStage.findUnique({
      where: { id: stageId },
    });

    if (!stage || stage.pipelineId !== pipelineId) {
      throw new NotFoundException(`Stage with ID ${stageId} not found in this pipeline`);
    }

    return this.prisma.pipelineStage.update({
      where: { id: stageId },
      data: dto,
    });
  }
}
