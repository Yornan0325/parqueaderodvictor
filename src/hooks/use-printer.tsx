import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { toast } from 'sonner';

interface PrinterContextType {
  isConnected: boolean;
  isConnecting: boolean;
  deviceName: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  print: (data: Uint8Array) => Promise<void>;
}

const PrinterContext = createContext<PrinterContextType | null>(null);

export const PrinterProvider = ({ children }: { children: ReactNode }) => {
  const [device, setDevice] = useState<BluetoothDevice | null>(null);
  const [characteristic, setCharacteristic] = useState<BluetoothRemoteGATTCharacteristic | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const connect = useCallback(async () => {
    if (!navigator.bluetooth) {
      toast.error('Bluetooth no soportado en este navegador');
      return;
    }

    setIsConnecting(true);
    try {
      const selectedDevice = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          '0000ff00-0000-1000-8000-00805f9b34fb', 
          '000018f0-0000-1000-8000-00805f9b34fb',
          '49535343-fe7d-4ae5-8fa9-9fafd205e455'
        ]
      });

      const server = await selectedDevice.gatt?.connect();
      if (!server) throw new Error('No se pudo conectar al servidor GATT');

      // Intentar encontrar un servicio de escritura compatible
      const services = await server.getPrimaryServices();
      let foundChar = null;

      for (const service of services) {
        const characteristics = await service.getCharacteristics();
        foundChar = characteristics.find(c => c.properties.write || c.properties.writeWithoutResponse);
        if (foundChar) break;
      }

      if (!foundChar) throw new Error('No se encontró una característica de escritura en la impresora');

      setDevice(selectedDevice);
      setCharacteristic(foundChar);
      toast.success(`Conectado a ${selectedDevice.name}`);

      selectedDevice.addEventListener('gattserverdisconnected', () => {
        setDevice(null);
        setCharacteristic(null);
        toast.info('Impresora desconectada');
      });

    } catch (error: any) {
      console.error('Error de Bluetooth:', error);
      if (error.name !== 'NotFoundError') {
        toast.error(`Error de conexión: ${error.message}`);
      }
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (device?.gatt?.connected) {
      device.gatt.disconnect();
    }
    setDevice(null);
    setCharacteristic(null);
  }, [device]);

  const print = useCallback(async (data: Uint8Array) => {
    if (!characteristic) {
      toast.error('La impresora no está conectada');
      return;
    }

    try {
      // Las impresoras térmicas suelen tener un límite de buffer, enviamos en trozos si es necesario
      const chunkSize = 512;
      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        await characteristic.writeValue(chunk);
      }
    } catch (error: any) {
      console.error('Error de impresión:', error);
      toast.error('Error al enviar datos a la impresora');
    }
  }, [characteristic]);

  return (
    <PrinterContext.Provider value={{
      isConnected: !!device,
      isConnecting,
      deviceName: device?.name || null,
      connect,
      disconnect,
      print
    }}>
      {children}
    </PrinterContext.Provider>
  );
};

export const usePrinter = () => {
  const context = useContext(PrinterContext);
  if (!context) throw new Error('usePrinter debe usarse dentro de un PrinterProvider');
  return context;
};
