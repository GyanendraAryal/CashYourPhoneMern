import { Worker } from "bullmq";
import IORedis from "ioredis";
import { logger } from "../utils/logger.js";

const redisUrl = process.env.REDIS_URL;
const jobsEnabled = String(process.env.JOBS_ENABLED || "").toLowerCase() === "true";

export function startNotificationWorker() {
  if (!jobsEnabled) return null;
  if (!redisUrl) {
    logger.warn("JOBS_ENABLED=true but REDIS_URL is missing. Worker not started.");
    return null;
  }

  const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null, enableReadyCheck: true });

  const worker = new Worker(
    "notifications",
    async (job) => {
      // Placeholder: integrate email/sms/whatsapp providers here.
      logger.info({ jobId: job.id, name: job.name }, "Processing notification job");
      return { ok: true };
    },
    { connection }
  );

  worker.on("failed", (job, err) => {
    logger.error({ jobId: job?.id, err }, "Notification job failed");
  });

  logger.info("Notification worker started");
  return worker;
}
