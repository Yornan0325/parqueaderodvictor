import type { VehicleType } from '@/components/types';

export const normalizePlate = (plate: string) =>
  plate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

export const getPlateValidationError = (
  plate: string,
  vehicleType: VehicleType
) => {
  if (plate.length === 0) return null;

  if (plate.length < 6) {
    return 'Faltan caracteres (deben ser 6)';
  }

  if (!/^[A-Z]{3}/.test(plate.slice(0, 3))) {
    return 'Los primeros 3 caracteres deben ser letras';
  }

  if (plate.length === 6) {
    const lastChar = plate[5];
    const isLastNumber = /[0-9]/.test(lastChar);

    if (vehicleType === 'MOTOCICLETA' && isLastNumber) {
      return 'Para motos, el ultimo caracter debe ser una letra';
    }

    if (vehicleType !== 'MOTOCICLETA' && !isLastNumber) {
      return 'Para este vehiculo, el ultimo caracter debe ser un numero';
    }
  }

  return null;
};
