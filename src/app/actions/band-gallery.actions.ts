// Server-side code
"use server";

import { revalidatePath } from "next/cache";
import { adminDb } from '@/lib/firebase-admin';

const BAND_GALLERY_COLLECTION = "band-gallery";

// Helper to convert file to Base64
async function fileToBase64(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    return `data:${file.type};base64,${base64}`;
}

/**
 * Extracts YouTube video ID from various URL formats.
 * @param url - The YouTube URL.
 * @returns The video ID or null if not found.
 */
function getYouTubeID(url: string) {
    const arr = url.split(/(vi\/|v%3D|v=|\/v\/|youtu\.be\/|\/embed\/)/);
    return undefined !== arr[2] ? arr[2].split(/[?&]/)[0] : undefined;
}

/**
 * Uploads new media (image or video) to the band gallery.
 * @param formData - The form data containing either a file or a videoUrl.
 * @returns The uploaded media item with its id, name, URL, and type.
 */
export async function uploadBandMedia(formData: FormData) {
  if (!adminDb) {
    console.error("Firebase Admin SDK not initialized.");
    throw new Error("El servidor no pudo conectarse a la base de datos.");
  }
  const file = formData.get("file") as File | null;
  const videoUrl = formData.get("videoUrl") as string | null;

  if (file && file.size > 0) {
    // Image Upload Logic
    if (!file.type.startsWith('image/')) {
        throw new Error("Only image files are allowed.");
    }
    const dataUrl = await fileToBase64(file);
    const docRef = await adminDb.collection(BAND_GALLERY_COLLECTION).add({
        name: file.name,
        url: dataUrl,
        type: 'image',
        createdAt: new Date(),
    });
    revalidatePath("/");
    return { id: docRef.id, name: file.name, url: dataUrl, type: 'image' as const };
  } else if (videoUrl) {
    // Video URL Logic
    const videoId = getYouTubeID(videoUrl);
    if (!videoId) {
        throw new Error("Invalid YouTube URL provided.");
    }
    const embedUrl = `https://www.youtube.com/embed/${videoId}`;
    const docRef = await adminDb.collection(BAND_GALLERY_COLLECTION).add({
        name: 'YouTube Video',
        url: embedUrl,
        type: 'video',
        createdAt: new Date(),
    });
    revalidatePath("/");
    return { id: docRef.id, name: 'YouTube Video', url: embedUrl, type: 'video' as const };
  } else {
    throw new Error("No file or video URL provided.");
  }
}


/**
 * Retrieves all media items from the band gallery collection in Firestore.
 * @returns A list of media items.
 */
export async function getBandMedia() {
    if (!adminDb) {
        console.error("Firebase Admin SDK not initialized. Cannot fetch band media.");
        return [];
    }
    const snapshot = await adminDb.collection(BAND_GALLERY_COLLECTION).orderBy("createdAt", "desc").get();
    
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
 * Deletes an image from the band gallery in Firestore.
 * @param itemId - The ID of the document to delete.
 */
export async function deleteBandMedia(itemId: string) {
  if (!adminDb) {
    console.error("Firebase Admin SDK not initialized.");
    throw new Error("El servidor no pudo conectarse a la base de datos.");
  }
  if (!itemId) {
    throw new Error("Item ID not provided.");
  }
  await adminDb.collection(BAND_GALLERY_COLLECTION).doc(itemId).delete();
  
  revalidatePath("/"); // Update the cache for the home page
}
