import { useEffect, useMemo, useState } from 'react';
import { onSnapshot } from 'firebase/firestore';

import { VEHICLE_RATES, type ParkingSettings, type VehicleType } from '@/components/types';
import { parkingSettingsDocument } from '@/components/util';
import { safeGetDoc, safeSetDoc } from '@/lib/firestore-safe';

const SETTINGS_KEY = 'parking_settings';
const DEFAULT_CAPACITY = 50;

const defaultSettings: ParkingSettings = {
  capacity: DEFAULT_CAPACITY,
  capacityAutos: 20,
  capacityMotos: 20,
  capacityBicis: 10,
  rates: VEHICLE_RATES,
};

const normalizeSettings = (incoming?: Partial<ParkingSettings>): ParkingSettings => ({
  capacity:
    typeof incoming?.capacity === 'number' && incoming.capacity > 0
      ? incoming.capacity
      : DEFAULT_CAPACITY,
  capacityAutos: typeof incoming?.capacityAutos === 'number' && incoming.capacityAutos > 0 ? incoming.capacityAutos : 20,
  capacityMotos: typeof incoming?.capacityMotos === 'number' && incoming.capacityMotos > 0 ? incoming.capacityMotos : 20,
  capacityBicis: typeof incoming?.capacityBicis === 'number' && incoming.capacityBicis > 0 ? incoming.capacityBicis : 10,
  rates: {
    ...VEHICLE_RATES,
    ...incoming?.rates,
  },
});

const readSettings = (): ParkingSettings => {
  if (typeof window === 'undefined') return defaultSettings;

  const rawSettings = window.localStorage.getItem(SETTINGS_KEY);
  if (!rawSettings) return defaultSettings;

  try {
    return normalizeSettings(JSON.parse(rawSettings) as Partial<ParkingSettings>);
  } catch (error) {
    console.error('Error al leer configuracion de parqueadero:', error);
    return defaultSettings;
  }
};

export const useParkingSettings = () => {
  const [settings, setSettings] = useState<ParkingSettings>(readSettings);
  const [isRemoteReady, setIsRemoteReady] = useState(false);
  const settingsDocRef = useMemo(() => parkingSettingsDocument(), []);

  useEffect(() => {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    let mounted = true;

    safeGetDoc(settingsDocRef)
      .then((snapshot) => {
        if (!mounted) return;
        if (snapshot.exists()) {
          setSettings(normalizeSettings(snapshot.data() as Partial<ParkingSettings>));
        }
        setIsRemoteReady(true);
      })
      .catch((error) => {
        console.error('No se pudo cargar la configuracion remota:', error);
        setIsRemoteReady(true);
      });

    const unsubscribe = onSnapshot(
      settingsDocRef,
      (snapshot) => {
        if (!snapshot.exists()) return;
        setSettings(normalizeSettings(snapshot.data() as Partial<ParkingSettings>));
      },
      (error) => {
        console.error('No se pudo escuchar la configuracion remota:', error);
      }
    );

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [settingsDocRef]);

  const persistSettings = async (nextSettings: ParkingSettings) => {
    setSettings(nextSettings);
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(nextSettings));

    try {
      await safeSetDoc(settingsDocRef, nextSettings, { merge: true });
    } catch (error) {
      console.error('No se pudo guardar la configuracion remota:', error);
    }
  };

  const updateCapacity = (capacity: number) => {
    void persistSettings({
      ...settings,
      capacity: Math.max(1, capacity),
    });
  };

  const updateCapacityAutos = (capacity: number) => {
    void persistSettings({ ...settings, capacityAutos: Math.max(1, capacity) });
  };

  const updateCapacityMotos = (capacity: number) => {
    void persistSettings({ ...settings, capacityMotos: Math.max(1, capacity) });
  };

  const updateCapacityBicis = (capacity: number) => {
    void persistSettings({ ...settings, capacityBicis: Math.max(1, capacity) });
  };

  const updateRate = (vehicleType: VehicleType, rate: number) => {
    void persistSettings({
      ...settings,
      rates: {
        ...settings.rates,
        [vehicleType]: Math.max(0, rate),
      },
    });
  };

  const resetSettings = () => {
    void persistSettings(defaultSettings);
  };

  return {
    settings,
    capacity: settings.capacity,
    capacityAutos: settings.capacityAutos || 20,
    capacityMotos: settings.capacityMotos || 20,
    capacityBicis: settings.capacityBicis || 10,
    rates: settings.rates,
    isRemoteReady,
    updateCapacity,
    updateCapacityAutos,
    updateCapacityMotos,
    updateCapacityBicis,
    updateRate,
    resetSettings,
  };
};
