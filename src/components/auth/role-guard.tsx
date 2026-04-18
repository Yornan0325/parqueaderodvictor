import { Navigate } from 'react-router-dom';

import type { UserProfile } from '@/components/types';

type RoleGuardProps = {
  allowedRoles: UserProfile['role'][];
  profile: UserProfile;
  children: React.ReactNode;
};

export function RoleGuard({ allowedRoles, profile, children }: RoleGuardProps) {
  if (!allowedRoles.includes(profile.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
