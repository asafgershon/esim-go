import cron from "node-cron";
import { runWeeklySync } from "../jobs/weeklySync.js";

console.log("[Worker_v2] Starting weekly sync worker...");

// להריץ מידית לבדיקה
await runWeeklySync();

// להריץ כל יום ראשון ב־02:00
cron.schedule("0 2 * * 0", async () => {
  console.log("[Worker_v2] Triggered weekly sync");
  await runWeeklySync();
});
