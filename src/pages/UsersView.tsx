import { useState } from 'react';
import type { UserProfile } from '@/components/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { doc, getDocs, query, setDoc } from 'firebase/firestore';
import { Loader2, Pencil, ShieldUser } from 'lucide-react';

import { retrieveUsersCollection } from '@/components/util';
import { db } from '@/firebase/firebase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';

const mapStoredUser = (
  data: Partial<UserProfile> & Record<string, unknown>,
  documentEmail: string
): UserProfile => ({
  uid: String(data.uid ?? ''),
  email: String(data.email ?? data.correo ?? data.mail ?? documentEmail),
  name: String(data.name ?? data.nombre ?? data.displayName ?? 'Usuario'),
  role: (data.role ?? data.rol ?? 'user') as UserProfile['role'],
  createdAt: String(data.createdAt ?? data.creadoEn ?? new Date().toISOString()),
  updatedAt: data.updatedAt
    ? String(data.updatedAt)
    : data.actualizadoEn
      ? String(data.actualizadoEn)
      : undefined,
});

const EMPTY_FORM = {
  email: '',
  name: '',
  role: 'user' as UserProfile['role'],
};

const UsersView = () => {
  const queryClient = useQueryClient();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const snapshot = await getDocs(query(retrieveUsersCollection()));
      return snapshot.docs.map((docItem) =>
        mapStoredUser(
          docItem.data() as Partial<UserProfile> & Record<string, unknown>,
          docItem.id
        )
      );
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const email = form.email.trim().toLowerCase();
      if (!email) {
        throw new Error('El correo es obligatorio');
      }

      await setDoc(
        doc(db, 'usuarios', email),
        {
          ...selectedUser,
          email,
          correo: email,
          name: form.name.trim(),
          nombre: form.name.trim(),
          role: form.role,
          rol: form.role,
          updatedAt: new Date().toISOString(),
          actualizadoEn: new Date().toISOString(),
        },
        { merge: true }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      toast.success('Usuario guardado correctamente');
      setIsEditorOpen(false);
      setSelectedUser(null);
      setForm(EMPTY_FORM);
    },
    onError: (error) => {
      console.error(error);
      toast.error('No se pudo guardar el usuario');
    },
  });

  const openEditor = (user?: UserProfile) => {
    setIsEditorOpen(true);

    if (!user) {
      setSelectedUser(null);
      setForm(EMPTY_FORM);
      return;
    }

    setSelectedUser(user);
    setForm({
      email: user.email,
      name: user.name,
      role: user.role,
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-muted-foreground" strokeWidth={1} size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <Card className="border border-border/70 bg-card/70 p-4 shadow-sm backdrop-blur-sm transition-all duration-300 sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-black text-foreground">Usuarios</h2>
            <p className="text-sm text-muted-foreground">
              Administra nombre, correo y rol operativo de cada usuario.
            </p>
          </div>
          <Button onClick={() => openEditor()}>
            <ShieldUser className="mr-2 h-4 w-4" />
            Nuevo perfil
          </Button>
        </div>
      </Card>

      <Card className="border border-border/70 bg-card/80 shadow-sm transition-all duration-300">
        <div className="overflow-x-auto">
          <Table className="min-w-[640px]">
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="px-6 text-[10px] uppercase tracking-widest text-muted-foreground">
                Nombre
              </TableHead>
              <TableHead className="px-6 text-[10px] uppercase tracking-widest text-muted-foreground">
                Correo
              </TableHead>
              <TableHead className="px-6 text-[10px] uppercase tracking-widest text-muted-foreground">
                Rol
              </TableHead>
              <TableHead className="px-6 text-right text-[10px] uppercase tracking-widest text-muted-foreground">
                Accion
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.email} className="transition-colors hover:bg-muted/30">
                <TableCell className="px-6 font-black text-foreground">{user.name}</TableCell>
                <TableCell className="px-6 text-muted-foreground">{user.email}</TableCell>
                <TableCell className="px-6 uppercase text-muted-foreground">{user.role}</TableCell>
                <TableCell className="px-6 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="transition-colors hover:bg-accent hover:text-accent-foreground"
                    onClick={() => openEditor(user)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="px-6 py-16 text-center text-muted-foreground">
                  No hay perfiles cargados en la coleccion usuarios.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          </Table>
        </div>
      </Card>

      <Sheet open={isEditorOpen} onOpenChange={(open) => {
        if (!open) {
          setIsEditorOpen(false);
          setSelectedUser(null);
          setForm(EMPTY_FORM);
        }
      }}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{selectedUser ? 'Editar usuario' : 'Nuevo usuario'}</SheetTitle>
            <SheetDescription>
              El documento se guarda usando el correo como identificador.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 px-4">
            <Input
              value={form.name}
              onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
              placeholder="Nombre completo"
            />
            <Input
              value={form.email}
              onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))}
              placeholder="correo@empresa.com"
              disabled={!!selectedUser}
            />
            <select
              value={form.role}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  role: e.target.value as UserProfile['role'],
                }))
              }
              className="h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            >
              <option value="admin">admin</option>
              <option value="employee">employee</option>
              <option value="user">user</option>
            </select>
          </div>

          <SheetFooter>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Guardando...' : 'Guardar usuario'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default UsersView;
