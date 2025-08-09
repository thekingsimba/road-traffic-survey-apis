export const formatTimestamp = (timestamp) => {
  const date = new Date(parseInt(timestamp));

  // Get the timezone offset in minutes and convert to hours and minutes
  const offsetMinutes = date.getTimezoneOffset();
  const offsetHours = Math.abs(Math.floor(offsetMinutes / 60));
  const offsetMins = Math.abs(offsetMinutes % 60);
  const sign = offsetMinutes > 0 ? "-" : "+"; // UTC offsets are reversed in JS

  // Format with local timezone offset
  return (
    date.getFullYear() +
    "-" +
    String(date.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(date.getDate()).padStart(2, "0") +
    "T" +
    String(date.getHours()).padStart(2, "0") +
    ":" +
    String(date.getMinutes()).padStart(2, "0") +
    ":" +
    String(date.getSeconds()).padStart(2, "0") +
    "." +
    String(date.getMilliseconds()).padStart(3, "0") +
    `${sign}${String(offsetHours).padStart(2, "0")}:${String(
      offsetMins
    ).padStart(2, "0")}`
  );
};
