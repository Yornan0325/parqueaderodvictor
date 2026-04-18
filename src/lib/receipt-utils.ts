import ReceiptPrinterEncoder from '@point-of-sale/receipt-printer-encoder';
import type { ParkedVehicle } from '@/components/types';
import { formatCurrency } from '@/lib/formatters';

const formatDate = (date: number | string) => {
  return new Date(date).toLocaleString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

export const generateEntryTicket = (vehicle: ParkedVehicle) => {
  const encoder = new ReceiptPrinterEncoder();
  
  return encoder
    .initialize()
    .codepage('cp858')
    .align('center')
    .size('double')
    .text("D'VICTOR")
    .newline()
    .size('normal')
    .text('PARQUEADERO')
    .newline()
    .text('--------------------------------')
    .newline()
    .align('left')
    .text(`FECHA: ${formatDate(Date.now())}`)
    .newline()
    .newline()
    .size('double')
    .align('center')
    .text(vehicle.plate)
    .newline()
    .size('normal')
    .text(`TIPO: ${vehicle.type}`)
    .newline()
    .newline()
    .align('center')
    .text('--------------------------------')
    .newline()
    .text('Gracias por su visita')
    .newline()
    .newline()
    .newline()
    .cut()
    .encode();
};

export const generateExitTicket = (vehicle: ParkedVehicle, exitTime: number, total: number, paymentMethod: string) => {
  const encoder = new ReceiptPrinterEncoder();
  const diff = exitTime - vehicle.entryTime;
  const hrs = Math.ceil(diff / 3600000);

  return encoder
    .initialize()
    .codepage('cp858')
    .align('center')
    .size('double')
    .text("D'VICTOR")
    .newline()
    .size('normal')
    .text('RECIBO DE PAGO')
    .newline()
    .text('--------------------------------')
    .newline()
    .align('left')
    .text(`INGRESO: ${formatDate(vehicle.entryTime)}`)
    .newline()
    .text(`SALIDA:  ${formatDate(exitTime)}`)
    .newline()
    .text(`TIEMPO:  ${hrs}h`)
    .newline()
    .text(`PLACA:   ${vehicle.plate}`)
    .newline()
    .text(`PAGO:    ${paymentMethod}`)
    .newline()
    .newline()
    .align('right')
    .size('double')
    .text(`TOTAL: $${formatCurrency(total)}`)
    .newline()
    .size('normal')
    .align('center')
    .newline()
    .text('--------------------------------')
    .newline()
    .text('Gracias por su visita')
    .newline()
    .newline()
    .newline()
    .cut()
    .encode();
};
