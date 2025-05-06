// server.ts (or index.ts)
import express, { Request, Response } from "express";
import dotenv from "dotenv";
import {
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
app.get("/schedule", (req: Request, res: Response) => {
  try {
    console.log(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string));

    res.status(200).json(getLatestSchedule());
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
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
