import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

// This configuration is used for client-side Firebase services.
// It's safe to expose these values.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase for client-side
// This guard ensures that we're not re-initializing the app on every render,
// and that it's only initialized on the client-side.
const getClientFirebaseApp = (): FirebaseApp => {
    if (getApps().length) {
        return getApp();
    }
    return initializeApp(firebaseConfig);
}

// Functions to get Firebase services, ensuring they are only initialized once.
const getClientAuth = (): Auth => {
    return getAuth(getClientFirebaseApp());
}

const getClientDb = (): Firestore => {
    return getFirestore(getClientFirebaseApp());
}

const getClientStorage = (): FirebaseStorage => {
    return getStorage(getClientFirebaseApp());
}

// Export functions to be used in components
export const app: FirebaseApp = getClientFirebaseApp();
export const auth: Auth = getClientAuth();
export const db: Firestore = getClientDb();
export const storage: FirebaseStorage = getClientStorage();
