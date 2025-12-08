import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { hasRoutePermission } from '../../config/permissions';

interface RoleGuardProps {
  children: ReactNode;
  requiredPath: string;
}

/**
 * RoleGuard - Protects routes based on user role
 * Redirects to dashboard if user doesn't have permission
 */
export default function RoleGuard({ children, requiredPath }: RoleGuardProps) {
  const { user, isAuthenticated } = useAuthStore();

  // If not authenticated, redirect to login (handled by ProtectedRoute)
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has permission for this route
  const hasPermission = hasRoutePermission(user.role, requiredPath);

  if (!hasPermission) {
    // Redirect to dashboard with a message
    console.warn(`Access denied: User role ${user.role} cannot access ${requiredPath}`);
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
