'use server';

// This file is obsolete and its content has been moved to src/app/actions.ts.
// It is kept to prevent breaking existing imports, but it should not be used for new development.
// The build process might fail if this file is deleted directly.

export type CommentStatus = "pending" | "approved";

export interface FanComment {
    id?: string;
    name: string;
    comment: string;
    createdAt?: any;
    status: CommentStatus;
}

export * from '../actions';
