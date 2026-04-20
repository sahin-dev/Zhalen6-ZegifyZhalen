import { SetMetadata } from '@nestjs/common';

export type UserRole = 'BUYER' | 'SELLER' | 'CHECKER' | 'ADMIN' | 'SUPER_ADMIN';

/**
 * Roles Decorator
 * Marks an endpoint to require specific roles for access
 * 
 * Usage: @Roles('ADMIN', 'SUPER_ADMIN') on controller methods
 */
export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
