import cron from "node-cron";
import KeywordTracking from "../model/keywordTracking.js";
import { keywordTracking } from "../services/keywordTrackingService.js";

export function startRankTrackingCron() {
	/* this will run the code at every 6AM every day, if the last * is
	1, it will run the code every 1day at 6am, if the first * is 1, it
	will run the code on the first day of the month */
	cron.schedule("0 6 * * *", async () => {
        console.log("Starting daily rank tracking");

        try {
            const activeTracking = await KeywordTracking.find({active: true});
            for(const tracking for activeTracking) {
                tracking.status = "checking";
                await tracking.save();

                const result = await keywordTracking(tracking);
                // Delay between checks to avoid rate limiting
                await new Promise((r) => setTimeout(r, 10000 + Math.random() * 5000));
            }
        } catch (error) {
            console.error("[CRON] Rank tracking cron error: ", error.message);
        }
    });
    console.log("Rank Tracking CRON Job Scheduled")
}
