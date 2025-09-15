import { Survey } from "./survey.schema.js";
import { User } from "../users/users.schema.js";
import { success, error } from "../../config/response.js";
import { paginated_data } from "../../middleware/pagination.js";
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

    return res
      .status(201)
      .json(
        success("Survey created successfully", populatedSurvey, res.statusCode)
      );
  } catch (err) {
    Logger.error(`SURVEY CREATION ERROR: ${err}`);
    return res
      .status(500)
      .json(
        error("Failed to create survey. Please try again.", res.statusCode)
      );
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

    // Add effective status to each survey
    const surveysWithEffectiveStatus = surveys.map((survey) => {
      const surveyObj = survey.toObject();
      surveyObj.effectiveStatus = survey.getEffectiveStatus();
      return surveyObj;
    });

    const result = paginated_data(
      surveysWithEffectiveStatus,
      +page || 1,
      +limit || 20
    );
    return res.json(
      success("Surveys retrieved successfully", result, res.statusCode)
    );
  } catch (err) {
    Logger.error(`SURVEY LIST ERROR: ${err}`);
    return res
      .status(500)
      .json(
        error("Failed to retrieve surveys. Please try again.", res.statusCode)
      );
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

    // Add effective status to survey
    const surveyObj = survey.toObject();
    surveyObj.effectiveStatus = survey.getEffectiveStatus();

    return res.json(
      success("Survey retrieved successfully", surveyObj, res.statusCode)
    );
  } catch (err) {
    Logger.error(`SURVEY DETAIL ERROR: ${err}`);
    return res
      .status(500)
      .json(
        error("Failed to retrieve survey. Please try again.", res.statusCode)
      );
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
    return res
      .status(500)
      .json(
        error("Failed to update survey. Please try again.", res.statusCode)
      );
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
    return res
      .status(500)
      .json(
        error("Failed to delete survey. Please try again.", res.statusCode)
      );
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
    const isAdmin = req.user.role && req.user.role.name === "admin";
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

    if (survey.status !== "inactive") {
      return res
        .status(400)
        .json(
          error("Survey can only be started if it's inactive", res.statusCode)
        );
    }

    const now = new Date();
    if (now < survey.scheduledStartTime) {
      return res
        .status(400)
        .json(
          error(
            "Cannot start survey before scheduled start time",
            res.statusCode
          )
        );
    }

    survey.status = "active";
    survey.actualStartTime = now;
    await survey.save();

    const updatedSurvey = await Survey.findById(id)
      .populate("startPointAgent", "full_name email phone")
      .populate("endPointAgent", "full_name email")
      .populate("createdBy", "full_name email");

    return res.json(
      success("Survey started successfully", updatedSurvey, res.statusCode)
    );
  } catch (err) {
    Logger.error(`SURVEY START ERROR: ${err}`);
    return res
      .status(500)
      .json(error("Failed to start survey. Please try again.", res.statusCode));
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
    const isAdmin = req.user.role && req.user.role.name === "admin";
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

    if (survey.status !== "active") {
      return res
        .status(400)
        .json(error("Survey can only be ended if it's active", res.statusCode));
    }

    survey.status = "archived";
    survey.actualEndTime = new Date();
    await survey.save();

    const updatedSurvey = await Survey.findById(id)
      .populate("startPointAgent", "full_name email phone")
      .populate("endPointAgent", "full_name email")
      .populate("createdBy", "full_name email");

    return res.json(
      success("Survey ended successfully", updatedSurvey, res.statusCode)
    );
  } catch (err) {
    Logger.error(`SURVEY END ERROR: ${err}`);
    return res
      .status(500)
      .json(error("Failed to end survey. Please try again.", res.statusCode));
  }
};

// Count vehicle (Agent only)
export const countVehicle = async (req, res) => {
  try {
    const { surveyId, vehicleType } = req.body;

    if (!["motorcycle", "car"].includes(vehicleType)) {
      return res
        .status(400)
        .json(
          error(
            "Invalid vehicle type. Must be 'motorcycle' or 'car'",
            res.statusCode
          )
        );
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
      return res
        .status(400)
        .json(
          error(
            "Survey is not active or has ended. Cannot count vehicles.",
            res.statusCode
          )
        );
    }

    // Increment the appropriate count
    if (vehicleType === "motorcycle") {
      survey.motorcycleCount += 1;
    } else {
      survey.carCount += 1;
    }

    await survey.save();

    const updatedSurvey = await Survey.findById(surveyId)
      .populate("startPointAgent", "full_name email phone")
      .populate("endPointAgent", "full_name email")
      .populate("createdBy", "full_name email");

    return res.json(
      success(
        `${vehicleType} counted successfully`,
        updatedSurvey,
        res.statusCode
      )
    );
  } catch (err) {
    Logger.error(`VEHICLE COUNT ERROR: ${err}`);
    return res
      .status(500)
      .json(
        error("Failed to count vehicle. Please try again.", res.statusCode)
      );
  }
};

// Submit counting data for a survey
export const submitCountingData = async (req, res) => {
  try {
    const { surveyId, counts, countingPost } = req.body;

    // Validate counting post
    if (!["start", "end"].includes(countingPost)) {
      return res
        .status(400)
        .json(
          error(
            "Invalid counting post. Must be 'start' or 'end'",
            res.statusCode
          )
        );
    }

    // Validate counts object
    const validVehicleTypes = [
      "motorcycle",
      "car",
      "truck",
      "bus",
      "pedestrian",
    ];
    for (const [vehicleType, count] of Object.entries(counts)) {
      if (!validVehicleTypes.includes(vehicleType)) {
        return res
          .status(400)
          .json(error(`Invalid vehicle type: ${vehicleType}`, res.statusCode));
      }
      if (typeof count !== "number" || count < 0) {
        return res
          .status(400)
          .json(
            error(
              `Invalid count for ${vehicleType}. Must be a non-negative number`,
              res.statusCode
            )
          );
      }
    }

    const survey = await Survey.findById(surveyId);

    if (!survey) {
      return res.status(404).json(error("Survey not found", res.statusCode));
    }

    // Check if agent is assigned to this survey
    const isStartPointAgent =
      survey.startPointAgent?.toString() === req.user._id.toString();
    const isEndPointAgent =
      survey.endPointAgent?.toString() === req.user._id.toString();
    const isAdmin = req.user.role && req.user.role.name === "admin";

    if (!isAdmin && !isStartPointAgent && !isEndPointAgent) {
      return res
        .status(403)
        .json(
          error(
            "Access denied. You can only submit counting data for assigned surveys.",
            res.statusCode
          )
        );
    }

    // Check if survey can be counted (considers time-based activation)
    if (!survey.canBeCounted()) {
      return res
        .status(400)
        .json(
          error("Survey must be active to submit counting data", res.statusCode)
        );
    }

    // Check if user has permission to submit for this counting post
    if (countingPost === "start" && !isStartPointAgent && !isAdmin) {
      return res
        .status(403)
        .json(
          error(
            "Access denied. You can only submit start point counting data",
            res.statusCode
          )
        );
    }
    if (countingPost === "end" && !isEndPointAgent && !isAdmin) {
      return res
        .status(403)
        .json(
          error(
            "Access denied. You can only submit end point counting data",
            res.statusCode
          )
        );
    }

    // Update counts
    survey.motorcycleCount =
      (survey.motorcycleCount || 0) + (counts.motorcycle || 0);
    survey.carCount = (survey.carCount || 0) + (counts.car || 0);
    survey.truckCount = (survey.truckCount || 0) + (counts.truck || 0);
    survey.busCount = (survey.busCount || 0) + (counts.bus || 0);
    survey.pedestrianCount =
      (survey.pedestrianCount || 0) + (counts.pedestrian || 0);

    // Mark the appropriate submission flag
    if (countingPost === "start") {
      survey.startPointSubmitted = true;
    } else if (countingPost === "end") {
      survey.endPointSubmitted = true;
    }

    // When counting data is submitted, immediately set status to terminated
    survey.status = "terminated";
    survey.actualEndTime = new Date();

    await survey.save();

    return res.json(
      success(
        "Counting data submitted successfully. Survey has been terminated.",
        {
          surveyId: survey._id,
          counts: {
            motorcycle: survey.motorcycleCount,
            car: survey.carCount,
            truck: survey.truckCount,
            bus: survey.busCount,
            pedestrian: survey.pedestrianCount,
          },
          countingPost,
          submittedAt: new Date().toISOString(),
          surveyStatus: survey.status,
          terminated: true,
        },
        res.statusCode
      )
    );
  } catch (err) {
    Logger.error(`COUNTING DATA SUBMISSION ERROR: ${err}`);
    return res
      .status(500)
      .json(
        error(
          "Failed to submit counting data. Please try again.",
          res.statusCode
        )
      );
  }
};

// Get counting data for a survey
export const getCountingData = async (req, res) => {
  try {
    const { id } = req.params;
    const survey = await Survey.findById(id)
      .populate("startPointAgent", "full_name email phone")
      .populate("endPointAgent", "full_name email")
      .populate("createdBy", "full_name email");

    if (!survey) {
      return res.status(404).json(error("Survey not found", res.statusCode));
    }

    // Check if user has access to this survey
    const isAdmin = req.user.role && req.user.role.name === "admin";
    const isStartPointAgent =
      survey.startPointAgent?.toString() === req.user._id.toString();
    const isEndPointAgent =
      survey.endPointAgent?.toString() === req.user._id.toString();

    if (!isAdmin && !isStartPointAgent && !isEndPointAgent) {
      return res
        .status(403)
        .json(
          error(
            "Access denied. You can only view counting data for assigned surveys.",
            res.statusCode
          )
        );
    }

    return res.json(
      success(
        "Counting data retrieved successfully",
        {
          surveyId: survey._id,
          startPointCounts: {
            motorcycle: survey.motorcycleCount || 0,
            car: survey.carCount || 0,
            truck: survey.truckCount || 0,
            bus: survey.busCount || 0,
            pedestrian: survey.pedestrianCount || 0,
          },
          endPointCounts: {
            motorcycle: survey.motorcycleCount || 0,
            car: survey.carCount || 0,
            truck: survey.truckCount || 0,
            bus: survey.busCount || 0,
            pedestrian: survey.pedestrianCount || 0,
          },
          lastUpdated: survey.updatedAt,
        },
        res.statusCode
      )
    );
  } catch (err) {
    Logger.error(`COUNTING DATA RETRIEVAL ERROR: ${err}`);
    return res
      .status(500)
      .json(
        error(
          "Failed to retrieve counting data. Please try again.",
          res.statusCode
        )
      );
  }
};

// Get survey statistics
export const exportSurveyCsv = async (req, res) => {
  try {
    const { id } = req.params;
    const survey = await Survey.findById(id)
      .populate("startPointAgent", "full_name email")
      .populate("endPointAgent", "full_name email")
      .populate("createdBy", "full_name email");

    if (!survey) {
      return res.status(404).json(error("Survey not found", res.statusCode));
    }

    // Get counting data for the survey
    const countingData = await Survey.findById(id).select(
      "startPointCounts endPointCounts"
    );

    // Create CSV content
    let csvContent = "Survey Export Data\n";
    csvContent +=
      "Survey Name,Start Point,End Point,Status,Start Point Agent,End Point Agent,Scheduled Start Time,Scheduled End Time,Actual Start Time,Actual End Time\n";

    const startPointAgentName = survey.startPointAgent
      ? survey.startPointAgent.full_name
      : "N/A";
    const endPointAgentName = survey.endPointAgent
      ? survey.endPointAgent.full_name
      : "N/A";
    const scheduledStartTime = survey.scheduledStartTime
      ? new Date(survey.scheduledStartTime).toISOString()
      : "N/A";
    const scheduledEndTime = survey.scheduledEndTime
      ? new Date(survey.scheduledEndTime).toISOString()
      : "N/A";
    const actualStartTime = survey.actualStartTime
      ? new Date(survey.actualStartTime).toISOString()
      : "N/A";
    const actualEndTime = survey.actualEndTime
      ? new Date(survey.actualEndTime).toISOString()
      : "N/A";

    csvContent += `"${survey.name}","${survey.startPoint}","${survey.endPoint}","${survey.status}","${startPointAgentName}","${endPointAgentName}","${scheduledStartTime}","${scheduledEndTime}","${actualStartTime}","${actualEndTime}"\n`;

    // Add counting data if available
    if (
      countingData &&
      (countingData.startPointCounts || countingData.endPointCounts)
    ) {
      csvContent += "\nCounting Data\n";
      csvContent += "Location,Vehicle Type,Count\n";

      if (countingData.startPointCounts) {
        const counts = countingData.startPointCounts;
        csvContent += `"Start Point","Motorcycle","${
          counts.motorcycle || 0
        }"\n`;
        csvContent += `"Start Point","Car","${counts.car || 0}"\n`;
        csvContent += `"Start Point","Truck","${counts.truck || 0}"\n`;
        csvContent += `"Start Point","Bus","${counts.bus || 0}"\n`;
        csvContent += `"Start Point","Pedestrian","${
          counts.pedestrian || 0
        }"\n`;
      }

      if (countingData.endPointCounts) {
        const counts = countingData.endPointCounts;
        csvContent += `"End Point","Motorcycle","${counts.motorcycle || 0}"\n`;
        csvContent += `"End Point","Car","${counts.car || 0}"\n`;
        csvContent += `"End Point","Truck","${counts.truck || 0}"\n`;
        csvContent += `"End Point","Bus","${counts.bus || 0}"\n`;
        csvContent += `"End Point","Pedestrian","${counts.pedestrian || 0}"\n`;
      }
    }

    // Set headers for CSV download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="survey-${survey.name.replace(
        /[^a-zA-Z0-9]/g,
        "_"
      )}-${new Date().toISOString().split("T")[0]}.csv"`
    );

    return res.send(csvContent);
  } catch (err) {
    Logger.error(`SURVEY EXPORT ERROR: ${err}`);
    return res
      .status(500)
      .json(
        error("Failed to export survey data. Please try again.", res.statusCode)
      );
  }
};

export const getSurveyStats = async (req, res) => {
  try {
    const stats = await Survey.aggregate([
      {
        $group: {
          _id: null,
          totalSurveys: { $sum: 1 },
          activeSurveys: {
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
          },
          inactiveSurveys: {
            $sum: { $cond: [{ $eq: ["$status", "inactive"] }, 1, 0] },
          },
          archivedSurveys: {
            $sum: { $cond: [{ $eq: ["$status", "archived"] }, 1, 0] },
          },
          totalMotorcycles: { $sum: "$motorcycleCount" },
          totalCars: { $sum: "$carCount" },
          totalTrucks: { $sum: "$truckCount" },
          totalBuses: { $sum: "$busCount" },
          totalPedestrians: { $sum: "$pedestrianCount" },
        },
      },
    ]);

    const result = stats[0] || {
      totalSurveys: 0,
      activeSurveys: 0,
      inactiveSurveys: 0,
      archivedSurveys: 0,
      totalMotorcycles: 0,
      totalCars: 0,
      totalTrucks: 0,
      totalBuses: 0,
      totalPedestrians: 0,
    };

    result.totalVehicles =
      result.totalMotorcycles +
      result.totalCars +
      result.totalTrucks +
      result.totalBuses +
      result.totalPedestrians;

    return res.json(
      success("Statistics retrieved successfully", result, res.statusCode)
    );
  } catch (err) {
    Logger.error(`SURVEY STATS ERROR: ${err}`);
    return res
      .status(500)
      .json(
        error(
          "Failed to retrieve statistics. Please try again.",
          res.statusCode
        )
      );
  }
};

