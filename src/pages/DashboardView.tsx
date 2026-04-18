import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { User } from "firebase/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteDoc, doc, getDocs, query } from "firebase/firestore";
import { Bike, Car, Loader2, Search, Bus, Truck, Bluetooth, Pencil } from "lucide-react";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import type { ParkedVehicle } from "@/components/types";
import { retrieveVehiclesCollection, deliverVehicleEntry, deliverHistoryEntry } from "@/components/util";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { usePrinter } from "@/hooks/use-printer";
import { generateExitTicket } from "@/lib/receipt-utils";
import { addDoc } from "firebase/firestore";
import { formatCurrency } from "@/lib/formatters";
import { useParkingSettings } from "@/hooks/use-parking-settings";
import { toast } from "sonner";

const DashboardView = ({ user }: { user: User }) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [now, setNow] = useState(Date.now());
  const [selectedVehicle, setSelectedVehicle] = useState<ParkedVehicle | null>(null);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'EFECTIVO' | 'TRANSFERENCIA'>('EFECTIVO');
  const { capacity, updateCapacity } = useParkingSettings();
  const [editingCapacity, setEditingCapacity] = useState(false);
  const [capacityInput, setCapacityInput] = useState('');

  const { isConnected, print } = usePrinter();

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const { data: parkedVehicles = [], isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const snapshot = await getDocs(query(retrieveVehiclesCollection()));
      return snapshot.docs.map(docItem => ({ ...docItem.data(), id: docItem.id })) as ParkedVehicle[];
    },
    enabled: !!user
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ vehicle, method, amount }: { vehicle: ParkedVehicle, method: string, amount: number }) => {
      await addDoc(deliverHistoryEntry(), {
        ...vehicle,
        exitTime: Date.now(),
        totalPaid: amount,
        paymentMethod: method,
        status: 'COMPLETED'
      });

      await deleteDoc(doc(deliverVehicleEntry(), vehicle.id));
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['history'] });
      toast.success("Servicio finalizado");

      if (isConnected) {
        handlePrint(variables.vehicle, variables.amount, variables.method);
      }

      setIsExitModalOpen(false);
      setSelectedVehicle(null);
    }
  });

  const handlePrint = (vehicle: ParkedVehicle, amount: number, method: string) => {
    const ticketData = generateExitTicket(vehicle, Date.now(), amount, method);
    print(ticketData);
  };

  const stats = useMemo(() => {
    const counts = parkedVehicles.reduce((acc, vehicle) => {
      acc[vehicle.type] = (acc[vehicle.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return { counts, total: parkedVehicles.length };
  }, [parkedVehicles]);

  const filtered = parkedVehicles.filter(vehicle =>
    vehicle.plate.toLowerCase().includes(search.toLowerCase()) &&
    (selectedType === 'ALL' || vehicle.type === selectedType)
  );

  const saveCapacity = () => {
    updateCapacity(Number(capacityInput));
    setEditingCapacity(false);
  };

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="col-span-1 border border-border/70 bg-card/80 shadow-sm transition-all duration-300 sm:col-span-2 lg:col-span-1">
          <div className="flex flex-row items-center justify-between p-3 sm:p-4 pb-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ocupacion</span>
            <button
              onClick={() => {
                setEditingCapacity(true);
                setCapacityInput(String(capacity));
              }}
              title="Editar capacidad"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <Pencil className="h-4 w-4" />
            </button>
          </div>
          <div className="px-3 sm:px-4 pb-3 sm:pb-4">
            {editingCapacity ? (
              <div className="flex items-center gap-2 mt-1">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    autoFocus
                    className="w-20 border-b-2 border-foreground bg-transparent text-xl font-black text-foreground outline-none"
                    value={capacityInput}
                    onChange={(e) => setCapacityInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        saveCapacity();
                      }
                      if (e.key === 'Escape') setEditingCapacity(false);
                    }}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      className="text-[9px] font-black text-emerald-600 uppercase tracking-wider"
                      onClick={saveCapacity}
                    >
                      <p className="text-sm font-bold text-muted-foreground">Guardar</p>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-2xl sm:text-3xl font-black leading-none">
                {stats.total} <span className="text-xs font-medium text-muted-foreground">/ {capacity}</span>
              </div>
            )}
            <Progress value={Math.min((stats.total / capacity) * 100, 100)} className={cn("w-full mt-2", "**:data-[slot=progress-indicator]:bg-sky-400", "**:data-[slot=progress-track]:bg-sky-400/10")} />
          </div>
        </Card>

        <Card className="border border-border/70 bg-card/80 shadow-sm transition-all duration-300">
          <div className="flex flex-row items-center justify-between p-3 pb-1 sm:p-4"><span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Autos</span><Car className="h-5 w-5 text-muted-foreground" /></div>
          <div className="px-3 pb-3 sm:px-4 sm:pb-4"><div className="text-2xl font-black leading-none sm:text-3xl">{stats.counts['AUTOMOVIL'] || 0}</div><span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Automoviles</span></div>
        </Card>
        <Card className="border border-border/70 bg-card/80 shadow-sm transition-all duration-300">
          <div className="flex flex-row items-center justify-between p-3 pb-1 sm:p-4"><span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Motos</span><Bike className="h-5 w-5 rotate-12 text-muted-foreground" /></div>
          <div className="px-3 pb-3 sm:px-4 sm:pb-4"><div className="text-2xl font-black leading-none sm:text-3xl">{stats.counts['MOTOCICLETA'] || 0}</div><span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Motocicletas</span></div>
        </Card>
        <Card className="border border-border/70 bg-card/80 shadow-sm transition-all duration-300">
          <div className="flex flex-row items-center justify-between p-3 pb-1 sm:p-4"><span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Bicis</span><Bike className="h-5 w-5 text-muted-foreground" /></div>
          <div className="px-3 pb-3 sm:px-4 sm:pb-4"><div className="text-2xl font-black leading-none sm:text-3xl">{stats.counts['BICICLETA'] || 0}</div><span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Bicicletas</span></div>
        </Card>
        <Card className="border border-border/70 bg-card/80 shadow-sm transition-all duration-300">
          <div className="flex flex-row items-center justify-between p-3 pb-1 sm:p-4"><span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pesados</span><Truck className="h-5 w-5 text-muted-foreground" /></div>
          <div className="px-3 pb-3 sm:px-4 sm:pb-4"><div className="text-2xl font-black leading-none sm:text-3xl">{(stats.counts['BUS'] || 0) + (stats.counts['CAMION'] || 0)}</div><span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Bus / Camion</span></div>
        </Card>
      </div>

      <Card className="border border-border/70 bg-card/80 shadow-sm transition-all duration-300">
        <div className="flex flex-col gap-4 p-4 sm:p-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-black">Parqueo</h2>
            <div className="flex flex-wrap gap-1.5 pt-2">
              {['ALL', 'AUTOMOVIL', 'MOTOCICLETA', 'BICICLETA', 'BUS', 'CAMION'].map(type => (
                <button key={type} onClick={() => setSelectedType(type)} className={cn("rounded-full border px-3 py-1 text-[10px] font-black uppercase transition-all", selectedType === type ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground")}>{type === 'ALL' ? 'Todos' : type}</button>
              ))}
            </div>
          </div>
          <div className="relative w-full max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar por placa..." className="pl-9" value={search} onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} /></div>
        </div>
        <div className="overflow-x-auto border-t border-border/60">
          <table className="w-full min-w-[840px] text-sm">
            <thead><tr className="border-b border-border/60 bg-muted/30 text-muted-foreground"><th className="h-10 px-6 text-left font-medium uppercase text-[10px] tracking-widest">Vehiculo</th><th className="h-10 px-6 text-left font-medium uppercase text-[10px] tracking-widest">Ingreso / Tiempo</th><th className="h-10 px-6 text-left font-medium uppercase text-[10px] tracking-widest">Pago / Tarifa</th><th className="h-10 px-6 text-right font-medium uppercase text-[10px] tracking-widest">Accion</th></tr></thead>
            <tbody className="divide-y divide-border/60">
              {filtered.map(vehicle => {
                const diff = now - vehicle.entryTime;
                const hrs = Math.floor(diff / 3600000);
                const mins = Math.floor((diff % 3600000) / 60000);
                const billedHrs = Math.max(1, Math.ceil(diff / 3600000));
                const total = vehicle.isMonthly ? 0 : billedHrs * vehicle.appliedRate;
                return <tr key={vehicle.id} className="transition-colors hover:bg-muted/20"><td className="px-6 py-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/70 bg-muted/20 text-muted-foreground">{vehicle.type === 'AUTOMOVIL' && <Car size={18} />}{vehicle.type === 'MOTOCICLETA' && <Bike size={18} className="rotate-12" />}{vehicle.type === 'BICICLETA' && <Bike size={18} />}{vehicle.type === 'BUS' && <Bus size={18} />}{vehicle.type === 'CAMION' && <Truck size={18} />}</div><div className="flex flex-col"><span className="text-base font-black text-foreground">{vehicle.plate}</span><span className="text-[10px] font-bold uppercase text-muted-foreground">{vehicle.type}</span></div></div></td><td className="px-6 py-4"><div className="flex flex-col text-xs"><span className="font-bold text-foreground/80">{hrs}h {mins}m transcurridas</span><div className="flex items-center gap-1.5 text-muted-foreground"><span className="font-medium text-emerald-500">{new Date(vehicle.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</span><span className="text-[10px]">({new Date(vehicle.entryTime).toLocaleDateString([], { day: '2-digit', month: 'short' })})</span></div></div></td><td className="px-6 py-4">{vehicle.isMonthly ? <div className="flex flex-col gap-1"><Badge variant="outline" className="w-fit border-sky-200/70 bg-sky-100/60 text-[10px] font-bold text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300">MENSUALIDAD</Badge>{vehicle.ownerInfo && <span className="text-[10px] font-medium text-muted-foreground">{vehicle.ownerInfo.name}</span>}</div> : <div className="flex flex-col"><span className="text-base font-black text-foreground">${formatCurrency(total)}</span><span className="text-[10px] font-medium text-muted-foreground">Tarifa: ${formatCurrency(vehicle.appliedRate)}/h</span></div>}</td><td className="px-6 py-4 text-right"><Button variant="outline" size="sm" onClick={() => { setSelectedVehicle(vehicle); setIsExitModalOpen(true); }}>Salida</Button></td></tr>
              })}
              {filtered.length === 0 && <tr><td colSpan={4} className="py-20 text-center italic text-muted-foreground">No hay vehiculos en patio</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      <Sheet open={isExitModalOpen} onOpenChange={setIsExitModalOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl border-none shadow-2xl bg-zinc-950 text-white p-0">
          {selectedVehicle && (() => {
            const diff = now - selectedVehicle.entryTime;
            const hrs = Math.floor(diff / 3600000);
            const mins = Math.floor((diff % 3600000) / 60000);
            const billedHrs = Math.max(1, Math.ceil(diff / 3600000));
            const total = selectedVehicle.isMonthly ? 0 : billedHrs * selectedVehicle.appliedRate;
            return <div className="flex flex-col"><div className="px-6 pt-6 pb-4 border-b border-zinc-800/60"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1">Finalizando servicio</p><h2 className="text-2xl font-black text-white tracking-tight">{selectedVehicle.plate}</h2><p className="text-xs text-zinc-500 font-medium mt-0.5">{selectedVehicle.type}</p></div><div className="text-right"><p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1">Tiempo</p><p className="text-2xl font-black text-white">{hrs}h {mins}m</p><p className="text-[10px] text-zinc-600 font-medium">Ingreso: {new Date(selectedVehicle.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</p></div></div></div><div className="px-6 py-5 border-b border-zinc-800/60 flex items-center justify-between"><p className="text-sm font-bold text-zinc-500">Total a cobrar</p><p className="text-4xl font-black text-emerald-400 tracking-tight">${formatCurrency(total)}</p></div><div className="px-6 py-5 border-b border-zinc-800/60"><p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3">Forma de Pago</p><div className="grid grid-cols-2 gap-3"><button type="button" onClick={() => setPaymentMethod('EFECTIVO')} className={`h-14 rounded-2xl text-sm font-bold border transition-all ${paymentMethod === 'EFECTIVO' ? 'bg-white text-zinc-900 border-white shadow-lg' : 'bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-600 hover:text-zinc-300'}`}>Efectivo</button><button type="button" onClick={() => setPaymentMethod('TRANSFERENCIA')} className={`h-14 rounded-2xl text-sm font-bold border transition-all ${paymentMethod === 'TRANSFERENCIA' ? 'bg-white text-zinc-900 border-white shadow-lg' : 'bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-600 hover:text-zinc-300'}`}>Transferencia</button></div></div><div className="px-6 py-5 flex flex-col gap-2"><Button className="h-14 text-base font-black rounded-2xl bg-emerald-500 hover:bg-emerald-400 border-none shadow-lg shadow-emerald-500/20 text-white tracking-wide" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate({ vehicle: selectedVehicle, method: paymentMethod, amount: total })}>{deleteMutation.isPending ? <Loader2 className="animate-spin" /> : "REGISTRAR SALIDA"}</Button><Button variant="ghost" className="h-10 flex items-center justify-center gap-2 text-zinc-700 hover:text-blue-400 hover:bg-zinc-900 font-bold text-[10px] uppercase tracking-widest rounded-2xl" onClick={() => handlePrint(selectedVehicle, total, paymentMethod)}><Bluetooth className="h-3.5 w-3.5" />Imprimir Tiquete Manual</Button></div></div>;
          })()}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default DashboardView;
