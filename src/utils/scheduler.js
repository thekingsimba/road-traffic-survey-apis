import job from "node-cron";
import Logger from "./logger.js";


export const scheduler = () => {
  try {
    job.schedule("*/5 * * * *", async () => {
       console.log('job schedule sample!')
    });


  } catch (err) {
    Logger.error(err.message);
  }
};
