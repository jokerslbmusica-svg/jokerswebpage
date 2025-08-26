
// Server-side code
"use server";

import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase-admin";

const FAN_GALLERY_COLLECTION = "fan-gallery";

// Helper to convert file to Base64
async function fileToBase64(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    return `data:${file.type};base64,${base64}`;
}

/**
 * Uploads a new image to the fan gallery in Firestore.
 * @param formData - The form data containing the file to upload.
 * @returns The uploaded media item with its id, name, URL (as data URI), and type.
 */
export async function uploadFanMedia(formData: FormData) {
  if (!adminDb) {
    console.error("Firebase Admin SDK not initialized.");
    throw new Error("El servidor no pudo conectarse a la base de datos.");
  }
  const file = formData.get("file") as File;
  if (!file) {
    throw new Error("No file provided.");
  }

  // For now, we only allow images to avoid large base64 strings in Firestore
  if (!file.type.startsWith('image/')) {
    throw new Error("Only image files are allowed.");
  }
  
  const dataUrl = await fileToBase64(file);

  const docRef = await adminDb.collection(FAN_GALLERY_COLLECTION).add({
    name: file.name,
    url: dataUrl,
    type: 'image',
    createdAt: new Date(),
  });

  revalidatePath("/"); // Update the cache for the home page
  revalidatePath("/admin");

  return {
    id: docRef.id,
    name: file.name,
    url: dataUrl,
    type: 'image' as const,
  };
}

/**
 * Retrieves all media items from the fan gallery collection in Firestore.
 * @returns A list of media items.
 */
export async function getFanMedia() {
    if (!adminDb) {
        console.error("Firebase Admin SDK not initialized. Cannot fetch fan media.");
        return [];
    }
    const snapshot = await adminDb.collection(FAN_GALLERY_COLLECTION).orderBy("createdAt", "desc").get();
    
    if (snapshot.empty) {
        return [];
    }

    const items = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            id: doc.id,
            name: data.name,
            url: data.url,
            type: data.type as 'image' | 'video',
        };
    });

    return items;
}


/**
 * Deletes an image from the fan gallery in Firestore.
 * @param itemId - The ID of the document to delete.
 */
export async function deleteFanMedia(itemId: string) {
  if (!adminDb) {
    console.error("Firebase Admin SDK not initialized.");
    throw new Error("El servidor no pudo conectarse a la base de datos.");
  }
  if (!itemId) {
    throw new Error("Item ID not provided.");
  }
  await adminDb.collection(FAN_GALLERY_COLLECTION).doc(itemId).delete();
  
  revalidatePath("/");
  revalidatePath("/admin");
}
