// Server-side code
"use server";

import { revalidatePath } from "next/cache";
import { adminDb, adminStorage } from "@/lib/firebase-admin";

const MUSIC_COLLECTION = "music";
const MUSIC_STORAGE_PATH = "music";

export interface Song {
    id: string;
    title: string;
    artist: string;
    audioUrl: string;
    coverUrl: string;
    audioPath: string; // To find and delete the file in Storage
    coverPath: string; // To find and delete the file in Storage
}

/**
 * Uploads a file to Firebase Storage and returns its download URL and path.
 * @param file - The file to upload.
 * @param path - The path in storage to upload to.
 * @returns An object with the download URL and storage path.
 */
async function uploadFile(file: File, path: string) {
    if (!adminStorage) {
        console.error("Firebase Admin SDK not initialized.");
        throw new Error("El servidor no pudo conectarse al almacenamiento.");
    }
    const filePath = `${path}/${Date.now()}-${file.name}`;
    const bucket = adminStorage.bucket();
    const buffer = Buffer.from(await file.arrayBuffer());

    await bucket.file(filePath).save(buffer, {
        metadata: { contentType: file.type },
    });
    
    // Make the file public and get the URL
    const fileRef = bucket.file(filePath);
    await fileRef.makePublic();
    const downloadUrl = fileRef.publicUrl();

    return { downloadUrl, path: filePath };
}

/**
 * Adds a new song, uploading files to Storage and metadata to Firestore.
 * @param formData - The form data containing song details and files.
 */
export async function addSong(formData: FormData) {
    if (!adminDb || !adminStorage) {
        console.error("Firebase Admin SDK not initialized.");
        throw new Error("El servidor no pudo conectarse a la base de datos o al almacenamiento.");
    }
    const title = formData.get("title") as string;
    const artist = formData.get("artist") as string;
    const audioFile = formData.get("audioFile") as File;
    const coverFile = formData.get("coverFile") as File;

    if (!title || !artist || !audioFile || !coverFile) {
        throw new Error("Missing required fields.");
    }
    
    // Upload files in parallel
    const [audioUpload, coverUpload] = await Promise.all([
        uploadFile(audioFile, `${MUSIC_STORAGE_PATH}/audio`),
        uploadFile(coverFile, `${MUSIC_STORAGE_PATH}/covers`),
    ]);

    // Add song metadata to Firestore
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

/**
 * Retrieves all songs from Firestore, ordered by creation date.
 * @returns A list of songs.
 */
export async function getSongs(): Promise<Song[]> {
    if (!adminDb) {
        console.error("Firebase Admin SDK not initialized. Cannot fetch songs.");
        return [];
    }
    const snapshot = await adminDb.collection(MUSIC_COLLECTION).orderBy("createdAt", "desc").get();
    
    if (snapshot.empty) {
        return [];
    }

    return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            id: doc.id,
            title: data.title,
            artist: data.artist,
            audioUrl: data.audioUrl,
            coverUrl: data.coverUrl,
            audioPath: data.audioPath,
            coverPath: data.coverPath,
        } as Song;
    });
}

/**
 * Deletes a song from Firestore and its associated files from Storage.
 * @param song - The song object to delete.
 */
export async function deleteSong(song: Song) {
    if (!adminDb || !adminStorage) {
        console.error("Firebase Admin SDK not initialized.");
        throw new Error("El servidor no pudo conectarse a la base de datos o al almacenamiento.");
    }
    if (!song || !song.id) {
        throw new Error("Song ID not provided.");
    }

    const bucket = adminStorage.bucket();

    // Delete files from storage and document from Firestore in parallel
    await Promise.all([
        bucket.file(song.audioPath).delete().catch(e => console.error(`Failed to delete audio file: ${e.message}`)),
        bucket.file(song.coverPath).delete().catch(e => console.error(`Failed to delete cover file: ${e.message}`)),
        adminDb.collection(MUSIC_COLLECTION).doc(song.id).delete(),
    ]);
    
    revalidatePath("/");
    revalidatePath("/admin");
}
