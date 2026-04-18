import { collection, doc } from "firebase/firestore";
import { db } from "@/firebase/firebase";

export const retrieveVehiclesCollection = () => collection(db, 'parked_vehicles');
export const retrieveSubscribersCollection = () => collection(db, 'subscribers');
export const retrieveHistoryCollection = () => collection(db, 'history');
export const retrieveUsersCollection = () => collection(db, 'usuario');

export const deliverVehicleEntry = () => collection(db, 'parked_vehicles');
export const deliverSubscriberData = () => collection(db, 'subscribers');
export const deliverHistoryEntry = () => collection(db, 'history');
export const deliverUserData = () => collection(db, 'usuario');

export const parkingSettingsDocument = () =>
  doc(db, 'artifacts', 'public', 'data', 'settings');

export const userProfileDocument = (email: string) =>
  doc(db, 'usuario', email);
