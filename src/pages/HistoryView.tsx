import { useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import { useQuery } from '@tanstack/react-query';
import { orderBy, query } from 'firebase/firestore';
import { Clock3, Loader2, Search, Printer, DollarSign, Wallet, ArrowRightLeft } from 'lucide-react';

import { retrieveHistoryCollection } from '@/components/util';
import type { HistoryEntry } from '@/components/types';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/formatters';
import { safeGetDocs } from '@/lib/firestore-safe';
import { usePrinter } from '@/hooks/use-printer';
import { generateExitTicket } from '@/lib/receipt-utils';

const getDurationStr = (entryTime: number, exitTime: number) => {
  const diff = exitTime - entryTime;
  const totalMins = Math.floor(diff / 60000);
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
};

const HistoryView = ({ user }: { user: User }) => {
  const { print } = usePrinter();
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'EFECTIVO' | 'TRANSFERENCIA'>('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const { data: historyEntries = [], isLoading } = useQuery({
    queryKey: ['history'],
    queryFn: async () => {
      const snapshot = await safeGetDocs(query(retrieveHistoryCollection(), orderBy('exitTime', 'desc')));
      return snapshot.docs.map((docItem) => ({ ...docItem.data(), id: docItem.id })) as HistoryEntry[];
    },
    enabled: !!user,
  });

  const filteredHistory = useMemo(() => historyEntries.filter((entry) => {
    const matchesPlate = entry.plate.toLowerCase().includes(search.toLowerCase());
    const matchesPayment = paymentFilter === 'ALL' || entry.paymentMethod === paymentFilter;
    const entryDate = new Date(entry.exitTime);
    const matchesFrom = !fromDate || entryDate >= new Date(`${fromDate}T00:00:00`);
    const matchesTo = !toDate || entryDate <= new Date(`${toDate}T23:59:59`);
    return matchesPlate && matchesPayment && matchesFrom && matchesTo;
  }), [historyEntries, search, paymentFilter, fromDate, toDate]);

  const totalCollected = useMemo(() => filteredHistory.reduce((sum, entry) => sum + Number(entry.totalPaid || 0), 0), [filteredHistory]);
  const paymentSummary = useMemo(() => ({
    efectivo: filteredHistory.filter((entry) => entry.paymentMethod === 'EFECTIVO').reduce((sum, entry) => sum + Number(entry.totalPaid || 0), 0),
    transferencia: filteredHistory.filter((entry) => entry.paymentMethod === 'TRANSFERENCIA').reduce((sum, entry) => sum + Number(entry.totalPaid || 0), 0),
  }), [filteredHistory]);

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-muted-foreground" strokeWidth={1} size={40} /></div>;

  const handleReprint = (entry: HistoryEntry) => {
    const ticketData = generateExitTicket(entry as any, entry.exitTime, Number(entry.totalPaid || 0), entry.paymentMethod || 'EFECTIVO');
    print(ticketData);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="grid gap-2 sm:gap-4 md:grid-cols-[1fr_auto]">
        <Card className="border border-border/70 bg-card/80 shadow-sm transition-all duration-300">
          <div className="flex flex-row items-center justify-between px-2 pt-2 pb-0 sm:px-3 sm:pt-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Recaudo visible</span>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="px-2 pb-2 sm:px-3 sm:pb-3">
            <div className="text-3xl font-black text-foreground">${formatCurrency(totalCollected)}</div>
            <span className="text-[10px] sm:text-xs text-muted-foreground block">Basado en registros filtrados.</span>
          </div>
        </Card>
        
        <Card className="border border-border/70 bg-card/80 shadow-sm transition-all duration-300 min-w-[140px] sm:min-w-[180px]">
          <div className="flex flex-row items-center justify-between px-2 pt-2 pb-0 sm:px-3 sm:pt-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Servicios</span>
            <Clock3 className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="px-2 pb-2 sm:px-3 sm:pb-3">
            <div className="text-3xl font-black text-foreground">{filteredHistory.length}</div>
            <span className="text-[10px] sm:text-xs text-muted-foreground block">Despachados.</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        <Card className="border border-border/70 bg-card/80 shadow-sm transition-all duration-300">
          <div className="flex flex-row items-center justify-between px-2 pt-2 pb-0 sm:px-3 sm:pt-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Efectivo</span>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="px-2 pb-2 sm:px-3 sm:pb-3">
            <div className="text-xl sm:text-2xl font-black text-foreground">${formatCurrency(paymentSummary.efectivo)}</div>
          </div>
        </Card>
        <Card className="border border-border/70 bg-card/80 shadow-sm transition-all duration-300">
          <div className="flex flex-row items-center justify-between px-2 pt-2 pb-0 sm:px-3 sm:pt-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Transferencia</span>
            <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="px-2 pb-2 sm:px-3 sm:pb-3">
            <div className="text-xl sm:text-2xl font-black text-foreground">${formatCurrency(paymentSummary.transferencia)}</div>
          </div>
        </Card>
      </div>

      <Card className="border border-border/70 bg-card/80 shadow-sm transition-all duration-300">
        <div className="flex flex-col gap-4 border-b border-border/60 p-4 sm:p-6 md:flex-row md:items-start md:justify-between">
          <div><h2 className="text-2xl font-black text-foreground">Historial</h2><p className="text-sm text-muted-foreground">Consulta las salidas registradas y el recaudo asociado.</p></div>
          <div className="grid w-full gap-3 md:max-w-xl lg:max-w-2xl">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" placeholder="Buscar por placa..." /></div>
              <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value as 'ALL' | 'EFECTIVO' | 'TRANSFERENCIA')} className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors"><option value="ALL">Todos los pagos</option><option value="EFECTIVO">Efectivo</option><option value="TRANSFERENCIA">Transferencia</option></select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-muted-foreground pl-1">Desde</span>
                <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-9 text-xs sm:text-sm" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-muted-foreground pl-1">Hasta</span>
                <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-9 text-xs sm:text-sm" />
              </div>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table className="min-w-[780px]">
          <TableHeader><TableRow className="bg-muted/40"><TableHead className="px-6 text-left text-[10px] uppercase tracking-widest text-muted-foreground w-14">Accion</TableHead><TableHead className="px-6 text-[10px] uppercase tracking-widest text-muted-foreground">Placa</TableHead><TableHead className="px-6 text-[10px] uppercase tracking-widest text-muted-foreground">Tipo</TableHead><TableHead className="px-6 text-[10px] uppercase tracking-widest text-muted-foreground">Entrada</TableHead><TableHead className="px-6 text-[10px] uppercase tracking-widest text-muted-foreground">Salida</TableHead><TableHead className="px-6 text-[10px] uppercase tracking-widest text-muted-foreground">Tiempo</TableHead><TableHead className="px-6 text-[10px] uppercase tracking-widest text-muted-foreground">Pago</TableHead><TableHead className="px-6 text-right text-[10px] uppercase tracking-widest text-muted-foreground">Total</TableHead></TableRow></TableHeader>
          <TableBody>
            {filteredHistory.map((entry) => <TableRow key={entry.id} className="transition-colors hover:bg-muted/25"><TableCell className="px-6 text-left"><Button variant="ghost" size="icon" onClick={() => handleReprint(entry)} className="hover:bg-accent/40"><Printer className="h-4 w-4 text-muted-foreground hover:text-blue-400" /></Button></TableCell><TableCell className="px-6 font-black text-foreground">{entry.plate}</TableCell><TableCell className="px-6 text-[11px] font-bold text-muted-foreground uppercase">{entry.type || 'N/A'}</TableCell><TableCell className="px-6 text-muted-foreground">{new Date(entry.entryTime).toLocaleString()}</TableCell><TableCell className="px-6 text-muted-foreground">{new Date(entry.exitTime).toLocaleString()}</TableCell><TableCell className="px-6 text-muted-foreground font-medium">{getDurationStr(entry.entryTime, entry.exitTime)}</TableCell><TableCell className="px-6 text-muted-foreground">{entry.paymentMethod}</TableCell><TableCell className="px-6 text-right font-black text-foreground">${formatCurrency(Number(entry.totalPaid || 0))}</TableCell></TableRow>)}
            {filteredHistory.length === 0 && <TableRow><TableCell colSpan={8} className="px-6 py-16 text-center text-muted-foreground">No hay registros en el historial para este filtro.</TableCell></TableRow>}
          </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default HistoryView;
