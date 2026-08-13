import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyCPtefja6ggkbWi5QyelIowls_qX_gead4',
  authDomain: 'nobelsmanagment.firebaseapp.com',
  projectId: 'nobelsmanagment',
  storageBucket: 'nobelsmanagment.firebasestorage.app',
  messagingSenderId: '404038047881',
  appId: '1:404038047881:web:6e14ae419b7f4ea8d30e58',
  measurementId: 'G-2M3XP2WDJ7',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
