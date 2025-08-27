
"use client";

import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env."AIzaSyCFbV644NaxT0HQsRDyV7JWEN0tw2Nhbdg",
  authDomain: process.env."rocklink.firebaseapp.com",
  projectId: process.env."rocklink",
  storageBucket: process.env."rocklink.firebasestorage.app",
  messagingSenderId: process.env."72175440007",
  appId: process.env."1:72175440007:web:e56a40c0162b7087746822"
};

// Initialize Firebase for client-side usage only
const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth: Auth = getAuth(app);

export { app, auth };
