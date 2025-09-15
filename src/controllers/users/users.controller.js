import { User } from "./users.schema.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { success, error } from "../../config/response.js";
import key from "../../config/key.js";
import { paginated_data, pagination } from "../../middleware/pagination.js";
import { Role } from "../../controllers/role/role.schema.js";
import Logger from "../../utils/logger.js";

export const email_signup = async (req, res) => {
  try {
    const data = req.body;
    const user = await User.findOne({ email: data.email });
    const user_role = await Role.findOne({ name: "user" });
    if (user)
      return res
        .status(400)
        .json(error("Email already exists", res.statusCode));

    const hash = bcrypt.hashSync(data.password, 12);
    let newUser = new User({
      full_name: data.full_name,
      email: data.email,
      password: hash,
      phone: data.phone,
      picture: data.picture,
      role: user_role ? user_role._id : null, // Allow null role for initial setup
    });

    newUser = await newUser.save();
    // Populate role information
    await newUser.populate("role", "name");
    const now = new Date();
    const expires_at = new Date(now.setDate(now.getDate() + 30));
    const { full_name, phone, email, _id, picture, role } = newUser;
    const token = jwt.sign({ _id, email, full_name, role }, key.SECRET, {
      expiresIn: "30d",
    });
    res.cookie("token", `Bearer ${token}`, {
      expires: new Date(new Date().getDate() + 64800000),
    });
    return res.header("authorization", `Bearer ${token}`).json(
      success(
        "Login success!",
        {
          token,
          expires_at,
          user: {
            full_name,
            email,
            _id,
            phone,
            picture,
            role: role ? { id: role._id, name: role.name } : null,
          },
        },
        res.statusCode
      )
    );
  } catch (err) {
    Logger.error(JSON.stringify(err));
    return res
      .status(500)
      .json(
        error(
          "We could not process your request. Try again after a while or contact our support for help",
          res.statusCode
        )
      );
  }
};

// Create agent (Admin only)
export const createAgent = async (req, res) => {
  try {
    const { full_name, email, phone, countingPost, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json(error("Email already exists", res.statusCode));
    }

    // Get agent role
    const agentRole = await Role.findOne({ name: "agent" });
    if (!agentRole) {
      return res
        .status(500)
        .json(
          error(
            "Agent role not found. Please contact administrator.",
            res.statusCode
          )
        );
    }

    // Generate initial password if not provided
    const initialPassword = password || "Agent123!";
    const hash = bcrypt.hashSync(initialPassword, 12);

    const newAgent = new User({
      full_name,
      email,
      phone,
      password: hash,
      role: agentRole._id,
      countingPost,
    });

    await newAgent.save();

    const agentData = {
      _id: newAgent._id,
      full_name: newAgent.full_name,
      email: newAgent.email,
      phone: newAgent.phone,
      role: newAgent.role,
      countingPost: newAgent.countingPost,
    };

    return res
      .status(201)
      .json(success("Agent created successfully", agentData, res.statusCode));
  } catch (err) {
    Logger.error(`AGENT CREATION ERROR: ${err}`);
    return res
      .status(500)
      .json(error("Failed to create agent. Please try again.", res.statusCode));
  }
};

export const email_validation = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (user)
      return res.status(200).json(success("Success", user, res.statusCode));
    if (!user)
      return res.status(404).json(error("User does not exist", res.statusCode));
  } catch (err) {
    return res
      .status(500)
      .json(
        error(
          "We could not process your request. Try again after a while or contact our support for help",
          res.statusCode
        )
      );
  }
};

export const email_login = async (req, res) => {
  try {
    let userExists = await User.findOne({ email: req.body.email }).populate(
      "role",
      "name"
    );
    if (!userExists)
      return res.status(404).json(error("User does not exist", res.statusCode));
    const isMatched = bcrypt.compareSync(
      req.body.password,
      userExists.password
    );
    if (!isMatched)
      return res.status(400).json(error("Invalid password", res.statusCode));
    const now = new Date();
    const expires_at = new Date(now.setDate(now.getDate() + 30));
    const { full_name, email, _id, phone, role } = userExists;
    const token = jwt.sign({ _id, email, full_name, role }, key.SECRET, {
      expiresIn: "30 days",
    });
    res.cookie("token", `Bearer ${token}`, {
      expires: new Date(new Date().getDate() + 64800000),
    });

    return res.header("authorization", `Bearer ${token}`).json(
      success(
        "Login success!",
        {
          token,
          expires_at,
          user: {
            full_name,
            email,
            _id,
            phone,
            role: role ? { id: role._id, name: role.name } : null,
          },
        },
        res.statusCode
      )
    );
  } catch (err) {
    return res
      .status(500)
      .json(
        error(
          "We could not process your request. Try again after a while or contact our support for help",
          res.statusCode
        )
      );
  }
};

export const userList = async (req, res) => {
  try {
    const { page, limit, role } = req.query;

    // Build query filter
    let queryFilter = {};
    if (role) {
      // If role is specified, find users with that role
      const roleDoc = await Role.findOne({ name: role });
      if (roleDoc) {
        queryFilter.role = roleDoc._id;
      }
    }

    const users = await User.find(queryFilter)
      .select("-reset_password_expires -reset_password_otp")
      .populate("role", "name");
    const result = paginated_data(users, +(page || 1), +(limit || 20));
    return res.json(success("Success", result, res.statusCode));
  } catch (err) {
    return res
      .status(500)
      .json(
        error(
          "We could not process your request. Try again after a while or contact our support for help",
          res.statusCode
        )
      );
  }
};

export const userDetails = async (req, res) => {
  try {
    const user = await User.findById({ _id: req.query.id }).select(
      "-reset_password_expires -reset_password_otp"
    );
    if (!user)
      return res.status(404).json(error("User does not exist", res.statusCode));
    return res.json(success("Success", user, res.statusCode));
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json(
        error(
          "We could not process your request. Try again after a while or contact our support for help",
          res.statusCode
        )
      );
  }
};

export const updateUser = async (req, res) => {
  try {
    let updatedUser = await User.findByIdAndUpdate(
      { _id: req.body.id },
      req.body,
      { new: true }
    );
    if (!updatedUser)
      return res.status(404).json(error("User does not exist", res.statusCode));
    delete updateUser.device_token;
    return res.json(success("Success", updatedUser, res.statusCode));
  } catch (err) {
    return res
      .status(500)
      .json(
        error(
          "We could not process your request. Try again after a while or contact our support for help",
          res.statusCode
        )
      );
  }
};

export const deleteUser = async (req, res) => {
  try {
    let deletedUser = await User.findByIdAndDelete({ _id: req.query.id });
    if (!deletedUser)
      return res.status(404).json(error("User does not exist", res.statusCode));
    delete deletedUser.device_token;
    return res.json(success("Success", deletedUser, res.statusCode));
  } catch (err) {
    return res
      .status(500)
      .json(
        error(
          "We could not process your request. Try again after a while or contact our support for help",
          res.statusCode
        )
      );
  }
};

export const search_customers = async (req, res) => {
  try {
    const { limit, offset } = pagination(req.query);
    const { search_term } = req.query;
    const search_result = await User.paginate(
      {
        $or: [
          {
            full_name: {
              $regex: search_term,
              $options: "i",
            },
          },
          {
            email: {
              $regex: search_term,
              $options: "i",
            },
          },
          {
            phone: {
              $regex: search_term,
              $options: "i",
            },
          },
        ],
      },
      {
        limit,
        offset,
      }
    );
    return res.json(success("Success", search_result, res.statusCode));
  } catch (err) {
    Logger.error(JSON.stringify(err));
    return res
      .status(500)
      .json(
        error(
          "Something went wrong. Contact support for assistance",
          res.statusCode
        )
      );
  }
};

export const logout = async (req, res) => {
  try {
    return res
      .clearCookie("token")
      .json(success("Successfully logged out", {}, res.statusCode));
  } catch (err) {
    return res
      .status(500)
      .json(
        error(
          "Something went wrong. Please contact our support for help",
          res.statusCode
        )
      );
  }
};
