
// --- TIPOS ---
// export type VehicleType = 'CAR' | 'MOTORCYCLE' | 'TRUCK';
export type VehicleType = 'BUS' | 'CAMION' | 'AUTOMOVIL' | 'MOTOCICLETA' | 'BICICLETA';


export interface FirebaseConfig {
  apiKey: string
  authDomain: string
  measurementId: string
  messagingSenderId: string
  projectId: string
  storageBucket: string
}
 // #region CONSTANTS & HELPERS
export const VEHICLE_RATES: Record<VehicleType, number> = {
  BUS: 5000,
  CAMION: 2500,
  AUTOMOVIL: 15000,
  MOTOCICLETA: 1000,
  BICICLETA: 500
};

export interface ParkingSettings {
  capacity: number;
  rates: Record<VehicleType, number>;
}

 export interface Subscriber {
  type: VehicleType;
  id?: string;
  name: string;
  documentId: string;
  plate: string;
  phone: string;
  expiryDate: string;
  monthlyFee: number;
}

export  interface ParkedVehicle {
  id?: string;
  plate: string;
  type: VehicleType;
  entryTime: number;
  isMonthly: boolean;
  appliedRate: number;
  ownerInfo?: {
    name: string;
    documentId: string;
    phone: string;
    monthlyFee?: number;
  };
}

export interface HistoryEntry extends ParkedVehicle {
  exitTime: number;
  totalPaid: number;
  paymentMethod: 'EFECTIVO' | 'TRANSFERENCIA';
  status: 'COMPLETED';
}

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'employee';
  createdAt: string;
  updatedAt?: string;
}
