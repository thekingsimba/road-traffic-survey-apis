export const codeGenerator = () => {
  const code = "IP" + Math.floor(1000000 + Math.random() * 900000);
  
  return code.toString();
}

export const coupon_code = () => {
  let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < 15) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    
    return result;
}

export const transaction_code = () => {
  // let result = '';
  // const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  // const charactersLength = characters.length;
  // let counter = 0;
  // while (counter < 6) {
  //   result += characters.charAt(Math.floor(Math.random() * charactersLength));
  //   counter += 1;
  // }
  const code = Math.floor(10000000 + Math.random() * 900000);
  return code;
}

export const otp_code = () => {
  const code = Math.floor(100000 + Math.random() * 900000);
  
  return code;
}

export const log_client_code = () => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < 10) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

export const referral_code = () => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < 5) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  
  return result;
}

