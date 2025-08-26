
'use server';

import { revalidatePath } from "next/cache";
import {
  generateBio,
  type GenerateBioInput,
} from "@/ai/flows/generate-bio";
import { adminDb } from "@/lib/firebase-admin";

const BAND_INFO_COLLECTION = "band-info";
const BIO_DOC_ID = "biography";

/**
 * Saves the band's official biography to Firestore.
 * @param bioText - The biography text to save.
 */
export async function saveBandBio(bioText: string) {
  if (!adminDb) {
    console.error("Firebase Admin SDK not initialized.");
    throw new Error("El servidor no pudo conectarse a la base de datos.");
  }
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
  if (!adminDb) {
    console.error("Firebase Admin SDK not initialized. Cannot fetch band bio.");
    return null;
  }
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
export async function getBio(input: GenerateBioInput) {
  try {
    const result = await generateBio(input);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error generating biography:", error);
    // Return a user-friendly error message.
    return { success: false, error: "Failed to generate biography. Please try again." };
  }
}
