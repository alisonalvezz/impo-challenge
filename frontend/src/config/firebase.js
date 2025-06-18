import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyAkR-ghiPN0oQqnC7wk4pD7GmJwM-LyogI",
    authDomain: "impo-equipo1.firebaseapp.com",
    projectId: "impo-equipo1",
    storageBucket: "impo-equipo1.firebasestorage.app",
    messagingSenderId: "217609179837",
    appId: "1:217609179837:web:26d7f936751b6163c41dd4",
    measurementId: "G-L5DS31DJ6G"
  };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;