import { body, param, query, validationResult } from "express-validator";
import { validation } from "../../config/response.js";

export const createSurveyValidator = [
  body("name")
    .notEmpty()
    .isString()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Survey name must be between 3 and 100 characters"),

  body("startPoint")
    .notEmpty()
    .isString()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage("Start point must be between 3 and 200 characters"),

  body("endPoint")
    .notEmpty()
    .isString()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage("End point must be between 3 and 200 characters"),

  body("scheduledStartTime")
    .notEmpty()
    .isISO8601()
    .withMessage("Scheduled start time must be a valid date"),

  body("scheduledEndTime")
    .notEmpty()
    .isISO8601()
    .withMessage("Scheduled end time must be a valid date"),

  body("startPointAgent")
    .optional()
    .isMongoId()
    .withMessage("Start point agent must be a valid MongoDB ID"),

  body("endPointAgent")
    .optional()
    .isMongoId()
    .withMessage("End point agent must be a valid MongoDB ID"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(validation(errors.array()));
    }
    next();
  },
];

export const updateSurveyValidator = [
  param("id").isMongoId().withMessage("Invalid survey ID"),

  body("name")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Survey name must be between 3 and 100 characters"),

  body("startPoint")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage("Start point must be between 3 and 200 characters"),

  body("endPoint")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage("End point must be between 3 and 200 characters"),

  body("scheduledStartTime")
    .optional()
    .isISO8601()
    .withMessage("Scheduled start time must be a valid date"),

  body("scheduledEndTime")
    .optional()
    .isISO8601()
    .withMessage("Scheduled end time must be a valid date"),

  body("startPointAgent")
    .optional()
    .isMongoId()
    .withMessage("Start point agent must be a valid MongoDB ID"),

  body("endPointAgent")
    .optional()
    .isMongoId()
    .withMessage("End point agent must be a valid MongoDB ID"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(validation(errors.array()));
    }
    next();
  },
];

export const surveyIdValidator = [
  param("id")
    .isMongoId()
    .withMessage("Invalid survey ID"),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(validation(errors.array()));
    }
    next();
  }
];

export const countVehicleValidator = [
  body("surveyId")
    .notEmpty()
    .isMongoId()
    .withMessage("Survey ID is required and must be a valid MongoDB ID"),
  
  body("vehicleType")
    .notEmpty()
    .isIn(['motorcycle', 'car'])
    .withMessage("Vehicle type must be either 'motorcycle' or 'car'"),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(validation(errors.array()));
    }
    next();
  }
];

export const submitCountingDataValidator = [
  body("surveyId")
    .notEmpty()
    .isMongoId()
    .withMessage("Survey ID is required and must be a valid MongoDB ID"),

  body("counts").notEmpty().isObject().withMessage("Counts must be an object"),

  body("counts.motorcycle")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Motorcycle count must be a non-negative integer"),

  body("counts.car")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Car count must be a non-negative integer"),

  body("counts.truck")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Truck count must be a non-negative integer"),

  body("counts.bus")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Bus count must be a non-negative integer"),

  body("counts.pedestrian")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Pedestrian count must be a non-negative integer"),

  body("countingPost")
    .notEmpty()
    .isIn(["start", "end"])
    .withMessage("Counting post must be either 'start' or 'end'"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(validation(errors.array()));
    }
    next();
  },
];

export const listSurveysValidator = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  
  query("status")
    .optional()
    .isIn(['active', 'inactive', 'archived'])
    .withMessage("Status must be one of: active, inactive, archived"),
  
  query("search")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Search term must be between 1 and 100 characters"),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json(validation(errors.array()));
    }
    next();
  }
];
