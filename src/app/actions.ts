
// Server-side code
"use server";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import * as z from "zod";
import nodemailer from 'nodemailer';

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
    order: number;
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

/**
 * A generic function to fetch items from a Firestore collection.
 * @param collectionName - The name of the collection.
 * @param orderByField - The field to order the results by.
 * @param orderByDirection - The direction to order the results.
 * @param transform - An optional function to transform each document.
 * @returns A promise that resolves to an array of items.
 */
async function getCollectionItems<T>(
    collectionName: string,
    orderByField: string = "createdAt",
    orderByDirection: "desc" | "asc" = "desc",
    transform?: (doc: admin.firestore.DocumentSnapshot) => T
): Promise<T[]> {
    try {
        const snapshot = await adminDb.collection(collectionName).orderBy(orderByField, orderByDirection).get();
        if (snapshot.empty) return [];
        return snapshot.docs.map(transform ? transform : (doc) => ({ id: doc.id, ...doc.data() } as T));
    } catch (error: any) {
        if (error.code === 5) { // NOT_FOUND error, collection likely doesn't exist
            console.log(`Collection '${collectionName}' not found, returning empty array.`);
            return [];
        }
        throw error;
    }
}

/**
 * A generic function to delete an item from a Firestore collection and revalidate paths.
 * @param collectionName - The name of the collection.
 * @param itemId - The ID of the item to delete.
 * @param pathsToRevalidate - An array of paths to revalidate. Defaults to ["/", "/admin"].
 */
async function deleteCollectionItem(collectionName: string, itemId: string, pathsToRevalidate: string[] = ["/", "/admin"]): Promise<void> {
    if (!itemId) {
        throw new Error("Item ID not provided for deletion.");
    }
    await adminDb.collection(collectionName).doc(itemId).delete();
    pathsToRevalidate.forEach(path => revalidatePath(path));
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
    return getCollectionItems<MediaItem>(BAND_GALLERY_COLLECTION);
}

export async function deleteBandMedia(itemId: string): Promise<void> {
  await deleteCollectionItem(BAND_GALLERY_COLLECTION, itemId, ["/"]);
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

export async function getFanComments(options: { limit: number, startAfter?: string, status: 'approved' | 'pending' }): Promise<{ comments: FanComment[], nextCursor?: string, hasMore: boolean }> {
    // IMPORTANT: This query requires a composite index in Firestore.
    // If the fan comments are not loading, check your Firebase console or emulator logs
    // for a link to create the required index. It will look like this:
    //
    // Collection: 'fan-comments'
    // Fields:
    // 1. status (Ascending)
    // 2. createdAt (Descending)
    //
    const { limit, startAfter, status } = options;
    let query = adminDb.collection(FAN_COMMENTS_COLLECTION)
        .where('status', '==', status)
        .orderBy("createdAt", "desc")
        .limit(limit + 1); // Fetch one extra to check if there are more

    if (startAfter) {
        const startAfterDoc = await adminDb.collection(FAN_COMMENTS_COLLECTION).doc(startAfter).get();
        if (startAfterDoc.exists) {
            query = query.startAfter(startAfterDoc);
        }
    }

    const snapshot = await query.get();
    if (snapshot.empty) return { comments: [], hasMore: false };

    const hasMore = snapshot.docs.length > limit;
    const comments = snapshot.docs.slice(0, limit).map(doc => {
         const data = doc.data();
         return {
             id: doc.id,
             name: data.name,
             comment: data.comment,
             status: data.status,
             createdAt: data.createdAt?.toDate().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) || '',
         } as FanComment;
    });

    const nextCursor = hasMore ? comments[comments.length - 1]?.id : undefined;

    return { comments, nextCursor, hasMore };
}

export async function deleteFanComment(commentId: string): Promise<void> {
    await deleteCollectionItem(FAN_COMMENTS_COLLECTION, commentId);
}

export async function approveFanComment(commentId: string): Promise<void> {
    if (!commentId) throw new Error("Comment ID not provided.");
    await adminDb.collection(FAN_COMMENTS_COLLECTION).doc(commentId).update({ status: "approved" });
    revalidatePath("/");
    revalidatePath("/admin");
}

export async function updateFanCommentsStatus(commentIds: string[], status: 'approved' | 'deleted'): Promise<{ success: boolean, error?: string }> {
    if (!commentIds || commentIds.length === 0) {
        return { success: false, error: "No se proporcionaron IDs de comentarios." };
    }

    const batch = adminDb.batch();
    const collectionRef = adminDb.collection(FAN_COMMENTS_COLLECTION);

    try {
        if (status === 'approved') {
            commentIds.forEach(id => {
                batch.update(collectionRef.doc(id), { status: 'approved' });
            });
        } else if (status === 'deleted') {
            commentIds.forEach(id => {
                batch.delete(collectionRef.doc(id));
            });
        } else {
            throw new Error("Estado inválido proporcionado.");
        }

        await batch.commit();
        revalidatePath("/admin");
        return { success: true };
    } catch (error: any) {
        console.error("Error updating fan comments status:", error);
        return { success: false, error: "No se pudieron actualizar los comentarios." };
    }
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
    // IMPORTANT: This query requires a composite index in Firestore.
    // If the fan gallery is not loading, check your Firebase console or emulator logs
    // for a link to create the required index. It will look like this:
    //
    // Collection: 'fan-gallery'
    // Fields:
    // 1. type (Ascending)
    // 2. createdAt (Descending)
    //
    const snapshot = await adminDb.collection(FAN_GALLERY_COLLECTION).where('type', '==', 'image').orderBy("createdAt", "desc").get();
    if (snapshot.empty) return [];
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as MediaItem));
}

export async function deleteFanMedia(itemId: string): Promise<void> {
  await deleteCollectionItem(FAN_GALLERY_COLLECTION, itemId);
}

// ====================================================================
// Music Actions
// ====================================================================

export async function addSong(formData: FormData): Promise<void> {
    const title = formData.get("title") as string;
    const artist = formData.get("artist") as string;
    const audioFile = formData.get("audioFile") as File;
    const coverFile = formData.get("coverFile") as File;

    if (!title || !artist || !audioFile || !coverFile) {
        throw new Error("Missing required fields.");
    }

    const [audioUpload, coverUpload] = await Promise.all([
        uploadFileToStorage(audioFile, `${MUSIC_STORAGE_PATH}/audio`),
        uploadFileToStorage(coverFile, `${MUSIC_STORAGE_PATH}/covers`),
    ]);
    const songsCount = (await adminDb.collection(MUSIC_COLLECTION).count().get()).data().count;

    await adminDb.collection(MUSIC_COLLECTION).add({
        title,
        artist,
        audioUrl: audioUpload.downloadUrl,
        coverUrl: coverUpload.downloadUrl,
        audioPath: audioUpload.path,
        coverPath: coverUpload.path,
        order: songsCount, // Set order to the end of the list
        createdAt: new Date(),
    });

    revalidatePath("/");
    revalidatePath("/admin");
}

export async function getSongs(): Promise<Song[]> {
    return getCollectionItems<Song>(MUSIC_COLLECTION, "order", "asc");
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

export async function updateSongOrder(songs: { id: string; order: number }[]): Promise<{ success: boolean; error?: string }> {
    if (!songs || songs.length === 0) {
        return { success: false, error: "No se proporcionaron canciones para reordenar." };
    }

    const batch = adminDb.batch();
    const collectionRef = adminDb.collection(MUSIC_COLLECTION);

    try {
        songs.forEach(song => {
            batch.update(collectionRef.doc(song.id), { order: song.order });
        });
        await batch.commit();
        revalidatePath("/");
        return { success: true };
    } catch (error: any) {
        console.error("Error updating song order:", error);
        return { success: false, error: "No se pudo actualizar el orden de las canciones." };
    }
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
    return getCollectionItems<TourDate>(TOUR_DATES_COLLECTION);
}

export async function deleteTourDate(dateId: string): Promise<void> {
    await deleteCollectionItem(TOUR_DATES_COLLECTION, dateId);
}


// ====================================================================
// AI / Genkit Actions (Placeholders)
// ====================================================================

export async function getHashtagSuggestions(values: { contentDescription: string, mediaType: 'photo' | 'video', bandName: string }) {
    console.warn("AI functionality is not implemented. Skipping AI generation.");
    return { success: false, error: "La función de IA no está disponible en este momento." };
}

export async function getSocialPostSuggestion(formData: FormData) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("GEMINI_API_KEY is not set.");
        return { success: false, error: "La configuración del servicio de IA está incompleta." };
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const safetySettings = [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ];

    try {
        const topic = formData.get("topic") as string;
        const platform = formData.get("platform") as string;
        const bandName = formData.get("bandName") as string;
        const flyerFile = formData.get("flyer") as File | null;

        let model;
        let promptParts: (string | { inlineData: { mimeType: string; data: string } })[] = [];

        const basePrompt = `Eres el community manager de una banda de rock llamada "${bandName}". Tu tono es enérgico, directo y emocionante, como una banda de rock.
Genera un texto para una publicación en "${platform}".
El tema es: "${topic}".

Reglas:
- Incluye emojis relevantes para el rock y la música 🤘🎸🔥.
- Usa hashtags relevantes al final.
- Si la publicación es sobre un evento, asegúrate de que la fecha, hora y lugar sean claros.
- El texto debe ser atractivo y animar a los fans a interactuar.`;

        if (flyerFile && flyerFile.size > 0) {
            model = genAI.getGenerativeModel({ model: "gemini-pro-vision", safetySettings });

            const imageBuffer = Buffer.from(await flyerFile.arrayBuffer());
            const imageBase64 = imageBuffer.toString("base64");

            promptParts = [
                basePrompt,
                "\n\nAnaliza la imagen del flyer adjunto y extrae los detalles clave (lugar, fecha, hora, bandas invitadas, etc.) para incorporarlos en la publicación. Si el tema principal ya menciona estos detalles, usa la imagen para confirmarlos o complementarlos.",
                {
                    inlineData: {
                        mimeType: flyerFile.type,
                        data: imageBase64,
                    },
                },
            ];
        } else {
            model = genAI.getGenerativeModel({ model: "gemini-pro", safetySettings });
            promptParts = [basePrompt];
        }

        const result = await model.generateContent({
            contents: [{ role: "user", parts: promptParts }],
            generationConfig: {
                maxOutputTokens: 800,
                temperature: 0.7,
            },
        });

        const response = result.response;
        const postText = response.text();

        return { success: true, data: { postText } };

    } catch (error: any) {
        console.error("Error generating social post:", error);
        // Consider more specific error messages based on error.message or error.code
        return { success: false, error: "No se pudo generar la publicación. Inténtalo de nuevo." };
    }
}

const bookingInquirySchema = z.object({
  name: z.string().min(2, "El nombre es requerido.").max(100),
  email: z.string().email("Por favor, introduce un email válido."),
  phone: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.string().max(20).optional()
  ),
  eventType: z.string().min(3, "El tipo de evento es requerido.").max(100),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha del evento es inválida."),
  message: z.string().min(10, "Por favor, proporciona más detalles en tu mensaje.").max(2000),
});


export async function sendBookingInquiry(inquiryData: {
    name: string;
    email: string;
    phone?: string;
    eventType: string;
    eventDate: string;
    message: string;
}): Promise<{ success: boolean, error?: string }> {
    const { name, email, phone, eventType, eventDate, message } = inquiryData;
    
    const validationResult = bookingInquirySchema.safeParse(inquiryData);
    if (!validationResult.success) {
        const firstError = validationResult.error.errors[0]?.message || "Datos de la solicitud inválidos.";
        console.error("Booking inquiry validation failed:", validationResult.error.flatten());
        return { success: false, error: firstError };
    }
    const validatedData = validationResult.data;
    
    const {
        EMAIL_SERVER_HOST,
        EMAIL_SERVER_PORT,
        EMAIL_SERVER_USER,
        EMAIL_SERVER_PASSWORD,
        EMAIL_TO,
    } = process.env;

    if (!EMAIL_SERVER_HOST || !EMAIL_SERVER_PORT || !EMAIL_SERVER_USER || !EMAIL_SERVER_PASSWORD || !EMAIL_TO) {
        console.error("Email server environment variables are not configured.");
        return { success: false, error: "El servicio de notificaciones no está configurado correctamente." };
    }

    const transporter = nodemailer.createTransport({
        host: EMAIL_SERVER_HOST,
        port: parseInt(EMAIL_SERVER_PORT, 10),
        secure: parseInt(EMAIL_SERVER_PORT, 10) === 465, // true for 465, false for other ports
        auth: {
            user: EMAIL_SERVER_USER,
            pass: EMAIL_SERVER_PASSWORD,
        },
    });

    // Correctly handle the date to avoid timezone issues.
    // An input type="date" provides a 'YYYY-MM-DD' string. new Date('YYYY-MM-DD') can be off by one day.
    // By appending 'T00:00:00Z' (or using new Date(year, month-1, day)), we treat it as UTC.
    const dateParts = validatedData.eventDate.split('-').map(Number);
    const eventDateObj = new Date(Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2]));
    const formattedDate = eventDateObj.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });

    try {
        await transporter.sendMail({
            from: `"Jokers Web" <${EMAIL_SERVER_USER}>`,
            to: EMAIL_TO,
            replyTo: validatedData.email,
            subject: `Nueva Solicitud de Contratación: ${validatedData.eventType} para ${validatedData.name}`,
            text: `
                Nueva Solicitud de Contratación:
                - Nombre: ${validatedData.name}
                - Email: ${validatedData.email}
                ${validatedData.phone ? `- Teléfono: ${validatedData.phone}` : ''}
                - Tipo de Evento: ${validatedData.eventType}
                - Fecha: ${formattedDate}
                - Mensaje: ${validatedData.message}
            `,
            html: `<h1>Nueva Solicitud de Contratación</h1><p>Has recibido una nueva solicitud a través de la página web.</p><h2>Detalles:</h2><ul><li><strong>Nombre:</strong> ${validatedData.name}</li><li><strong>Email de Contacto:</strong> ${validatedData.email}</li>${validatedData.phone ? `<li><strong>Teléfono:</strong> ${validatedData.phone}</li>` : ''}<li><strong>Tipo de Evento:</strong> ${validatedData.eventType}</li><li><strong>Fecha del Evento:</strong> ${formattedDate}</li></ul><h2>Mensaje:</h2><p style="white-space: pre-wrap;">${validatedData.message}</p>`,
        });
        return { success: true };
    } catch (error) {
        console.error("Error sending booking email:", error);
        return { success: false, error: "No se pudo enviar la solicitud. Por favor, inténtalo de nuevo más tarde." };
    }
}
