import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateSitePolicyDto,
  UpdateSitePolicyDto,
  SitePolicyResponseDto,
} from './dto';

@Injectable()
export class SitePolicyService {
  constructor(private readonly prisma: PrismaService) {}

  async createPolicy(
    createSitePolicyDto: CreateSitePolicyDto,
  ): Promise<SitePolicyResponseDto> {
    try {
      // Check if policy with this type already exists
      const existingPolicy = await this.prisma.sitePolicy.findFirst({
        where: { type: createSitePolicyDto.type },
      });

      if (existingPolicy) {
        throw new BadRequestException(
          `A policy with type "${createSitePolicyDto.type}" already exists`,
        );
      }

      const policy = await this.prisma.sitePolicy.create({
        data: {
          type: createSitePolicyDto.type,
          content: createSitePolicyDto.content,
        },
      });

      return this.mapToDto(policy);
    } catch (error) {
      throw new BadRequestException(this.getErrorMessage(error));
    }
  }

  async getAllPolicies(): Promise<SitePolicyResponseDto[]> {
    try {
      const policies = await this.prisma.sitePolicy.findMany({
        orderBy: { createdAt: 'desc' },
      });

      return policies.map((policy) => this.mapToDto(policy));
    } catch (error) {
      throw new BadRequestException(this.getErrorMessage(error));
    }
  }

  async getPolicyById(id: string): Promise<SitePolicyResponseDto> {
    try {
      const policy = await this.prisma.sitePolicy.findUnique({
        where: { id },
      });

      if (!policy) {
        throw new NotFoundException(`Site policy with ID "${id}" not found`);
      }

      return this.mapToDto(policy);
    } catch (error) {
      throw new NotFoundException(this.getErrorMessage(error));
    }
  }

  async getPolicyByType(type: string): Promise<SitePolicyResponseDto> {
    try {
      // Validate type is either Privacy or Terms
      if (type !== 'Privacy' && type !== 'Terms') {
        throw new BadRequestException(
          `Invalid policy type. Must be either "Privacy" or "Terms"`,
        );
      }

      const policy = await this.prisma.sitePolicy.findFirst({
        where: { type: type as any },
      });

      if (!policy) {
        throw new NotFoundException(
          `Site policy with type "${type}" not found`,
        );
      }

      return this.mapToDto(policy);
    } catch (error) {
      throw new NotFoundException(this.getErrorMessage(error));
    }
  }

  async updatePolicy(
    id: string,
    updateSitePolicyDto: UpdateSitePolicyDto,
  ): Promise<SitePolicyResponseDto> {
    try {
      const policy = await this.prisma.sitePolicy.findUnique({
        where: { id },
      });

      if (!policy) {
        throw new NotFoundException(`Site policy with ID "${id}" not found`);
      }

      // If type is being updated, check for conflicts
      if (
        updateSitePolicyDto.type &&
        updateSitePolicyDto.type !== policy.type
      ) {
        const existingPolicy = await this.prisma.sitePolicy.findFirst({
          where: { type: updateSitePolicyDto.type },
        });

        if (existingPolicy) {
          throw new BadRequestException(
            `A policy with type "${updateSitePolicyDto.type}" already exists`,
          );
        }
      }

      const updatedPolicy = await this.prisma.sitePolicy.update({
        where: { id },
        data: {
          ...(updateSitePolicyDto.type && {
            type: updateSitePolicyDto.type,
          }),
          ...(updateSitePolicyDto.content && {
            content: updateSitePolicyDto.content,
          }),
        },
      });

      return this.mapToDto(updatedPolicy);
    } catch (error) {
      throw new BadRequestException(this.getErrorMessage(error));
    }
  }

  async deletePolicy(id: string): Promise<{ message: string }> {
    try {
      const policy = await this.prisma.sitePolicy.findUnique({
        where: { id },
      });

      if (!policy) {
        throw new NotFoundException(`Site policy with ID "${id}" not found`);
      }

      await this.prisma.sitePolicy.delete({
        where: { id },
      });

      return { message: 'Site policy deleted successfully' };
    } catch (error) {
      throw new BadRequestException(this.getErrorMessage(error));
    }
  }

  private mapToDto(policy: any): SitePolicyResponseDto {
    return {
      id: policy.id,
      type: policy.type,
      content: policy.content,
      createdAt: policy.createdAt,
      updatedAt: policy.updatedAt,
    };
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    if (error && typeof error === 'object' && 'message' in error) {
      return (error as { message: string }).message;
    }
    return 'An unexpected error occurred';
  }
}
