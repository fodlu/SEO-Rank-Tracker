import dns from "node:dns";
dns.setServers(["1.1.1.1", "8.8.8.8"]);

import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/db.js";
import authRouter from "./routes/authRoute.js";
import rankRouter from "./routes/rankRoute.js";
import analysisRouter from "./routes/analysisRoutes.js";
import { startRankTrackingCron } from "./cron/rankTrackingCron.js";

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.send("Server is running"));
app.use("/api/auth", authRouter);
app.use("/api/rank", rankRouter);
app.use('/api/analysis', analysisRouter)

// Start cron jobs
startRankTrackingCron()

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server is running on PORT ${PORT}`));
