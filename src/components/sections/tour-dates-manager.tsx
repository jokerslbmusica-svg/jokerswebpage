'use server';

// This file is obsolete and its content has been moved to src/app/actions.ts.
// It is kept to prevent breaking existing imports, but it should not be used for new development.
// The build process might fail if this file is deleted directly.

export interface TourDate {
    id?: string;
    eventName: string;
    venue: string;
    city: string;
    date: string;
    time: string;
    venueUrl?: string;
}

export * from '../actions';
