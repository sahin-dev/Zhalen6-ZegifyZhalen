import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import type { AuthenticatedUser } from '../decorators/current-user.decorator';

/**
 * Roles Guard
 * Checks if user has required role to access the endpoint
 * Works with @Roles() decorator
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are specified, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthenticatedUser }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not found in request');
    }

    if (!user.role) {
      throw new ForbiddenException('User role not found');
    }

    // Check if user role is in required roles
    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException(
        `User role "${user.role}" is not allowed to access this resource. Required roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
