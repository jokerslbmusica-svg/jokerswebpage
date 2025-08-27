
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
const FAN_COMMENTS_COLLECTION = "fan-comments";

export type CommentStatus = "pending" | "approved";

export interface FanComment {
    id?: string;
    name: string;
    comment: string;
    createdAt?: any;
    status: CommentStatus;
}

/**
 * Adds a new fan comment to Firestore with a 'pending' status.
 * @param commentData - The data for the new comment.
 */
export async function addFanComment(commentData: Omit<FanComment, 'id' | 'createdAt' | 'status'>) {
    await adminDb.collection(FAN_COMMENTS_COLLECTION).add({
        ...commentData,
        status: "pending", // New comments await approval
        createdAt: new Date(),
    });
    revalidatePath("/");
    revalidatePath("/admin");
}

/**
 * Retrieves all fan comments from Firestore, ordered by creation date.
 * @returns A list of all fan comments with their status.
 */
export async function getFanComments(): Promise<FanComment[]> {
    const snapshot = await adminDb.collection(FAN_COMMENTS_COLLECTION).orderBy("createdAt", "desc").get();
    
    if (snapshot.empty) {
        return [];
    }

    const comments = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            id: doc.id,
            name: data.name,
            comment: data.comment,
            status: data.status || 'approved', // Default old comments to approved
            createdAt: data.createdAt?.toDate().toLocaleDateString('es-ES', {
                year: 'numeric', month: 'long', day: 'numeric'
            }) || '',
        } as FanComment;
    });

    return comments;
}

/**
 * Deletes a fan comment from Firestore.
 * @param commentId - The ID of the document to delete.
 */
export async function deleteFanComment(commentId: string) {
    if (!commentId) {
        throw new Error("Comment ID not provided.");
    }
    await adminDb.collection(FAN_COMMENTS_COLLECTION).doc(commentId).delete();
    revalidatePath("/");
    revalidatePath("/admin");
}

/**
 * Approves a fan comment by updating its status to 'approved'.
 * @param commentId - The ID of the comment to approve.
 */
export async function approveFanComment(commentId: string) {
    if (!commentId) {
        throw new Error("Comment ID not provided.");
    }
    const commentRef = adminDb.collection(FAN_COMMENTS_COLLECTION).doc(commentId);
    await commentRef.update({
        status: "approved",
    });
    revalidatePath("/");
    revalidatePath("/admin");
}
