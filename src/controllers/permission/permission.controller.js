import { Permission } from "./permission.schema.js";
import { error, success } from "../../config/response.js";
import { pagination } from "../../middleware/pagination.js";
import Logger from "../../utils/logger.js";

export const create = async (req, res) => {
  try {
    const permissionExists = await Permission.find({});
    let indexOf;
    if (permissionExists.length > 0) {
      const spreadPermission = [...permissionExists]
      indexOf = spreadPermission.findIndex(p => p && p.name.toLowerCase() === req.body.name.toLowerCase());
    }
    if (indexOf >= 0) return res.status(400).json(error("Permission already exists", res.statusCode));
    let permission = new Permission(req.body);
    permission = await permission.save();
    return res.json(success("Success", permission, res.statusCode));
  } catch (err) {
    Logger.error(JSON.stringify(err));
    return res.status(500).json(error("Something went wrong. Please contact support team", res.statusCode));
  }
}

export const permissionList = async (req, res) => {
  try {
    const permissions = await Permission.find({});
    return res.json(success("Success", permissions, res.statusCode));
  } catch (err) {
    Logger.error(JSON.stringify(err));
    return res.status(500).json(error("Something went wrong. Please contact support team", res.statusCode));
  }
}

export const permissionDetails = async (req, res) => {
  try {
    const permission = await Permission.findById(req.query.id);
    return res.json(success("Success", permission, res.statusCode));
  } catch (err) {
    Logger.error(JSON.stringify(err));
    return res.status(500).json(error("Something went wrong. Please contact support team", res.statusCode));
  }
}

export const updatePermission = async (req, res) => {
  try {
    const permission = await Permission.findByIdAndUpdate(req.body.id, req.body, { new: true });
    return res.json(success("Success", permission, res.statusCode));
  } catch (err) {
    Logger.error(JSON.stringify(err));
    return res.status(500).json(error("Something went wrong. Please contact support team", res.statusCode));
  }
}

export const adminPermissionList = async (req, res) => {
  try {
    const { offset, limit }  = pagination(req.query);
    const permissions = await Permission.paginate({}, { offset, limit });
    return res.json(success("Success", permissions, res.statusCode));
  } catch (err) {
    Logger.error(JSON.stringify(err));
    return res.status(500).json(error("Something went wrong. Please contact support team", res.statusCode));
  }
}

export const deletePermission = async (req, res) => {
  try {
    const permission = await Permission.findByIdAndDelete(req.query.id);
    return res.json(success("Success", permission, res.statusCode));
  } catch (err) {
    Logger.error(JSON.stringify(err));
    return res.status(500).json(error("Something went wrong. Please contact support team", res.statusCode));
  }
}

export const searchPermission = async (req, res) => {
  try {
    const searchResult = await Permission.find({ $or: [
      {
        name: {
          $regex: req.query.search_term,
          $options: "i"
        }
      }
    ]}).sort("name")
    return res.json(success("Success", searchResult, res.statusCode));
  } catch (err) {
    Logger.error(JSON.stringify(err));
    return res.status(500).json(error("Something went wrong. Please contact support team", res.statusCode));
  }
}