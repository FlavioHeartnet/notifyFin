import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestWithTitular, Titular } from './auth.types';

export const CurrentTitular = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Titular | undefined => {
    const request = ctx.switchToHttp().getRequest<RequestWithTitular>();
    return request.titular;
  },
);
