import sgMail from '@sendgrid/mail';
import key from "../config/key.js";
import Logger from './logger.js';

sgMail.setApiKey(key.SENDGRID_API_KEY);

export const sendEmail = async (data) => {
  try {
    const response = await sgMail.send(data);
    if (response) Logger.info(`Email sent: ${response[0].statusCode} ${response[0].headers.date}`);
  } catch (err) {
    Logger.error(JSON.stringify(err))
  }
}