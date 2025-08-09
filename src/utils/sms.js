import key from "../config/key.js";

export const sendSMS = async (data) => {
  const accountSid = key.TWILIO_SID;
  const authToken = key.TWILIO_AUTH_TOKEN;
  const client = require('twilio')(accountSid, authToken);
  
  const response = await client.messages
    .create({
      body: data.message,
      from: key.SMS_FROM_NUMBER,
      to: data.to
    });
    
  return response;
}

export const sms_code = () => {
  const code = Math.floor(100000 + Math.random() * 900000);
  return code.toString();
}