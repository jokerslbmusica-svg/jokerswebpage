
// Server-side code
"use server";

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
const TOUR_DATES_COLLECTION = "tour-dates";

export interface TourDate {
    id?: string;
    eventName: string;
    venue: string;
    city: string;
    date: string; // Storing date as string for simplicity, can be changed to Timestamp
    time: string;
    venueUrl?: string;
}

/**
 * Adds a new tour date to Firestore.
 * @param dateData - The data for the new tour date.
 */
export async function addTourDate(dateData: Omit<TourDate, 'id'>) {
    await adminDb.collection(TOUR_DATES_COLLECTION).add({
        ...dateData,
        createdAt: new Date(),
    });
    revalidatePath("/");
    revalidatePath("/admin");
}

/**
 * Retrieves all tour dates from Firestore, ordered by the event date.
 * @returns A list of tour dates.
 */
export async function getTourDates(): Promise<TourDate[]> {
    const snapshot = await adminDb.collection(TOUR_DATES_COLLECTION).orderBy("date", "asc").get();
    
    if (snapshot.empty) {
        return [];
    }

    const dates = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            id: doc.id,
            eventName: data.eventName,
            venue: data.venue,
            city: data.city,
            date: data.date,
            time: data.time,
            venueUrl: data.venueUrl,
        } as TourDate;
    });

    return dates;
}

/**
 * Deletes a tour date from Firestore.
 * @param dateId - The ID of the document to delete.
 */
export async function deleteTourDate(dateId: string) {
    if (!dateId) {
        throw new Error("Date ID not provided.");
    }
    await adminDb.collection(TOUR_DATES_COLLECTION).doc(dateId).delete();
    revalidatePath("/");
    revalidatePath("/admin");
}
