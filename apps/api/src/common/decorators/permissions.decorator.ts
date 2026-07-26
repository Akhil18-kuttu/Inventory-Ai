import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';
/**
 * Decorator to specify required permissions for a route handler.
 * Usage: @Permissions('product:create', 'order:read')
 */
export const Permissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);
