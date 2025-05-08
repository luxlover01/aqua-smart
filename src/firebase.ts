// Import Firebase modules
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  query,
  getDocs,
  Firestore,
  addDoc,
  orderBy,
  limit,
  serverTimestamp,
  getDoc,
  doc,
  where,
} from "firebase/firestore";
import { FishPondData } from ".";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBJR5qoT_jM0O-J1M5qIBS6AtP2gEZccVE",
  authDomain: "aqua-smart-be7ab.firebaseapp.com",
  projectId: "aqua-smart-be7ab",
  storageBucket: "aqua-smart-be7ab.firebasestorage.app",
  messagingSenderId: "66638723463",
  appId: "1:66638723463:web:8c2d9574ee7dcbac927b22",
  measurementId: "G-Z91T7RXEFN",
};

// Initialize Firebase app
let app;
let db: Firestore;

export const initFirebaseApp = () => {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log("Firebase initialized.");
  } catch (error) {
    console.error("Firebase init error:", error);
  }
};

// Fetch data from Firestore
export const getTheData = async () => {
  try {
    if (!db) {
      initFirebaseApp(); // Ensure Firebase is initialized
    }

    const collectionRef = collection(db, "fish_pond");
    const q = query(collectionRef);
    const docSnap = await getDocs(q);

    const finalData: any[] = [];
    docSnap.forEach((doc) => {
      finalData.push(doc.data());
    });

    console.log("Fetched data:", finalData);
    return finalData;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
export const saveDummyData = async () => {
  try {
    if (!db) initFirebaseApp();

    const collectionRef = collection(db, "fish_pond");

    const dummy = {
      pondName: "Pond A",
      temperature: 26.5,
      phLevel: 7.2,
      timestamp: new Date().toISOString(),
    };

    const docRef = await addDoc(collectionRef, dummy);
    console.log("Dummy data added with ID:", docRef.id);
  } catch (error) {
    console.error("Error saving dummy data:", error);
  }
};

export const saveFishPondData = async (fishPondData: FishPondData) => {
  try {
    if (!db) initFirebaseApp();

    const collectionRef = collection(db, "fish_pond");
    const docRef = await addDoc(collectionRef, {
      timestamp: serverTimestamp(),
      ...fishPondData,
    });
    return docRef;
  } catch (error) {
    console.log(error);
  }
};
export const saveFishPondLiveData = async (fishPondData: {
  temperature: number;
  ph_level: number;
}) => {
  try {
    if (!db) initFirebaseApp();

    const collectionRef = collection(db, "fish_pond_live");
    const docRef = await addDoc(collectionRef, {
      timestamp: serverTimestamp(),
      ...fishPondData,
    });
    return docRef;
  } catch (error) {
    console.log(error);
  }
};
export const getLatestSchedule = async (): Promise<any | null> => {
  try {
    if (!db) initFirebaseApp();

    const scheduleRef = doc(db, "schedule", "default");
    const docSnap = await getDoc(scheduleRef);

    return docSnap.data();
  } catch (error) {
    console.error("Error fetching latest schedule:", error);
    return {};
  }
};
function getDateBounds(input: any) {
  const d =
    typeof input === "string" ? new Date(input + "T00:00:00") : new Date(input);

  const pad = (n: any) => String(n).padStart(2, "0");
  const fmt = (dateObj: any) => {
    const Y = dateObj.getFullYear();
    const M = pad(dateObj.getMonth() + 1);
    const D = pad(dateObj.getDate());
    return `${Y}-${M}-${D}`;
  };

  const startOfDay = fmt(d) + " 00:00:00";
  const next = new Date(d);
  next.setDate(d.getDate() + 1);
  const startOfNextDay = fmt(next) + " 00:00:00";

  return { startOfDay, startOfNextDay };
}
export const getDataToday = async () => {
  try {
    const readingsRef = collection(db, "fish_pond");

    // For May 8, 2025:
    // const startOfDay = "2025-05-08 00:00:00";
    // const startOfNextDay = "2025-05-09 00:00:00";
    const { startOfDay, startOfNextDay } = getDateBounds(new Date());

    const q = query(
      readingsRef,
      where("date", ">=", startOfDay),
      where("date", "<", startOfNextDay),
      orderBy("date", "desc")
    );
    const snapshot = await getDocs(q);

    const results = [] as any;
    snapshot.forEach((doc) => {
      results.push({ ...doc.data() });
    });

    return results;
  } catch (error) {
    console.log(error);
  }
};
