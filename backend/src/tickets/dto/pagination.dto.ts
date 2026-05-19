export class PaginationDto {
  offset?: number = 0;
  limit?: number = 10;
}

export class PaginatedResponse<T> {
  data: T[];
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;

  constructor(data: T[], total: number, offset: number, limit: number) {
    this.data = data;
    this.total = total;
    this.offset = offset;
    this.limit = limit;
    this.hasMore = offset + limit < total;
  }
}
