import key from "../config/key";
import { ObjectId } from "mongodb";
import moment from "moment";
import { admin } from "./firebase";
import { valid_coupon, verify_coupon_usage } from "../controllers/discountPromotion/discount.controller";
import { ServiceCharge } from "../controllers/service_charge/service.schma";
import { Voucher } from "../controllers/voucher/voucher.schema";
import Logger from "./logger";

export const computed_time = async (time) => {
  const currentTime = moment(new Date(), "HH:mm:ss").format("HH:m");
  const data = moment(new Date(), "HH:mm:ss").add(time, 'minutes').format("HH:m");
  const split_current = currentTime.split(":");
  const split_future = data.split(":");
  const current_hour = split_current[0];
  const current_min = split_current[1];
  const future_hour = split_future[0];
  const future_min = split_future[1];
  const formatted_current_hour = current_hour.length < 2 ? `0${current_hour}` : current_hour;
  const formatted_future_hour = future_hour.length < 2 ? `0${future_hour}` : future_hour;
  const formatted_current_min = current_min.length < 2 ? `0${current_min}` : current_min;
  const formatted_future_min = future_min.length < 2 ? `0${future_min}` : future_min;
  const estimated_time = `${formatted_current_hour}:${formatted_current_min} - ${formatted_future_hour}:${formatted_future_min}`
  return estimated_time;
}

export const last_day_of_month = (month) => {
  const last_date = month.getMonth() === 2 ?
  new Date(month.setDate(28)) : month.getMonth() === 4 ?
  new Date(month.setDate(30)) : month.getMonth() === 6 ?
  new Date(month.setDate(30)) : month.getMonth() === 9 ?
  new Date(month.setDate(30)) : month.getMonth() === 11 ?
  new Date(month.setDate(30)) : new Date(month.setDate(31));

  return last_date;
}


export const day_of_the_week = () => {

  let days_of_the_week = { 0: "sunday", 1: "monday", 2: "tuesday", 3: "wednesday", 4: "thursday", 5: "friday", 6: "saturday" };
  const day_of_week = moment(new Date()).day();
  const today = days_of_the_week[day_of_week];
  return today;
}

export const month_and_date = () => {
  const months = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ];
  const now = new Date()
  const currentMonth = now.getMonth();
  const today = now.getDate();
  const monthName = months[currentMonth]
  return { month: monthName, date: today };
}


// Function to calculate distance between two coordinates using Haversine formula
export const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}

export const toRad = (degrees) => {
  return degrees * (Math.PI / 180);
}

// Define the geofence parameters
const geofence = {
  center: { lat: 50.3755, lng: -4.1427 }, // Coordinates of Plymouth
  radius: 10 // Radius in kilometers
};

// Function to check if a point is within the geofence
export const isWithinGeofence = (point) => {
  const distance = haversineDistance(
      geofence.center.lat, geofence.center.lng,
      point.lat, point.lng
  );
  return distance <= geofence.radius;

  // Example usage
  // const testPoint = { lat: 50.3700, lng: -4.1400 }; // Test coordinates

  // if (isWithinGeofence(testPoint)) {
  //   console.log('The point is within the geofence.');
  // } else {
  //   console.log('The point is outside the geofence.');
  // }
}


export const debit_voucher = async (data) => {
  const { email, promo_code, voucher, grandTotal, deliveryFee, serviceFee, subtotal, payment_intent } = data;
  try {
    const service_fee = await ServiceCharge.find({});
    const merchant_service_fee = service_fee.length > 0 ? service_fee.find(fee => fee.service_name === "merchant") : null;
    const m_srv_fee = Number(merchant_service_fee && merchant_service_fee.service_fee/100) * subtotal;
    let isValidCoupon;
    
    if (promo_code) {
      couponUsed = await verify_coupon_usage({ email, coupon: promo_code });
      isValidCoupon = await valid_coupon(promo_code);
      if (couponUsed) return res.status(400).json(error("You have used this coupon", res.statusCode));
    }
  
    let discount_amount = 0;
    if (isValidCoupon && couponUsed === false) {
      const { data: { percentage, city, isGeneral, amount } } = await valid_coupon(promo_code);
      let sub_total = Number(cart && cart.totalCost.toFixed(2));
      if (!isGeneral) {
        const isCity = user_address && user_address.toLowerCase().includes(city.toLowerCase());
        if (!isCity) return res.status(400).json(error("You're not eligible to use the promo code", res.statusCode));
        discount_amount = amount ? amount : +percentage/100 * sub_total;
      } else {
        discount_amount = amount ? amount : +percentage/100 * sub_total;
      }
    }

    const chargeable = (deliveryFee + serviceFee + subtotal + m_srv_fee) - discount_amount;
    const card_payment_amount = payment_intent && payment_intent.amount/100;
    let userVoucher = await Voucher.findOne({ code: voucher });
    let payment_balance = chargeable - card_payment_amount;
    if (payment_intent && card_payment_amount < chargeable) {
      if (userVoucher.balance >= chargeable) {
        userVoucher.balance = userVoucher.balance - payment_balance;
        await userVoucher.save();
      }
    } else if (!payment_intent && userVoucher.balance >= grandTotal) {
      userVoucher.balance = userVoucher.balance - grandTotal;
      payment_balance = grandTotal;
      await userVoucher.save();
    }
    return payment_balance;
  } catch (error) {
    console.log(error);
    Logger.error(JSON.stringify(error))
  }
}

export const rateLimiter = (options) => {
  const { windowMs, maxRequests } = options;
  const requestCounts = new Map();

  return (req, res, next) => {
    const now = Date.now();
    const windowStart = now - windowMs;
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    if (!requestCounts.has(clientIp)) {
      requestCounts.set(clientIp, []);
    }

    const timestamps = requestCounts.get(clientIp).filter((timestamp) => timestamp > windowStart);
    timestamps.push(now);
    requestCounts.set(clientIp, timestamps);
    if (timestamps.length > maxRequests) {
      res.status(429).send('Too Many Requests, please try again later.');
    } else {
      next();
    }
  };
};


export const aggregateAmountByEmail = (data) => {
  const result = {};

  data.forEach(item => {
    if (!item.email) {
      return; // skip if email is null
    }

    if (!result[item.email]) {
      result[item.email] = {
        email: item.email,
        name: item.name || null,
        totalAmount: 0,
        userId: item.userId,
        last_payment_date: item.last_payment_date
      };
    }

    result[item.email].totalAmount += item.amount;
  });

  // Convert the result object to an array if you prefer
  return Object.values(result);
}

export const oneTimeCustomers = (data) => {
  const emailCount = {};

  // Step 1: Count occurrences of each email
  data.forEach(item => {
    if (item.email) {
      emailCount[item.email] = (emailCount[item.email] || 0) + 1;
    }
  });

  // Step 2: Filter records whose email appeared only once
  const result = data.filter(item => item.email && emailCount[item.email] === 1);

  return result;
}


export const aggregateByEmail = (data) => {
  const emailCount = {};
  const emailAggregation = {};

  for (const item of data) {
    if (!item.email) continue;
    emailCount[item.email] = (emailCount[item.email] || 0) + 1;
  }

  for (const item of data) {
    if (!item.email || emailCount[item.email] <= 1) continue;

    if (!emailAggregation[item.email]) {
      emailAggregation[item.email] = {
        userId: item.userId,
        name: item.name,
        email: item.email,
        totalAmount: 0,
        orderCount: item,
        last_payment_date: item.last_payment_date
      };
    }

    emailAggregation[item.email].totalAmount += item.amount;
  }

  return Object.values(emailAggregation);
}