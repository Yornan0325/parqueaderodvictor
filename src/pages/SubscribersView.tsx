import { useState } from "react";
import type { Subscriber } from "@/components/types";
import type { User } from "firebase/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { retrieveSubscribersCollection } from "@/components/util";
import { db } from "@/firebase/firebase";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { doc, query } from "firebase/firestore";
import { AlertTriangle, Eye, EyeOff, Loader2, Phone, Search, Trash2, Car, Bike, Truck, Bus, Pencil } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { normalizePlate } from "@/lib/plate-utils";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { safeDeleteDoc, safeGetDocs, safeUpdateDoc } from "@/lib/firestore-safe";

const SubscribersView = ({ user }: { user: User }) => {
  const queryClient = useQueryClient();
  const [selectedSubscriber, setSelectedSubscriber] = useState<Subscriber | null>(null);
  const [subscriberToDelete, setSubscriberToDelete] = useState<Subscriber | null>(null);
  const [hiddenSubscriberIds, setHiddenSubscriberIds] = useState<Set<string>>(new Set());
  const [showHidden, setShowHidden] = useState(false);
  const [search, setSearch] = useState("");
  const [editForm, setEditForm] = useState({ name: '', documentId: '', phone: '', plate: '', expiryDate: '', monthlyFee: '' });

  const { data: subscribers = [], isLoading } = useQuery({
    queryKey: ['subscribers'],
    queryFn: async () => {
      const snapshot = await safeGetDocs(query(retrieveSubscribersCollection()));
      return snapshot.docs.map(docItem => ({ ...docItem.data(), id: docItem.id })) as Subscriber[];
    },
    enabled: !!user
  });

  const deleteMutation = useMutation({
    mutationFn: async (subscriberId: string) => {
      await safeDeleteDoc(doc(db, 'subscribers', subscriberId));
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
      await safeUpdateDoc(doc(db, 'subscribers', selectedSubscriber.id), {
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
  const toggleHidden = (subscriberId: string) => {
    setHiddenSubscriberIds((current) => {
      const next = new Set(current);
      if (next.has(subscriberId)) {
        next.delete(subscriberId);
      } else {
        next.add(subscriberId);
      }
      return next;
    });
  };

  const visibleSubscribers = subscribers.filter((subscriber) => {
    const matchesSearch =
      subscriber.name.toLowerCase().includes(search.toLowerCase()) ||
      subscriber.plate.toLowerCase().includes(search.toLowerCase()) ||
      subscriber.documentId.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    const isHidden = hiddenSubscriberIds.has(subscriber.id || "");
    return showHidden ? isHidden : !isHidden;
  });

  const hiddenCount = subscribers.filter((subscriber) =>
    hiddenSubscriberIds.has(subscriber.id || "")
  ).length;

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-muted-foreground" strokeWidth={1} size={40} /></div>;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <Card className="border border-border/40 bg-card/80 shadow-sm">
        <CardContent className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div className="relative w-full sm:max-w-2xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-10 pl-9"
              placeholder="Buscar por nombre, placa o documento..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Button
            variant={showHidden ? "default" : "outline"}
            onClick={() => setShowHidden((current) => !current)}
            className="h-10 w-full px-5 sm:w-auto sm:min-w-47.5"
          >
            {showHidden ? <Eye className="mr-2 h-4 w-4" /> : <EyeOff className="mr-2 h-4 w-4" />}
            {showHidden ? "Ver activos" : `Ver ocultos (${hiddenCount})`}
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {subscribers.length === 0 ? <div className="col-span-full rounded-3xl border-2 border-dashed border-border/70 bg-card/50 py-20 text-center text-sm font-medium text-muted-foreground">No hay suscriptores registrados.</div> : visibleSubscribers.map(s => (
        <Card key={s.id} className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card/80 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border/70 bg-muted/30 text-muted-foreground">
                  {s.type === 'AUTOMOVIL' && <Car size={20} />}
                  {s.type === 'MOTOCICLETA' && <Bike size={20} className="rotate-12" />}
                  {s.type === 'BICICLETA' && <Bike size={20} />}
                  {s.type === 'CAMION' && <Truck size={20} />}
                  {s.type === 'BUS' && <Bus size={20} />}
                </div>
                <div><h3 className="mb-1 leading-none font-bold text-foreground">{s.name}</h3><h3 className="mb-1 text-sm leading-none text-muted-foreground">Doc: {s.documentId}</h3></div>
              </div>

              <div className="flex gap-1 opacity-0 transition-all group-hover:opacity-100">
                <Button onClick={() => openEditor(s)} variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"><Pencil size={15} /></Button>
                <Button
                  onClick={() => s.id && toggleHidden(s.id)}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
                  title={hiddenSubscriberIds.has(s.id || "") ? "Mostrar suscriptor" : "Ocultar suscriptor"}
                >
                  {hiddenSubscriberIds.has(s.id || "") ? <Eye size={15} /> : <EyeOff size={15} />}
                </Button>
                <Button onClick={() => setSubscriberToDelete(s)} disabled={deleteMutation.isPending} variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 size={15} /></Button>
              </div>
            </div>

            <div className="mb-6 flex flex-wrap gap-2">
              <Badge className="border border-sky-200/70 bg-sky-100/70 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300">{s.plate}</Badge>
              <Badge className={isExpired(s.expiryDate) ? 'border border-red-200/70 bg-red-100/70 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300' : 'border border-emerald-200/70 bg-emerald-100/70 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300'}>{isExpired(s.expiryDate) ? 'Vencido' : 'Activo'}</Badge>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground"><div className="flex items-center gap-2"><Phone size={14} /><span className="font-medium">{s.phone}</span></div><div className="flex items-center gap-2"><span className="text-lg font-black text-foreground">${formatCurrency(Number(s.monthlyFee))}</span></div></div>
              <div className="text-xs text-muted-foreground">Vigente hasta: {s.expiryDate}</div>
            </div>
          </CardContent>
        </Card>
      ))}
      {subscribers.length > 0 && visibleSubscribers.length === 0 && (
        <div className="col-span-full rounded-3xl border-2 border-dashed border-border/70 bg-card/50 py-20 text-center text-sm font-medium text-muted-foreground">
          {showHidden
            ? "No hay suscriptores ocultos para este filtro."
            : "No hay suscriptores visibles para este filtro."}
        </div>
      )}
      </div>

      <Sheet open={!!selectedSubscriber} onOpenChange={(open) => !open && setSelectedSubscriber(null)}>
        <SheetContent side="right" className="sm:max-w-lg bg-background/98 backdrop-blur-sm">
          <SheetHeader className="px-2 pb-4">
            <SheetTitle className="text-xl font-black tracking-tight">Editar suscriptor</SheetTitle>
            <SheetDescription className="text-sm text-muted-foreground">
              Actualiza los datos operativos del cliente mensual.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 space-y-4 rounded-2xl bg-muted/25 p-4 sm:p-5 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-muted-foreground">Nombre completo</label>
                <Input className="bg-background/80 shadow-sm ring-0" value={editForm.name} onChange={(e) => setEditForm((current) => ({ ...current, name: e.target.value }))} placeholder="Nombre completo" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Documento o NIT</label>
                <Input className="bg-background/80 shadow-sm ring-0" value={editForm.documentId} onChange={(e) => setEditForm((current) => ({ ...current, documentId: e.target.value }))} placeholder="Documento o NIT" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Telefono</label>
                <Input className="bg-background/80 shadow-sm ring-0" value={editForm.phone} onChange={(e) => setEditForm((current) => ({ ...current, phone: e.target.value }))} placeholder="Telefono" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Placa</label>
                <Input className="bg-background/80 shadow-sm ring-0" value={editForm.plate} onChange={(e) => setEditForm((current) => ({ ...current, plate: normalizePlate(e.target.value) }))} placeholder="Placa" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Mensualidad</label>
                <Input className="bg-background/80 shadow-sm ring-0" type="number" min={0} value={editForm.monthlyFee} onChange={(e) => setEditForm((current) => ({ ...current, monthlyFee: e.target.value }))} placeholder="Mensualidad" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-muted-foreground">Fecha de vencimiento</label>
                <Input className="bg-background/80 shadow-sm ring-0" type="date" value={editForm.expiryDate} onChange={(e) => setEditForm((current) => ({ ...current, expiryDate: e.target.value }))} />
              </div>
            </div>
          </div>

          <SheetFooter className="mt-6 pt-2">
            <Button className="w-full sm:w-auto" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>{updateMutation.isPending ? 'Guardando...' : 'Guardar cambios'}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {subscriberToDelete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/25 p-4 backdrop-blur-[1px]">
          <div className="w-full max-w-sm rounded-2xl bg-background p-5 shadow-2xl">
            <div className="mb-4 flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-destructive/10 p-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Eliminar suscriptor</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Se eliminara a <span className="font-semibold text-foreground">{subscriberToDelete.name}</span>. Esta accion no se puede deshacer.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setSubscriberToDelete(null)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                disabled={deleteMutation.isPending}
                onClick={() => {
                  deleteMutation.mutate(subscriberToDelete.id!);
                  setSubscriberToDelete(null);
                }}
              >
                {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscribersView;
