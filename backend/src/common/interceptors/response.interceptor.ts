import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { map, Observable } from 'rxjs';

export interface ApiResponse<T> {
  success: true;
  data: T;
  error: null;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((result) => {
        if (result && typeof result === 'object' && 'items' in result && 'pagination' in result) {
          return {
            success: true,
            data: (result as { items: T }).items,
            error: null,
            pagination: (result as { pagination: ApiResponse<T>['pagination'] }).pagination,
          };
        }
        return { success: true, data: result, error: null };
      }),
    );
  }
}
