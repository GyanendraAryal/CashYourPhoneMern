import { Queue } from "bullmq";
import IORedis from "ioredis";
import { logger } from "../utils/logger.js";

const redisUrl = process.env.REDIS_URL;
const jobsEnabled = String(process.env.JOBS_ENABLED || "").toLowerCase() === "true";

let connection = null;
function getConnection() {
  if (!jobsEnabled) return null;
  if (!redisUrl) {
    logger.warn({ jobsEnabled }, "JOBS_ENABLED=true but REDIS_URL is missing. Jobs disabled.");
    return null;
  }
  if (!connection) {
    connection = new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    });
  }
  return connection;
}

export function getQueue(name) {
  const conn = getConnection();
  if (!conn) return null;
  return new Queue(name, { connection: conn });
}
