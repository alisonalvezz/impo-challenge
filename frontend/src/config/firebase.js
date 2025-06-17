import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "api-key",
    authDomain: "domain",
    projectId: "project",
    storageBucket: "bucket",
    messagingSenderId: "id",
    appId: "appid",
    measurementId: "measurementId"
  };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app; 
