
import admin from 'firebase-admin';

// En un entorno de Google Cloud (como App Hosting), el SDK de Admin
// puede encontrar las credenciales de servicio automáticamente.
// No es necesario pasarle ninguna configuración a initializeApp().
if (!admin.apps.length) {
  try {
    admin.initializeApp();
    console.log("Firebase Admin SDK initialized successfully.");
  } catch (error) {
    console.error("Failed to initialize Firebase Admin SDK:", error);
  }
}

const adminDb = admin.apps.length ? admin.firestore() : null;
const adminStorage = admin.apps.length ? admin.storage() : null;

export { admin, adminDb, adminStorage };
