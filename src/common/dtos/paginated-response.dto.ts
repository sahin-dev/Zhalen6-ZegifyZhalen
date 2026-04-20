import { MetaResponseDto } from './meta.dto';

export class PaginatedResponseDto<T> {
  data: T[];

  meta: MetaResponseDto;

  constructor(data: T[], meta: MetaResponseDto) {
    this.data = data;
    this.meta = meta;
  }
}
