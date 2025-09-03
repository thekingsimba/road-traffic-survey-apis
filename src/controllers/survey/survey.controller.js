import { Survey } from "./survey.schema.js";
import { User } from "../users/users.schema.js";
import { success, error } from "../../config/response.js";
import { paginated_data, pagination } from "../../middleware/pagination.js";
import Logger from "../../utils/logger.js";

// Create a new survey (Admin only)
export const createSurvey = async (req, res) => {
  try {
    const {
      name,
      startPoint,
      endPoint,
      scheduledStartTime,
      scheduledEndTime,
      startPointAgent,
      endPointAgent,
    } = req.body;

    // Validate time constraints
    if (new Date(scheduledStartTime) >= new Date(scheduledEndTime)) {
      return res
        .status(400)
        .json(error("End time must be after start time", res.statusCode));
    }

    // Check if start point agent exists and has agent role
    if (startPointAgent) {
      const agent = await User.findById(startPointAgent).populate("role");
      if (!agent) {
        return res
          .status(404)
          .json(error("Start point agent not found", res.statusCode));
      }
      if (agent.role && agent.role.name !== "agent") {
        return res
          .status(400)
          .json(error("Start point user must have agent role", res.statusCode));
      }
    }

    // Check if end point agent exists and has agent role
    if (endPointAgent) {
      const agent = await User.findById(endPointAgent).populate("role");
      if (!agent) {
        return res
          .status(404)
          .json(error("End point agent not found", res.statusCode));
      }
      if (agent.role && agent.role.name !== "agent") {
        return res
          .status(400)
          .json(error("End point user must have agent role", res.statusCode));
      }
    }

    const survey = new Survey({
      name,
      startPoint,
      endPoint,
      scheduledStartTime,
      scheduledEndTime,
      startPointAgent,
      endPointAgent,
      createdBy: req.user._id,
    });

    const savedSurvey = await survey.save();
    const populatedSurvey = await Survey.findById(savedSurvey._id)
      .populate("startPointAgent", "full_name email phone")
      .populate("endPointAgent", "full_name email")
      .populate("createdBy", "full_name email");

    return res.status(201).json(success("Survey created successfully", populatedSurvey, res.statusCode));
  } catch (err) {
    Logger.error(`SURVEY CREATION ERROR: ${err}`);
    return res.status(500).json(error("Failed to create survey. Please try again.", res.statusCode));
  }
};

// Get all surveys (Admin can see all, Agent can see assigned ones)
export const getAllSurveys = async (req, res) => {
  try {
    const { page, limit, status, search } = req.query;
    let query = {};

    // If user is an agent, only show surveys where they are assigned to start or end point
    if (req.user.role && req.user.role.name === "agent") {
      query.$or = [
        { startPointAgent: req.user._id },
        { endPointAgent: req.user._id },
      ];
    }

    // Filter by status if provided
    if (status && ["active", "inactive", "archived"].includes(status)) {
      query.status = status;
    }

    // Search by name if provided
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const surveys = await Survey.find(query)
      .populate("startPointAgent", "full_name email phone")
      .populate("endPointAgent", "full_name email")
      .populate("createdBy", "full_name email")
      .sort({ createdAt: -1 });

    const result = paginated_data(surveys, +page || 1, +limit || 20);
    return res.json(
      success("Surveys retrieved successfully", result, res.statusCode)
    );
  } catch (err) {
    Logger.error(`SURVEY LIST ERROR: ${err}`);
    return res.status(500).json(error("Failed to retrieve surveys. Please try again.", res.statusCode));
  }
};

// Get survey by ID
export const getSurveyById = async (req, res) => {
  try {
    const { id } = req.params;
    const survey = await Survey.findById(id)
      .populate("startPointAgent", "full_name email phone")
      .populate("endPointAgent", "full_name email")
      .populate("createdBy", "full_name email");

    if (!survey) {
      return res.status(404).json(error("Survey not found", res.statusCode));
    }

    // Check if agent can access this survey
    if (
      req.user.role &&
      req.user.role.name === "agent" &&
      survey.startPointAgent?.toString() !== req.user._id.toString() &&
      survey.endPointAgent?.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json(
          error(
            "Access denied. You can only view assigned surveys.",
            res.statusCode
          )
        );
    }

    return res.json(success("Survey retrieved successfully", survey, res.statusCode));
  } catch (err) {
    Logger.error(`SURVEY DETAIL ERROR: ${err}`);
    return res.status(500).json(error("Failed to retrieve survey. Please try again.", res.statusCode));
  }
};

// Update survey (Admin only)
export const updateSurvey = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData.motorcycleCount;
    delete updateData.carCount;
    delete updateData.actualStartTime;
    delete updateData.actualEndTime;

    // Validate time constraints if updating times
    if (updateData.scheduledStartTime && updateData.scheduledEndTime) {
      if (
        new Date(updateData.scheduledStartTime) >=
        new Date(updateData.scheduledEndTime)
      ) {
        return res
          .status(400)
          .json(error("End time must be after start time", res.statusCode));
      }
    }

    // Check if start point agent exists and has agent role
    if (updateData.startPointAgent) {
      const agent = await User.findById(updateData.startPointAgent).populate(
        "role"
      );
      if (!agent) {
        return res
          .status(404)
          .json(error("Start point agent not found", res.statusCode));
      }
      if (agent.role && agent.role.name !== "agent") {
        return res
          .status(400)
          .json(error("Start point user must have agent role", res.statusCode));
      }
    }

    // Check if end point agent exists and has agent role
    if (updateData.endPointAgent) {
      const agent = await User.findById(updateData.endPointAgent).populate(
        "role"
      );
      if (!agent) {
        return res
          .status(404)
          .json(error("End point agent not found", res.statusCode));
      }
      if (agent.role && agent.role.name !== "agent") {
        return res
          .status(400)
          .json(error("End point user must have agent role", res.statusCode));
      }
    }

    const survey = await Survey.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("startPointAgent", "full_name email phone")
      .populate("endPointAgent", "full_name email")
      .populate("createdBy", "full_name email");

    if (!survey) {
      return res.status(404).json(error("Survey not found", res.statusCode));
    }

    return res.json(
      success("Survey updated successfully", survey, res.statusCode)
    );
  } catch (err) {
    Logger.error(`SURVEY UPDATE ERROR: ${err}`);
    return res.status(500).json(error("Failed to update survey. Please try again.", res.statusCode));
  }
};

// Delete survey (Admin only)
export const deleteSurvey = async (req, res) => {
  try {
    const { id } = req.params;
    const survey = await Survey.findByIdAndDelete(id);

    if (!survey) {
      return res.status(404).json(error("Survey not found", res.statusCode));
    }

    return res.json(success("Survey deleted successfully", {}, res.statusCode));
  } catch (err) {
    Logger.error(`SURVEY DELETE ERROR: ${err}`);
    return res.status(500).json(error("Failed to delete survey. Please try again.", res.statusCode));
  }
};

// Start survey (Admin or assigned Agent)
export const startSurvey = async (req, res) => {
  try {
    const { id } = req.params;
    const survey = await Survey.findById(id);

    if (!survey) {
      return res.status(404).json(error("Survey not found", res.statusCode));
    }

    // Check if user is admin or assigned agent
    const isAdmin = req.user.role && req.user.role.name === 'admin';
    const isStartPointAgent =
      survey.startPointAgent &&
      survey.startPointAgent.toString() === req.user._id.toString();
    const isEndPointAgent =
      survey.endPointAgent &&
      survey.endPointAgent.toString() === req.user._id.toString();
    
    if (!isAdmin && !isStartPointAgent && !isEndPointAgent) {
      return res
        .status(403)
        .json(
          error(
            "Access denied. Only admin or assigned agent can start this survey.",
            res.statusCode
          )
        );
    }

    if (survey.status !== 'inactive') {
      return res.status(400).json(error("Survey can only be started if it's inactive", res.statusCode));
    }

    const now = new Date();
    if (now < survey.scheduledStartTime) {
      return res.status(400).json(error("Cannot start survey before scheduled start time", res.statusCode));
    }

    survey.status = 'active';
    survey.actualStartTime = now;
    await survey.save();

    const updatedSurvey = await Survey.findById(id)
      .populate("startPointAgent", "full_name email phone")
      .populate("endPointAgent", "full_name email")
      .populate("createdBy", "full_name email");

    return res.json(success("Survey started successfully", updatedSurvey, res.statusCode));
  } catch (err) {
    Logger.error(`SURVEY START ERROR: ${err}`);
    return res.status(500).json(error("Failed to start survey. Please try again.", res.statusCode));
  }
};

// End survey (Admin or assigned Agent)
export const endSurvey = async (req, res) => {
  try {
    const { id } = req.params;
    const survey = await Survey.findById(id);

    if (!survey) {
      return res.status(404).json(error("Survey not found", res.statusCode));
    }

    // Check if user is admin or assigned agent
    const isAdmin = req.user.role && req.user.role.name === 'admin';
    const isStartPointAgent =
      survey.startPointAgent &&
      survey.startPointAgent.toString() === req.user._id.toString();
    const isEndPointAgent =
      survey.endPointAgent &&
      survey.endPointAgent.toString() === req.user._id.toString();
    
    if (!isAdmin && !isStartPointAgent && !isEndPointAgent) {
      return res
        .status(403)
        .json(
          error(
            "Access denied. Only admin or assigned agent can end this survey.",
            res.statusCode
          )
        );
    }

    if (survey.status !== 'active') {
      return res.status(400).json(error("Survey can only be ended if it's active", res.statusCode));
    }

    survey.status = 'archived';
    survey.actualEndTime = new Date();
    await survey.save();

    const updatedSurvey = await Survey.findById(id)
      .populate("startPointAgent", "full_name email phone")
      .populate("endPointAgent", "full_name email")
      .populate("createdBy", "full_name email");

    return res.json(success("Survey ended successfully", updatedSurvey, res.statusCode));
  } catch (err) {
    Logger.error(`SURVEY END ERROR: ${err}`);
    return res.status(500).json(error("Failed to end survey. Please try again.", res.statusCode));
  }
};

// Count vehicle (Agent only)
export const countVehicle = async (req, res) => {
  try {
    const { surveyId, vehicleType } = req.body;

    if (!['motorcycle', 'car'].includes(vehicleType)) {
      return res.status(400).json(error("Invalid vehicle type. Must be 'motorcycle' or 'car'", res.statusCode));
    }

    const survey = await Survey.findById(surveyId);

    if (!survey) {
      return res.status(404).json(error("Survey not found", res.statusCode));
    }

    // Check if agent is assigned to this survey
    if (
      survey.startPointAgent?.toString() !== req.user._id.toString() &&
      survey.endPointAgent?.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json(
          error(
            "Access denied. You can only count vehicles for assigned surveys.",
            res.statusCode
          )
        );
    }

    // Check if survey can be counted
    if (!survey.canBeCounted()) {
      return res.status(400).json(error("Survey is not active or has ended. Cannot count vehicles.", res.statusCode));
    }

    // Increment the appropriate count
    if (vehicleType === 'motorcycle') {
      survey.motorcycleCount += 1;
    } else {
      survey.carCount += 1;
    }

    await survey.save();

    const updatedSurvey = await Survey.findById(surveyId)
      .populate("startPointAgent", "full_name email phone")
      .populate("endPointAgent", "full_name email")
      .populate("createdBy", "full_name email");

    return res.json(success(`${vehicleType} counted successfully`, updatedSurvey, res.statusCode));
  } catch (err) {
    Logger.error(`VEHICLE COUNT ERROR: ${err}`);
    return res.status(500).json(error("Failed to count vehicle. Please try again.", res.statusCode));
  }
};

// Get survey statistics
export const getSurveyStats = async (req, res) => {
  try {
    const stats = await Survey.aggregate([
      {
        $group: {
          _id: null,
          totalSurveys: { $sum: 1 },
          activeSurveys: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          inactiveSurveys: {
            $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] }
          },
          archivedSurveys: {
            $sum: { $cond: [{ $eq: ['$status', 'archived'] }, 1, 0] }
          },
          totalMotorcycles: { $sum: '$motorcycleCount' },
          totalCars: { $sum: '$carCount' }
        }
      }
    ]);

    const result = stats[0] || {
      totalSurveys: 0,
      activeSurveys: 0,
      inactiveSurveys: 0,
      archivedSurveys: 0,
      totalMotorcycles: 0,
      totalCars: 0
    };

    result.totalVehicles = result.totalMotorcycles + result.totalCars;

    return res.json(success("Statistics retrieved successfully", result, res.statusCode));
  } catch (err) {
    Logger.error(`SURVEY STATS ERROR: ${err}`);
    return res.status(500).json(error("Failed to retrieve statistics. Please try again.", res.statusCode));
  }
};
