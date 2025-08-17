import { Router } from "express";
import { verifyUser } from "../../middleware/auth.js";
import { grantAccess } from "../../middleware/auth.js";
import {
  createSurvey,
  getAllSurveys,
  getSurveyById,
  updateSurvey,
  deleteSurvey,
  startSurvey,
  endSurvey,
  countVehicle,
  getSurveyStats
} from "./survey.controller.js";
import {
  createSurveyValidator,
  updateSurveyValidator,
  surveyIdValidator,
  countVehicleValidator,
  listSurveysValidator
} from "./survey.validation.js";

export const surveyRouter = Router();

// Admin routes - require admin role
surveyRouter.post("/create", verifyUser, grantAccess("survey"), createSurveyValidator, createSurvey);
surveyRouter.put("/:id", verifyUser, grantAccess("survey"), updateSurveyValidator, updateSurvey);
surveyRouter.delete("/:id", verifyUser, grantAccess("survey"), surveyIdValidator, deleteSurvey);

// Routes accessible by both admin and agent - for survey lifecycle control
surveyRouter.put("/:id/start", verifyUser, surveyIdValidator, startSurvey);
surveyRouter.put("/:id/end", verifyUser, surveyIdValidator, endSurvey);

// Routes accessible by both admin and agent
surveyRouter.get("/", verifyUser, listSurveysValidator, getAllSurveys);
surveyRouter.get("/:id", verifyUser, surveyIdValidator, getSurveyById);
surveyRouter.get("/stats/overview", verifyUser, getSurveyStats);

// Agent route - for counting vehicles
surveyRouter.post("/count-vehicle", verifyUser, countVehicleValidator, countVehicle);
