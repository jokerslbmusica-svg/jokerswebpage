
'use server';

import { revalidatePath } from "next/cache";
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  try {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
    });
  } catch (error: any) {
    console.error("Firebase Admin initialization error:", error.message);
  }
}


const adminDb = admin.firestore();
const BAND_INFO_COLLECTION = "band-info";
const BIO_DOC_ID = "biography";

/**
 * Saves the band's official biography to Firestore.
 * @param bioText - The biography text to save.
 */
export async function saveBandBio(bioText: string) {
  const bioRef = adminDb.collection(BAND_INFO_COLLECTION).doc(BIO_DOC_ID);
  await bioRef.set({
    text: bioText,
    updatedAt: new Date(),
  }, { merge: true });
  revalidatePath("/"); // Revalidate home page to show new bio
  revalidatePath("/admin");
}

/**
 * Retrieves the band's official biography from Firestore.
 * @returns The biography text or null if it doesn't exist.
 */
export async function getBandBio(): Promise<string | null> {
  const bioRef = adminDb.collection(BAND_INFO_COLLECTION).doc(BIO_DOC_ID);
  const docSnap = await bioRef.get();

  if (docSnap.exists) {
    return docSnap.data()?.text;
  } else {
    return null;
  }
}

/**
 * A server action that generates a band biography.
 * This function is intended to be called from client-side components.
 * @param input - The input data for generating the biography.
 * @returns An object with either the generated biography or an error message.
 */
export async function getBio(input: any) {
    console.warn("Genkit dependencies are not installed. Skipping AI generation.");
    // Return a dummy response or an error.
    return { 
        success: false, 
        error: "La función de IA no está disponible en este momento. Por favor, inténtelo de nuevo más tarde." 
    };
}
