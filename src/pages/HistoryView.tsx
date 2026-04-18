import { useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import { useQuery } from '@tanstack/react-query';
import { getDocs, orderBy, query } from 'firebase/firestore';
import { Clock3, Loader2, Search } from 'lucide-react';

import { retrieveHistoryCollection } from '@/components/util';
import type { HistoryEntry } from '@/components/types';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/formatters';

const HistoryView = ({ user }: { user: User }) => {
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'EFECTIVO' | 'TRANSFERENCIA'>('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const { data: historyEntries = [], isLoading } = useQuery({
    queryKey: ['history'],
    queryFn: async () => {
      const snapshot = await getDocs(query(retrieveHistoryCollection(), orderBy('exitTime', 'desc')));
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

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-zinc-300" strokeWidth={1} size={40} /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid gap-4 md:grid-cols-[1fr_auto]">
        <Card className="p-5 border border-zinc-200"><p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Recaudo visible</p><p className="mt-2 text-3xl font-black text-zinc-900">${formatCurrency(totalCollected)}</p><p className="mt-1 text-sm text-zinc-500">Basado en los registros filtrados del historial.</p></Card>
        <Card className="p-5 border border-zinc-200 flex items-center gap-3"><div className="rounded-2xl bg-zinc-900 p-3 text-white"><Clock3 className="h-5 w-5" /></div><div><p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Servicios</p><p className="text-2xl font-black text-zinc-900">{filteredHistory.length}</p></div></Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border border-zinc-200 p-5"><p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Efectivo</p><p className="mt-2 text-2xl font-black text-zinc-900">${formatCurrency(paymentSummary.efectivo)}</p></Card>
        <Card className="border border-zinc-200 p-5"><p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Transferencia</p><p className="mt-2 text-2xl font-black text-zinc-900">${formatCurrency(paymentSummary.transferencia)}</p></Card>
      </div>

      <Card className="border border-zinc-200">
        <div className="flex flex-col gap-4 border-b border-zinc-100 p-6 md:flex-row md:items-center md:justify-between">
          <div><h2 className="text-2xl font-black text-zinc-900">Historial</h2><p className="text-sm text-zinc-500">Consulta las salidas registradas y el recaudo asociado.</p></div>
          <div className="grid w-full gap-3 md:max-w-3xl md:grid-cols-4">
            <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" /><Input value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" placeholder="Buscar por placa..." /></div>
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value as 'ALL' | 'EFECTIVO' | 'TRANSFERENCIA')} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"><option value="ALL">Todos los pagos</option><option value="EFECTIVO">Efectivo</option><option value="TRANSFERENCIA">Transferencia</option></select>
          </div>
        </div>
        <Table>
          <TableHeader><TableRow className="bg-zinc-50/60"><TableHead className="px-6 text-[10px] uppercase tracking-widest text-zinc-500">Placa</TableHead><TableHead className="px-6 text-[10px] uppercase tracking-widest text-zinc-500">Entrada</TableHead><TableHead className="px-6 text-[10px] uppercase tracking-widest text-zinc-500">Salida</TableHead><TableHead className="px-6 text-[10px] uppercase tracking-widest text-zinc-500">Pago</TableHead><TableHead className="px-6 text-right text-[10px] uppercase tracking-widest text-zinc-500">Total</TableHead></TableRow></TableHeader>
          <TableBody>
            {filteredHistory.map((entry) => <TableRow key={entry.id}><TableCell className="px-6 font-black text-zinc-900">{entry.plate}</TableCell><TableCell className="px-6 text-zinc-500">{new Date(entry.entryTime).toLocaleString()}</TableCell><TableCell className="px-6 text-zinc-500">{new Date(entry.exitTime).toLocaleString()}</TableCell><TableCell className="px-6 text-zinc-500">{entry.paymentMethod}</TableCell><TableCell className="px-6 text-right font-black text-zinc-900">${formatCurrency(Number(entry.totalPaid || 0))}</TableCell></TableRow>)}
            {filteredHistory.length === 0 && <TableRow><TableCell colSpan={5} className="px-6 py-16 text-center text-zinc-400">No hay registros en el historial para este filtro.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default HistoryView;
