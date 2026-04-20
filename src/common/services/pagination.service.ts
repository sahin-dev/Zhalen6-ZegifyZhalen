import { Injectable } from '@nestjs/common';
import { PaginationQueryDto } from '../dtos/pagination-query.dto';
import { MetaResponseDto } from '../dtos/meta.dto';

@Injectable()
export class PaginationService {
  /**
   * Calculate skip value for database queries
   * @param page Current page number (1-based)
   * @param limit Number of items per page
   * @returns Skip value for database queries
   */
  calculateSkip(page: number = 1, limit: number = 10): number {
    const validPage = Math.max(1, page);
    return (validPage - 1) * limit;
  }

  /**
   * Generate meta response with pagination information
   * @param total Total number of items
   * @param page Current page number
   * @param limit Number of items per page
   * @returns MetaResponseDto with pagination info
   */
  generateMeta(total: number, page: number = 1, limit: number = 10): MetaResponseDto {
    return new MetaResponseDto(total, Math.max(1, page), Math.max(1, limit));
  }

  /**
   * Validate and get pagination parameters
   * @param paginationQuery Pagination query DTO
   * @returns Validated page and limit
   */
  getValidPaginationParams(
    paginationQuery?: PaginationQueryDto,
  ): { page: number; limit: number } {
    const page = Math.max(1, paginationQuery?.page || 1);
    const limit = Math.max(1, Math.min(100, paginationQuery?.limit || 10)); // Max limit 100

    return { page, limit };
  }
}
