import { SetMetadata } from '@nestjs/common';

/**
 * Public Decorator
 * Marks an endpoint as public (does not require JWT token)
 * 
 * Usage: @Public() on controller methods
 */
export const Public = () => SetMetadata('isPublic', true);
