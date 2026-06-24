import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('CLIENT' | 'FREELANCER' | 'ARBITRATOR' | 'ADMIN')[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { token, user } = useAuthStore();

  if (!token || !user) {
    return <Navigate to="/auth/sign-in" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If user doesn't have required role, redirect to their default home
    if (user.role === 'CLIENT') {
      return <Navigate to="/client/dashboard" replace />;
    } else if (user.role === 'FREELANCER') {
      return <Navigate to="/freelancer/dashboard" replace />;
    } else if (user.role === 'ADMIN' || user.role === 'ARBITRATOR') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/auth/sign-in" replace />;
  }

  return <>{children}</>;
}
