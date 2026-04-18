import { useState } from "react";
import type { Subscriber } from "@/components/types";
import type { User } from "firebase/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { retrieveSubscribersCollection } from "@/components/util";
import { db } from "@/firebase/firebase";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteDoc, doc, getDocs, query, updateDoc } from "firebase/firestore";
import { Loader2, Phone, Trash2, Car, Bike, Truck, Bus, Pencil } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { normalizePlate } from "@/lib/plate-utils";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";

const SubscribersView = ({ user }: { user: User }) => {
  const queryClient = useQueryClient();
  const [selectedSubscriber, setSelectedSubscriber] = useState<Subscriber | null>(null);
  const [editForm, setEditForm] = useState({ name: '', documentId: '', phone: '', plate: '', expiryDate: '', monthlyFee: '' });

  const { data: subscribers = [], isLoading } = useQuery({
    queryKey: ['subscribers'],
    queryFn: async () => {
      const snapshot = await getDocs(query(retrieveSubscribersCollection()));
      return snapshot.docs.map(docItem => ({ ...docItem.data(), id: docItem.id })) as Subscriber[];
    },
    enabled: !!user
  });

  const deleteMutation = useMutation({
    mutationFn: async (subscriberId: string) => {
      await deleteDoc(doc(db, 'subscribers', subscriberId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscribers'] });
      toast.success("Socio eliminado correctamente");
    },
    onError: (error) => {
      console.error(error);
      toast.error("Error al eliminar");
    }
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSubscriber?.id) throw new Error('No hay suscriptor seleccionado');
      await updateDoc(doc(db, 'subscribers', selectedSubscriber.id), {
        name: editForm.name.trim(),
        documentId: editForm.documentId.trim(),
        phone: editForm.phone.trim(),
        plate: normalizePlate(editForm.plate),
        expiryDate: editForm.expiryDate,
        monthlyFee: Number(editForm.monthlyFee || 0),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscribers'] });
      toast.success('Suscriptor actualizado');
      setSelectedSubscriber(null);
    },
    onError: (error) => {
      console.error(error);
      toast.error('No se pudo actualizar el suscriptor');
    }
  });

  const openEditor = (subscriber: Subscriber) => {
    setSelectedSubscriber(subscriber);
    setEditForm({
      name: subscriber.name,
      documentId: subscriber.documentId,
      phone: subscriber.phone,
      plate: subscriber.plate,
      expiryDate: subscriber.expiryDate,
      monthlyFee: String(subscriber.monthlyFee),
    });
  };

  const isExpired = (expiryDate: string) => new Date(`${expiryDate}T23:59:59`).getTime() < Date.now();

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-zinc-300" strokeWidth={1} size={40} /></div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {subscribers.length === 0 ? <div className="col-span-full text-center py-20 border-2 border-dashed border-zinc-100 rounded-3xl text-zinc-400 text-sm font-medium">No hay suscriptores registrados.</div> : subscribers.map(s => (
        <Card key={s.id} className="group relative overflow-hidden border-1 border-zinc-200 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <div className="h-12 w-12 border-1 border-zinc-200 rounded-xl flex items-center justify-center text-zinc-400">
                  {s.type === 'AUTOMOVIL' && <Car size={20} />}
                  {s.type === 'MOTOCICLETA' && <Bike size={20} className="rotate-12" />}
                  {s.type === 'BICICLETA' && <Bike size={20} />}
                  {s.type === 'CAMION' && <Truck size={20} />}
                  {s.type === 'BUS' && <Bus size={20} />}
                </div>
                <div><h3 className="font-bold leading-none mb-1">{s.name}</h3><h3 className="text-zinc-400 text-sm leading-none mb-1">Doc: {s.documentId}</h3></div>
              </div>

              <div className="flex gap-1 opacity-0 transition-all group-hover:opacity-100">
                <Button onClick={() => openEditor(s)} variant="ghost" size="icon" className="h-8 w-8 text-zinc-300 hover:text-zinc-900 hover:bg-zinc-100 rounded-full"><Pencil size={15} /></Button>
                <Button onClick={() => { if (confirm(`Eliminar a ${s.name}?`)) deleteMutation.mutate(s.id!); }} disabled={deleteMutation.isPending} variant="ghost" size="icon" className="h-8 w-8 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-full"><Trash2 size={15} /></Button>
              </div>
            </div>

            <div className="mb-6 flex flex-wrap gap-2">
              <Badge className="bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300">{s.plate}</Badge>
              <Badge className={isExpired(s.expiryDate) ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}>{isExpired(s.expiryDate) ? 'Vencido' : 'Activo'}</Badge>
            </div>

            <div className="grid grid-cols-1 gap-2 border-zinc-50">
              <div className="flex items-center justify-between text-zinc-500 text-sm"><div className="flex items-center gap-2"><Phone size={14} /><span className="font-medium">{s.phone}</span></div><div className="flex items-center gap-2"><span className="text-lg font-black">${formatCurrency(Number(s.monthlyFee))}</span></div></div>
              <div className="text-xs text-zinc-400">Vigente hasta: {s.expiryDate}</div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Sheet open={!!selectedSubscriber} onOpenChange={(open) => !open && setSelectedSubscriber(null)}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Editar suscriptor</SheetTitle>
            <SheetDescription>Actualiza los datos operativos del cliente mensual.</SheetDescription>
          </SheetHeader>

          <div className="space-y-4 px-4">
            <Input value={editForm.name} onChange={(e) => setEditForm((current) => ({ ...current, name: e.target.value }))} placeholder="Nombre completo" />
            <Input value={editForm.documentId} onChange={(e) => setEditForm((current) => ({ ...current, documentId: e.target.value }))} placeholder="Documento o NIT" />
            <Input value={editForm.phone} onChange={(e) => setEditForm((current) => ({ ...current, phone: e.target.value }))} placeholder="Telefono" />
            <Input value={editForm.plate} onChange={(e) => setEditForm((current) => ({ ...current, plate: normalizePlate(e.target.value) }))} placeholder="Placa" />
            <Input type="date" value={editForm.expiryDate} onChange={(e) => setEditForm((current) => ({ ...current, expiryDate: e.target.value }))} />
            <Input type="number" min={0} value={editForm.monthlyFee} onChange={(e) => setEditForm((current) => ({ ...current, monthlyFee: e.target.value }))} placeholder="Mensualidad" />
          </div>

          <SheetFooter>
            <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>{updateMutation.isPending ? 'Guardando...' : 'Guardar cambios'}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default SubscribersView;
