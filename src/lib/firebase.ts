import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDvU2DH8o3baDrRPmihP45R39OtSjhk2aA",
  authDomain: "chess-4b89c.firebaseapp.com",
  databaseURL: "https://chess-4b89c-default-rtdb.firebaseio.com",
  projectId: "chess-4b89c",
  storageBucket: "chess-4b89c.firebasestorage.app",
  messagingSenderId: "1052008395512",
  appId: "1:1052008395512:web:c3dc29b8da9480b25a810d",
  measurementId: "G-1L9KKDPGYR"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
