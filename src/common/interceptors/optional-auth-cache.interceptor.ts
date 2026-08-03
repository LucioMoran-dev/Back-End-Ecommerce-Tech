import { CacheInterceptor } from '@nestjs/cache-manager';
import { ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class OptionalAuthCacheInterceptor extends CacheInterceptor {
  protected trackBy(context: ExecutionContext): ReturnType<CacheInterceptor['trackBy']> {
    const request = context.switchToHttp().getRequest<Request>();

    if (typeof request.headers['authorization'] === 'string') {
      return undefined;
    }

    return super.trackBy(context);
  }
}
