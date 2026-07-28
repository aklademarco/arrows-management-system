import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AdminRequest } from './admin.guard';

export const AdminUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) =>
    context.switchToHttp().getRequest<AdminRequest>().user,
);
