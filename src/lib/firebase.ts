"use client";

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCI6Ek3R4FjE7MfXrZA4PHM-E-DL581haU",
  authDomain: "login-69a8a.firebaseapp.com",
  projectId: "login-69a8a",
  storageBucket: "login-69a8a.firebasestorage.app",
  messagingSenderId: "878004007960",
  appId: "1:878004007960:web:f66bf22f4cf6a6c6a7bf6d",
  measurementId: "G-2RQJL2YH0C",
};

export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean);

const app = isFirebaseConfigured
  ? getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

export const auth = app ? getAuth(app) : null;
