import cron from "node-cron";
import { runWeeklySync } from "../jobs/weeklySync.js";

console.log("[Worker_v2] Starting worker process...");

// פונקציית עטיפה בטוחה להרצת הסנכרון
async function safeRunSync() {
 try {
  console.log("[Worker_v2] Executing weekly sync job...");
  await runWeeklySync();
 } catch (error) {
  console.error("[Worker_v2] The sync job failed with a critical error:", error);
 }
}

// 1. הרצה ראשונית ומיידית לבדיקה - בוטלה
// console.log("[Worker_v2] Performing initial run on startup.");
// safeRunSync();

// 2. תזמון שבועי (יום ראשון ב-02:00)
cron.schedule("0 2 * * 0", () => {
  console.log("[Worker_v2] Triggered scheduled weekly sync.");
  safeRunSync();
});

console.log("[Worker_v2] Worker is running and schedule is set.");