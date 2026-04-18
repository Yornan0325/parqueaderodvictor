import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import type { User } from 'firebase/auth';
import { addDoc, getDocs, query } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { Car, Bike, Truck, DollarSign, Loader2, Bus, Motorbike } from 'lucide-react';

import { type VehicleType, type Subscriber, type ParkedVehicle } from '@/components/types';
import { retrieveSubscribersCollection, deliverVehicleEntry, deliverSubscriberData, retrieveVehiclesCollection } from '@/components/util';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SwitchChoiceCard } from '@/components/shared/SwitchChoiceCard';
import { db } from '@/firebase/firebase';
import { usePrinter } from '@/hooks/use-printer';
import { generateEntryTicket } from '@/lib/receipt-utils';
import { formatCurrency } from '@/lib/formatters';
import { getPlateValidationError, normalizePlate } from '@/lib/plate-utils';
import { useParkingSettings } from '@/hooks/use-parking-settings';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const isSubscriberActive = (subscriber: Subscriber) => {
  const expiryDate = new Date(`${subscriber.expiryDate}T23:59:59`);
  return expiryDate.getTime() >= Date.now();
};

const EntryView = ({ user, onComplete }: { user: User; onComplete: () => void }) => {
  const queryClient = useQueryClient();
  const { print, isConnected } = usePrinter();
  const { capacity, rates } = useParkingSettings();

  const [plate, setPlate] = useState('');
  const [type, setType] = useState<VehicleType>('AUTOMOVIL');
  const [isMonthly, setIsMonthly] = useState(false);
  const [manualRate, setManualRate] = useState(rates.AUTOMOVIL);
  const [owner, setOwner] = useState({ name: '', id: '', phone: '' });

  const { data: subscribers = [] } = useQuery({
    queryKey: ['subscribers'],
    queryFn: async () => {
      const snapshot = await getDocs(query(retrieveSubscribersCollection()));
      return snapshot.docs.map((docItem) => ({
        ...docItem.data(),
        id: docItem.id,
      })) as Subscriber[];
    },
    enabled: !!user,
  });

  const { data: parkedVehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const snapshot = await getDocs(query(retrieveVehiclesCollection()));
      return snapshot.docs.map((docItem) => ({
        ...docItem.data(),
        id: docItem.id,
      })) as ParkedVehicle[];
    },
    enabled: !!user,
  });

  const entryMutation = useMutation({
    mutationFn: async (newVehicle: {
      plate: string;
      type: VehicleType;
      isMonthly: boolean;
      appliedRate: number;
      ownerInfo?: {
        name: string;
        documentId: string;
        phone: string;
        monthlyFee?: number;
      };
    }) => {
      if (!db) throw new Error('Base de datos no conectada');

      const plateUpper = newVehicle.plate.toUpperCase();

      if (newVehicle.isMonthly) {
        const alreadySubscriber = subscribers.some(
          (subscriber) => subscriber.plate.toUpperCase() === plateUpper
        );

        if (!alreadySubscriber) {
          await addDoc(deliverSubscriberData(), {
            name: owner.name,
            documentId: owner.id,
            phone: owner.phone,
            plate: plateUpper,
            monthlyFee: manualRate,
            type,
            createdAt: Date.now(),
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0],
          });
        }
      }

      return addDoc(deliverVehicleEntry(), {
        ...newVehicle,
        entryTime: Date.now(),
        status: 'PARKED',
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['subscribers'] });

      toast.success('Ingreso autorizado correctamente');

      if (isConnected) {
        const ticketData = generateEntryTicket({
          plate: variables.plate,
          type: variables.type,
          entryTime: Date.now(),
          isMonthly: variables.isMonthly,
          appliedRate: variables.appliedRate,
        });
        print(ticketData);
      }

      resetForm();
      onComplete();
    },
    onError: (error: Error) => {
      console.error('Error:', error);
      toast.error(`Error al guardar: ${error.message}`);
    },
  });

  useEffect(() => {
    if (!isMonthly) {
      setManualRate(rates[type] || 0);
    }
  }, [type, isMonthly, rates]);

  useEffect(() => {
    if (plate.length < 3) return;

    const found = subscribers.find(
      (subscriber) => subscriber.plate.toUpperCase() === plate.toUpperCase()
    );

    if (!found) return;

    setOwner({
      name: found.name,
      id: found.documentId || '',
      phone: found.phone || '',
    });
    setType(found.type as VehicleType);

    if (isSubscriberActive(found)) {
      setIsMonthly(true);
      setManualRate(found.monthlyFee);
      return;
    }

    setIsMonthly(false);
    setManualRate(rates[found.type as VehicleType] || 0);
  }, [plate, subscribers, rates]);

  const resetForm = () => {
    setPlate('');
    setOwner({ name: '', id: '', phone: '' });
    setIsMonthly(false);
    setType('AUTOMOVIL');
    setManualRate(rates.AUTOMOVIL);
  };

  const plateError = getPlateValidationError(plate, type);

  const handleEntry = (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedPlate = normalizePlate(plate);

    if (!normalizedPlate) {
      return toast.error('La placa es obligatoria');
    }

    if (normalizedPlate.length !== 6) {
      return toast.error('La placa debe tener exactamente 6 caracteres');
    }

    const validationError = getPlateValidationError(normalizedPlate, type);
    if (validationError) {
      return toast.error(validationError);
    }

    if (parkedVehicles.some((vehicle) => vehicle.plate.toUpperCase() === normalizedPlate)) {
      return toast.error('Esta placa ya tiene un ingreso activo');
    }

    if (parkedVehicles.length >= capacity) {
      return toast.error('No hay cupos disponibles en este momento');
    }

    if (manualRate <= 0 && !isMonthly) {
      return toast.error('La tarifa debe ser mayor a cero');
    }

    if (isMonthly && (!owner.name || !owner.id)) {
      return toast.warning('Complete los datos del propietario');
    }

    entryMutation.mutate({
      plate: normalizedPlate,
      type,
      isMonthly,
      appliedRate: isMonthly ? 0 : manualRate,
      ...(isMonthly && {
        ownerInfo: {
          name: owner.name,
          documentId: owner.id,
          phone: owner.phone,
          monthlyFee: manualRate,
        },
      }),
    });
  };

  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\./g, '');
    if (!Number.isNaN(Number(rawValue))) {
      setManualRate(Number(rawValue));
    }
  };

  return (
    <Card className="p-2 border-1 border-zinc-300 mx-auto animate-in slide-in-from-bottom-4">
      <CardHeader>
        <CardTitle>Registro de Entrada</CardTitle>
        <CardDescription>Capture los datos del vehiculo y defina la tarifa.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleEntry} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Placa</label>
              <Input
                placeholder="ABC123"
                className={cn(
                  'text-2xl font-semibold uppercase h-14 focus:ring-2 transition-all',
                  plateError ? 'border-red-500 focus:ring-red-500 bg-red-50/10' : 'focus:ring-zinc-900'
                )}
                value={plate}
                maxLength={6}
                onChange={(e) => setPlate(normalizePlate(e.target.value))}
              />
              {plateError && (
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight animate-in fade-in slide-in-from-top-1">
                  {plateError}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Categoria</label>
              <div className="grid grid-cols-5 gap-2 h-14">
                {(Object.keys(rates) as VehicleType[]).map((vehicleType) => (
                  <Button
                    key={vehicleType}
                    type="button"
                    onClick={() => setType(vehicleType)}
                    title={vehicleType}
                    className={`flex items-center focus:ring-2 focus:ring-zinc-900 h-14 justify-center rounded-md border transition-all ${type === vehicleType ? 'bg-zinc-900 border-zinc-900 text-white shadow-md' : ' border-zinc-200 text-zinc-400 hover:border-zinc-400'}`}
                  >
                    {vehicleType === 'AUTOMOVIL' && <Car size={24} />}
                    {vehicleType === 'MOTOCICLETA' && <Motorbike size={24} className="rotate-12" />}
                    {vehicleType === 'BICICLETA' && <Bike size={24} />}
                    {vehicleType === 'CAMION' && <Truck size={24} />}
                    {vehicleType === 'BUS' && <Bus size={24} />}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 border border-zinc-200 rounded-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-zinc-800 rounded-lg flex items-center justify-center text-blue-400">
                <DollarSign size={16} />
              </div>
              <div>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest">
                  {isMonthly ? 'Costo Mensual' : 'Tarifa por Hora'}
                </CardDescription>
                <CardDescription className="text-zinc-500">Valor a aplicar</CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2 justify-start md:justify-end">
              <span className="text-xl font-bold text-zinc-500">$</span>
              <Input
                type="text"
                className="text-center text-xl md:w-30 md:text-2xl font-black outline-none max-w-40"
                value={formatCurrency(manualRate)}
                onChange={handleRateChange}
              />
            </div>
          </div>

          <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/60 p-4 text-sm text-zinc-500">
            Cupos disponibles: <span className="font-black text-zinc-900">{Math.max(capacity - parkedVehicles.length, 0)}</span>
          </div>

          <div className={`${isMonthly ? 'items-center border-1 border-zinc-200 rounded-xl p-6 ' : ''}`}>
            <SwitchChoiceCard
              isMonthly={isMonthly}
              setIsMonthly={setIsMonthly}
              owner={owner}
              setOwner={setOwner}
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-lg"
            disabled={entryMutation.isPending}
            variant="outline"
          >
            {entryMutation.isPending ? <Loader2 className="animate-spin" /> : 'Autorizar Ingreso'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default EntryView;
