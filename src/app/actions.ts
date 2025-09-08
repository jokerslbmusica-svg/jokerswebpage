
// Server-side code
"use server";

import { revalidatePath } from "next/cache";
import admin from 'firebase-admin';


// ====================================================================
// Firebase Admin Initialization
// ====================================================================
if (!admin.apps.length) {
  try {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  } catch (error: any) {
    console.error("Firebase Admin initialization error:", error.message);
  }
}
const adminDb = admin.firestore();
const adminStorage = admin.storage();


// ====================================================================
// Collection Types
// ====================================================================
export interface TourDate {
    id: string;
    postUrl: string;
}

export interface Song {
    id: string;
    title: string;
    artist: string;
    audioUrl: string;
    coverUrl: string;
    audioPath: string;
    coverPath: string;
}

export interface FanComment {
    id: string;
    name: string;
    comment: string;
    createdAt: string;
    status: 'pending' | 'approved';
}

export interface MediaItem {
    id: string;
    name: string;
    url: string;
    type: 'image' | 'video' | 'facebook';
}


// ====================================================================
// Collection Constants
// ====================================================================
const BAND_GALLERY_COLLECTION = "band-gallery";
const BAND_INFO_COLLECTION = "band-info";
const BIO_DOC_ID = "biography";
const FAN_COMMENTS_COLLECTION = "fan-comments";
const FAN_GALLERY_COLLECTION = "fan-gallery";
const MUSIC_COLLECTION = "music";
const TOUR_DATES_COLLECTION = "tour-dates";
const MUSIC_STORAGE_PATH = "music";


// =================================_==================================
// Helper Functions
// ====================================================================

/**
 * Extracts a YouTube video ID from various URL formats.
 * @param url - The YouTube URL.
 * @returns The video ID string or undefined if not found.
 */
function getYouTubeID(url: string): string | undefined {
    const arr = url.split(/(vi\/|v%3D|v=|\/v\/|youtu\.be\/|\/embed\/)/);
    return arr[2] !== undefined ? arr[2].split(/[?&]/)[0] : undefined;
}

/**
 * Uploads a file to Firebase Storage.
 * @param file - The file to upload.
 * @param path - The destination path in the storage bucket.
 * @returns An object containing the public download URL and the storage path.
 */
async function uploadFileToStorage(file: File, path: string) {
    const filePath = `${path}/${Date.now()}-${file.name}`;
    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (!bucketName) {
        throw new Error("Firebase Storage bucket name is not configured.");
    }
    const bucket = adminStorage.bucket(bucketName);
    const buffer = Buffer.from(await file.arrayBuffer());

    await bucket.file(filePath).save(buffer, {
        metadata: { contentType: file.type },
    });
    
    const fileRef = bucket.file(filePath);
    await fileRef.makePublic();
    const downloadUrl = fileRef.publicUrl();

    return { downloadUrl, path: filePath };
}


// ====================================================================
// Band Gallery Actions
// ====================================================================

export async function uploadBandMedia(formData: FormData): Promise<MediaItem> {
  const imageUrl = formData.get("imageUrl") as string | null;
  const videoUrl = formData.get("videoUrl") as string | null;

  if (imageUrl) {
    const docRef = await adminDb.collection(BAND_GALLERY_COLLECTION).add({
        name: 'Band Image',
        url: imageUrl,
        type: 'image',
        createdAt: new Date(),
    });
    revalidatePath("/");
    return { id: docRef.id, name: 'Band Image', url: imageUrl, type: 'image' as const };
  } else if (videoUrl) {
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
    throw new Error("No image or video URL provided.");
  }
}

export async function getBandMedia(): Promise<MediaItem[]> {
    try {
        const snapshot = await adminDb.collection(BAND_GALLERY_COLLECTION).orderBy("createdAt", "desc").get();
        if (snapshot.empty) return [];
        return snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
        })) as MediaItem[];
    } catch (error: any) {
        if (error.code === 5) { // NOT_FOUND error, collection likely doesn't exist
            console.log("Band gallery collection not found, returning empty array.");
            return [];
        }
        throw error;
    }
}

export async function deleteBandMedia(itemId: string): Promise<void> {
  if (!itemId) throw new Error("Item ID not provided.");
  await adminDb.collection(BAND_GALLERY_COLLECTION).doc(itemId).delete();
  revalidatePath("/");
}


// ====================================================================
// Band Info (Biography) Actions
// ====================================================================

export async function saveBandBio(bioText: string): Promise<void> {
  const bioRef = adminDb.collection(BAND_INFO_COLLECTION).doc(BIO_DOC_ID);
  await bioRef.set({ text: bioText, updatedAt: new Date() }, { merge: true });
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function getBandBio(): Promise<string | null> {
  try {
    const docSnap = await adminDb.collection(BAND_INFO_COLLECTION).doc(BIO_DOC_ID).get();
    return docSnap.exists ? docSnap.data()?.text : null;
  } catch (error: any) {
    if (error.code === 5) { // NOT_FOUND error
        console.log("Band info collection/document not found, returning null.");
        return null;
    }
    throw error;
  }
}

export async function getBio(input: any) {
    console.warn("Genkit dependencies are not installed. Skipping AI generation.");
    return { success: false, error: "La función de IA no está disponible en este momento." };
}

// ====================================================================
// Fan Comments Actions
// ====================================================================

export async function addFanComment(commentData: Omit<FanComment, 'id' | 'createdAt' | 'status'>): Promise<void> {
    await adminDb.collection(FAN_COMMENTS_COLLECTION).add({
        ...commentData,
        status: "pending",
        createdAt: new Date(),
    });
    revalidatePath("/");
    revalidatePath("/admin");
}

export async function getFanComments(): Promise<FanComment[]> {
    try {
        const snapshot = await adminDb.collection(FAN_COMMENTS_COLLECTION).orderBy("createdAt", "desc").get();
        if (snapshot.empty) return [];
        return snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name,
                comment: data.comment,
                status: data.status || 'approved',
                createdAt: data.createdAt?.toDate().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) || '',
            } as FanComment;
        });
    } catch (error: any) {
        if (error.code === 5) { // NOT_FOUND error, collection likely doesn't exist
            console.log("Fan comments collection not found, returning empty array.");
            return [];
        }
        throw error;
    }
}

export async function deleteFanComment(commentId: string): Promise<void> {
    if (!commentId) throw new Error("Comment ID not provided.");
    await adminDb.collection(FAN_COMMENTS_COLLECTION).doc(commentId).delete();
    revalidatePath("/");
    revalidatePath("/admin");
}

export async function approveFanComment(commentId: string): Promise<void> {
    if (!commentId) throw new Error("Comment ID not provided.");
    await adminDb.collection(FAN_COMMENTS_COLLECTION).doc(commentId).update({ status: "approved" });
    revalidatePath("/");
    revalidatePath("/admin");
}


// ====================================================================
// Fan Gallery Actions
// ====================================================================

export async function addFanMedia(formData: FormData): Promise<MediaItem> {
  const url = formData.get("url") as string;
  if (!url) throw new Error("No URL provided.");

  const docRef = await adminDb.collection(FAN_GALLERY_COLLECTION).add({
    name: "Fan Image",
    url: url,
    type: 'image', // Saving as 'image' type
    createdAt: new Date(),
  });

  revalidatePath("/");
  revalidatePath("/admin");

  return { id: docRef.id, name: "Fan Image", url: url, type: 'image' as const };
}

export async function getFanMedia(): Promise<MediaItem[]> {
    try {
        const snapshot = await adminDb.collection(FAN_GALLERY_COLLECTION).orderBy("createdAt", "desc").get();
        if (snapshot.empty) return [];
        return snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
        })) as MediaItem[];
    } catch (error: any) {
        if (error.code === 5) { // NOT_FOUND error, collection likely doesn't exist
            console.log("Fan gallery collection not found, returning empty array.");
            return [];
        }
        throw error;
    }
}

export async function deleteFanMedia(itemId: string): Promise<void> {
  if (!itemId) throw new Error("Item ID not provided.");
  await adminDb.collection(FAN_GALLERY_COLLECTION).doc(itemId).delete();
  revalidatePath("/");
  revalidatePath("/admin");
}

// ====================================================================
// Music Actions
// ====================================================================

export async function addSong(formData: FormData): Promise<void> {
    const title = formData.get("title") as string;
    const artist = formData.get("artist") as string;
    const audioFile = formData.get("audioFile") as File;
    const coverFile = formData.get("coverFile") as File;

    if (!title || !artist || !audioFile || !coverFile) throw new Error("Missing required fields.");
    
    const [audioUpload, coverUpload] = await Promise.all([
        uploadFileToStorage(audioFile, `${MUSIC_STORAGE_PATH}/audio`),
        uploadFileToStorage(coverFile, `${MUSIC_STORAGE_PATH}/covers`),
    ]);

    await adminDb.collection(MUSIC_COLLECTION).add({
        title,
        artist,
        audioUrl: audioUpload.downloadUrl,
        coverUrl: coverUpload.downloadUrl,
        audioPath: audioUpload.path,
        coverPath: coverUpload.path,
        createdAt: new Date(),
    });

    revalidatePath("/");
    revalidatePath("/admin");
}

export async function getSongs(): Promise<Song[]> {
    try {
        const snapshot = await adminDb.collection(MUSIC_COLLECTION).orderBy("createdAt", "desc").get();
        if (snapshot.empty) return [];
        return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Song[];
    } catch (error: any) {
        if (error.code === 5) { // NOT_FOUND error, collection likely doesn't exist
            console.log("Music collection not found, returning empty array.");
            return [];
        }
        throw error;
    }
}

export async function deleteSong(song: Song): Promise<void> {
    if (!song || !song.id) throw new Error("Song ID not provided.");
    
    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (!bucketName) throw new Error("Firebase Storage bucket name is not configured.");
    const bucket = adminStorage.bucket(bucketName);

    await Promise.all([
        bucket.file(song.audioPath).delete().catch(e => console.error(`Failed to delete audio file: ${e.message}`)),
        bucket.file(song.coverPath).delete().catch(e => console.error(`Failed to delete cover file: ${e.message}`)),
        adminDb.collection(MUSIC_COLLECTION).doc(song.id).delete(),
    ]);
    
    revalidatePath("/");
    revalidatePath("/admin");
}


// ====================================================================
// Tour Dates Actions
// ====================================================================

export async function addTourDate(formData: FormData): Promise<void> {
    const postUrl = formData.get("postUrl") as string;
    if (!postUrl) throw new Error("Post URL is required.");
    await adminDb.collection(TOUR_DATES_COLLECTION).add({ postUrl, createdAt: new Date() });
    revalidatePath("/");
    revalidatePath("/admin");
}

export async function getTourDates(): Promise<TourDate[]> {
    try {
        const snapshot = await adminDb.collection(TOUR_DATES_COLLECTION).orderBy("createdAt", "desc").get();
        if (snapshot.empty) return [];
        return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as TourDate[];
    } catch (error: any) {
        if (error.code === 5) { // NOT_FOUND error, collection likely doesn't exist
            console.log("Tour dates collection not found, returning empty array.");
            return [];
        }
        throw error;
    }
}

export async function deleteTourDate(dateId: string): Promise<void> {
    if (!dateId) throw new Error("Date ID not provided.");
    await adminDb.collection(TOUR_DATES_COLLECTION).doc(dateId).delete();
    revalidatePath("/");
    revalidatePath("/admin");
}


// ====================================================================
// AI / Genkit Actions (Placeholders)
// ====================================================================

export async function getHashtagSuggestions(values: { contentDescription: string, mediaType: 'photo' | 'video', bandName: string }) {
    console.warn("Genkit dependencies are not installed. Skipping AI generation.");
    return { success: false, error: "La función de IA no está disponible en este momento." };
}

export async function getSocialPostSuggestion(formData: FormData) {
    console.warn("Genkit dependencies are not installed. Skipping AI generation.");
    return { success: false, error: "La función de IA no está disponible en este momento." };
}
