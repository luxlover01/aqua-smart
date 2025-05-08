// server.ts (or index.ts)
import express, { Request, Response } from "express";
import dotenv from "dotenv";
import {
  getDataToday,
  getLatestSchedule,
  initFirebaseApp,
  saveFishPondData,
  saveFishPondLiveData,
} from "./firebase";
import admin from "firebase-admin";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Initialize Firebase App & Admin SDK
initFirebaseApp(); // your existing client‐SDK init (for Firestore, etc.)
// Init Admin SDK for FCM
admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string)
  ),
});
export interface FishPondData {
  temperature: number;
  ph_level: number;
  date: string;
}

app.post("/send_data", (req: Request, res: Response) => {
  try {
    saveFishPondData(req.body);
    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to save data." });
  }
});
app.get("/schedule", async (req: Request, res: Response) => {
  try {
    const a = await getLatestSchedule();
    res.status(200).json(a);
  } catch (error) {
    console.log(error);
  }
});
app.post("/live_feed", (req: Request, res: Response) => {
  try {
    saveFishPondLiveData(req.body);
    res.status(204).end();
  } catch (error) {
    console.log(error);
  }
});

app.post("/notif", async (req: Request, res: Response) => {
  const { message_notif, idx } = req.body;
  try {
    const token = process.env.FCM_TOKEN;
    if (!token) {
      res.status(500).json({ error: "FCM_TOKEN not set in .env" });
      return;
    }

    // List of possible titles with emojis
    const titles = [
      "⚠️ Warning!",
      "🔥 Alert!",
      "🚨 Emergency!",
      "🔔 Notification!",
      "📢 Heads up!",
      "🛑 Immediate Attention!",
      "⚡ Important Update!",
      "📣 Please Read!",
      "🕒 Urgent Message!",
      "🔊 Action Needed!",
    ];

    // Randomly select a title from the list
    const randomTitle = !idx
      ? titles[Math.floor(Math.random() * titles.length)]
      : titles[idx];

    const message: admin.messaging.Message = {
      token,
      notification: {
        title: randomTitle,
        body: message_notif as string,
      },
    };

    const response = await admin.messaging().send(message);
    console.log("Notification sent:", response);
    res.status(204).end();
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to send notification." });
  }
});
app.get("/data/history", async (req: Request, res: Response) => {
  try {
    const db = admin.firestore();
    const snap = await db.collection("fish_pond").orderBy("date", "desc").get();

    const history: FishPondData[] = snap.docs.map((d) => {
      const data: any = d.data();
      const ts = data.date;

      return {
        temperature: data.temperature_c,
        ph_level: data.ph,
        date: data.date,
      };
    });

    res.status(200).json(history);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch history." });
  }
});

app.get("/data/live", async (req: Request, res: Response) => {
  try {
    const db = admin.firestore();
    const snap = await db
      .collection("fish_pond_live")
      .orderBy("timestamp", "desc")
      .limit(1)
      .get();

    if (snap.empty) {
      res.status(404).json({ error: "No live data available." });
      return;
    }

    const doc = snap.docs[0].data();
    const result: FishPondData = {
      temperature: doc.temperature_c,
      ph_level: doc.ph,
      date: doc.timestamp.toDate().toISOString(),
    };

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch live data." });
  }
});
app.post("/schedule", async (req: Request, res: Response) => {
  const { time, interval } = req.body;
  try {
    const db = admin.firestore();
    await db.collection("schedule").doc("default").set({ time, interval });
    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to set schedule." });
  }
});
app.get("/data/report", async (req: Request, res: Response) => {
  try {
    const data = await getDataToday();

    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to set schedule." });
  }
});
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
