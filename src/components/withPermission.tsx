import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export function withPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  allowedRoles?: string[]
) {
  const WithPermissionComponent: React.FC<P> = (props) => {
    const { isAuthenticated, role, isLoading } = useAuth();

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <span className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }

    if (allowedRoles && role && !allowedRoles.includes(role)) {
      return <Navigate to="/dashboard" replace />;
    }

    return <WrappedComponent {...props} />;
  };

  WithPermissionComponent.displayName = `withPermission(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return WithPermissionComponent;
}
