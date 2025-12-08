import { UserRole } from '../types';

/**
 * Role-based permission configuration
 * Defines which routes are accessible by each role
 */

interface RoutePermission {
  path: string;
  roles: UserRole[];
  description: string;
}

export const routePermissions: RoutePermission[] = [
  // Dashboard - all roles
  {
    path: '/dashboard',
    roles: [UserRole.OWNER, UserRole.MANAGER, UserRole.CASHIER],
    description: 'View dashboard and statistics',
  },

  // Inventory - all roles (view only for CASHIER)
  {
    path: '/inventory',
    roles: [UserRole.OWNER, UserRole.MANAGER, UserRole.CASHIER],
    description: 'View and manage inventory',
  },

  // Point of Sale - all roles
  {
    path: '/pos',
    roles: [UserRole.OWNER, UserRole.MANAGER, UserRole.CASHIER],
    description: 'Access POS system',
  },

  // Product Codes - all roles
  {
    path: '/product-codes',
    roles: [UserRole.OWNER, UserRole.MANAGER, UserRole.CASHIER],
    description: 'View and generate product codes',
  },

  // Reports - OWNER and MANAGER only
  {
    path: '/reports',
    roles: [UserRole.OWNER, UserRole.MANAGER],
    description: 'View sales and financial reports',
  },

  // Team Management - OWNER and MANAGER only
  {
    path: '/team',
    roles: [UserRole.OWNER, UserRole.MANAGER],
    description: 'Manage team members',
  },

  // Store Settings - OWNER only
  {
    path: '/settings/stores',
    roles: [UserRole.OWNER],
    description: 'Manage store settings',
  },
  {
    path: '/settings',
    roles: [UserRole.OWNER],
    description: 'Access settings',
  },
];

/**
 * Check if a user has permission to access a route
 */
export function hasRoutePermission(userRole: UserRole | undefined, path: string): boolean {
  if (!userRole) return false;

  // Find the most specific matching route
  const matchingRoute = routePermissions
    .filter(route => path.startsWith(route.path))
    .sort((a, b) => b.path.length - a.path.length)[0];

  if (!matchingRoute) {
    // If no specific permission is defined, allow access
    // (for routes like /profile, etc.)
    return true;
  }

  return matchingRoute.roles.includes(userRole);
}

/**
 * Get allowed routes for a specific role
 */
export function getAllowedRoutes(userRole: UserRole): string[] {
  return routePermissions
    .filter(route => route.roles.includes(userRole))
    .map(route => route.path);
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    [UserRole.OWNER]: 'Owner',
    [UserRole.MANAGER]: 'Manager',
    [UserRole.CASHIER]: 'Cashier',
  };
  return roleNames[role] || role;
}

/**
 * Get role permissions summary
 */
export function getRolePermissions(role: UserRole): string[] {
  return routePermissions
    .filter(route => route.roles.includes(role))
    .map(route => route.description);
}
