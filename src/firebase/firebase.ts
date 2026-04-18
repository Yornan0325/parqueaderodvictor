import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager, 
  CACHE_SIZE_UNLIMITED,
  type Firestore 
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// 1. Configuración (Variables de entorno)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// 2. Inicialización de la App (Evita duplicados en Hot Module Replacement)
const app: FirebaseApp = getApps().length === 0 
  ? initializeApp(firebaseConfig) 
  : getApps()[0];

// 3. Configuración de Firestore con Cache Persistente (Offline Support)
// Usamos initializeFirestore una sola vez para configurar el TabManager
const db: Firestore = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
    cacheSizeBytes: CACHE_SIZE_UNLIMITED
  })
});

// 4. Configuración de Auth & Storage
const auth = getAuth(app);
const storage = getStorage(app);

// Persistencia local (se mantiene la sesión al cerrar el navegador)
setPersistence(auth, browserLocalPersistence).catch((err) => 
  console.error("Auth Persistence Error:", err)
);

/**
 * ID de la aplicación para las rutas de las colecciones.
 * Se puede obtener de una variable global o entorno.
 */
 
// 5. Exportaciones limpias
export { app, db, auth, storage };