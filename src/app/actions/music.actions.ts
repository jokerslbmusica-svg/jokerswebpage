'use server';

// This file is obsolete and its content has been moved to src/app/actions.ts.
// It is kept to prevent breaking existing imports, but it should not be used for new development.
// The build process might fail if this file is deleted directly.

export interface Song {
    id: string;
    title: string;
    artist: string;
    audioUrl: string;
    coverUrl: string;
    audioPath: string;
    coverPath: string;
}

export * from '../actions';
