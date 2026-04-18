import { RotateCcw, Save } from 'lucide-react';

import { VEHICLE_RATES, type VehicleType } from '@/components/types';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useParkingSettings } from '@/hooks/use-parking-settings';
import { formatCurrency } from '@/lib/formatters';
import { toast } from 'sonner';

const ConfigurationView = () => {
  const { capacity, rates, updateCapacity, updateRate, resetSettings, isRemoteReady } =
    useParkingSettings();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card className="border border-zinc-200 p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-2xl font-black text-zinc-900">Configuracion operativa</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Ajusta capacidad y tarifas base para operar el parqueadero.
            </p>
            <p className="mt-2 text-xs text-zinc-400">
              Estado remoto: {isRemoteReady ? 'sincronizado' : 'sincronizando...'}
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { resetSettings(); toast.success('Configuracion restablecida'); }}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Restablecer
            </Button>
            <Button onClick={() => toast.success('Configuracion guardada local y remotamente')}>
              <Save className="mr-2 h-4 w-4" />
              Guardar
            </Button>
          </div>
        </div>
      </Card>

      <Card className="border border-zinc-200 p-6">
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Capacidad del patio</p>
        <div className="mt-3 max-w-xs">
          <Input type="number" min={1} value={capacity} onChange={(e) => updateCapacity(Number(e.target.value))} />
        </div>
      </Card>

      <Card className="border border-zinc-200 p-6">
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Tarifas por defecto</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {(Object.keys(VEHICLE_RATES) as VehicleType[]).map((vehicleType) => (
            <div key={vehicleType} className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4">
              <p className="text-sm font-black text-zinc-900">{vehicleType}</p>
              <p className="mt-1 text-xs text-zinc-400">Valor actual: ${formatCurrency(rates[vehicleType])}</p>
              <Input className="mt-3" value={rates[vehicleType]} onChange={(e) => updateRate(vehicleType, Number(e.target.value) || 0)} type="number" min={0} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default ConfigurationView;
