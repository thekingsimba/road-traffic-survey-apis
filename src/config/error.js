import Logger from "../utils/logger.js";

export default (err, req, res, next) => {
  Logger.error(err.message);

  res.status(500).json( err.message );
}