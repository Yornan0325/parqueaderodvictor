import { useQuery } from '@tanstack/react-query';
import type { User } from 'firebase/auth';
import { getDoc } from 'firebase/firestore';

import type { UserProfile } from '@/components/types';
import { userProfileDocument } from '@/components/util';

const fallbackProfile = (user: User): UserProfile => ({
  uid: user.uid,
  email: user.email ?? '',
  name: user.displayName ?? user.email?.split('@')[0] ?? 'Usuarios',
  role: 'user',
  createdAt: new Date().toISOString(),
});

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const mapCollectionProfile = (
  user: User,
  data: Partial<UserProfile> & Record<string, unknown>,
  documentEmail: string
): UserProfile => ({
  uid: String(data.uid ?? user.uid),
  email: String(
    data.email ??
      data.correo ??
      data.mail ??
      documentEmail ??
      user.email ??
      ''
  ),
  name: String(
    data.name ??
      data.nombre ??
      data.displayName ??
      user.displayName ??
      user.email?.split('@')[0] ??
      'Usuario'
  ),
  role: (data.role ?? data.rol ?? 'user') as UserProfile['role'],
  createdAt: String(data.createdAt ?? data.creadoEn ?? new Date().toISOString()),
  updatedAt: data.updatedAt
    ? String(data.updatedAt)
    : data.actualizadoEn
      ? String(data.actualizadoEn)
      : undefined,
});

export const useUserProfile = (user: User | null) =>
  useQuery({
    queryKey: ['user-profile', user?.email],
    queryFn: async () => {
      if (!user) {
        throw new Error('No hay usuario autenticado');
      }

      if (!user.email) {
        return fallbackProfile(user);
      }

      const authEmail = user.email;
      const normalizedAuthEmail = normalizeEmail(authEmail);

      let snapshot = await getDoc(userProfileDocument(authEmail));

      if (!snapshot.exists() && normalizedAuthEmail !== authEmail) {
        snapshot = await getDoc(userProfileDocument(normalizedAuthEmail));
      }

      if (!snapshot.exists()) {
        return fallbackProfile(user);
      }

      const data = snapshot.data() as Partial<UserProfile> & Record<string, unknown>;
      return mapCollectionProfile(user, data, snapshot.id);
    },
    enabled: !!user,
  });
