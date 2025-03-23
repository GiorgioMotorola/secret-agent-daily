import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; 
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDq0FVElYL5cHn1JjRBD2R6lqI-0AVSO0U",
  authDomain: "secretagent-1ef76.firebaseapp.com",
  projectId: "secretagent-1ef76",
  storageBucket: "secretagent-1ef76.firebasestorage.app",
  messagingSenderId: "1078722944604",
  appId: "1:1078722944604:web:1f028eea2c42009c7fd099",
  measurementId: "G-8PXY79EE4T",
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const db = getFirestore(app);
export { db };