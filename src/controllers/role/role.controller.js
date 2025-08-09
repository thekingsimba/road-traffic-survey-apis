import { Role } from "./role.schema.js";
import { success, error } from "../../config/response.js";
import Logger from "../../utils/logger.js";
import { paginated_data } from "../../middleware/pagination.js";
import { Permission } from "../../controllers/permission/permission.schema.js";

export const create = async (req, res) => {
  try {
    const { name, permissions } = req.body;
    const existingRole = await Role.findOne({ name });
    if (existingRole) return res.status(400).json(error("Role name already exists", res.statusCode));
    let all_permissions = [];
    for (let permission of permissions) {
      const permissionExists = await Permission.findById(permission);
      if (!permissionExists) continue;
      const perm_data = {name: permissionExists.name, description: permissionExists.description}
      all_permissions.push(perm_data);
    }
    let newRole = new Role({name, permissions: all_permissions });
    newRole = await newRole.save();
    return res.json(success("Success", newRole, res.statusCode));
  } catch (err) {
    Logger.error(`ROLE CREATION ERROR LOGS: ${err}`)
    return res.status(500).json(error("We could not process your request. Try again after a while or contact our support for help", res.statusCode));
  }
}

export const getRoles = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const roles = await Role.find({}).populate("permissions");
    if (roles.length === 0) return res.status(404).json(error("No records found", res.statusCode));
    const result = paginated_data(roles, +page, +limit);
    return res.json(success("Success", result, res.statusCode));
  } catch (err) {
    Logger.error(`ROLE LIST ERROR LOGS: ${err}`);
    return res.status(500).json(error("We could not process your request. Try again after a while or contact our support for help", res.statusCode));
  }
}

export const getClientRoles = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const roles = await Role.find({ name: { $nin: ["super admin", "admin" ]}}).populate("permissions");
    const result = paginated_data(roles, +page, +limit);
    return res.json(success("Success", result, res.statusCode));
  } catch (err) {
    return res.status(500).json(error("We could not process your request. Try again after a while or contact our support for help", res.statusCode));
  }
}

export const addPermissions = async (req, res) => {
  try {
    const { role_id, permissions } = req.body;
    let role;
    const roleExists = await Role.findById(role_id);
    if (!roleExists) return res.status(404).json(error("Role not found", res.statusCode));
    for (let permission of permissions) {
      const permissionExists = await Permission.findById(permission);
      if (!permissionExists) continue;
      const perm_filter = roleExists && roleExists.permissions.filter(p => p.toString() === permissionExists.name.toString());
      if (perm_filter.length === 0) {
        const permission_data = { name: permissionExists.name, description: permissionExists.description }
        role = await Role.findByIdAndUpdate(role_id, { $push: { permissions: permission_data }}, { new: true });
      } else {
        return res.status(400).json(error(`Permission: ${permissionExists && permissionExists.name}, already exists in ${roleExists && roleExists.name}`, res.statusCode));
      }
    }
    return res.json(success("Success", role, res.statusCode));
  } catch (err) {
    return res.status(500).json(error("We could not process your request. Try again after a while or contact our support for help", res.statusCode));
  }
}

export const getRole = async (req, res) => {
  try {
    const role = await Role.findById({ _id: req.query.id });
    return res.json(success("Success", role, res.statusCode));
  } catch (err) {
    Logger.error(`ROLE LIST ERROR LOGS: ${err}`);
    return res.status(500).json(error("We could not process your request. Try again after a while or contact our support for help", res.statusCode));
  }
}

export const updateRole = async (req, res) => {
  try {
    const role = await Role.findByIdAndUpdate({ _id: req.body.id }, req.body, { new: true });
    if (!role) return res.status(404).json(error("No records found", res.statusCode));
    return res.json(success("Success", role, res.statusCode));
  } catch (err) {
    Logger.error(`ROLE LIST ERROR LOGS: ${err}`);
    return res.status(500).json(error("We could not process your request. Try again after a while or contact our support for help", res.statusCode));
  }
}

export const deleteRole = async (req, res) => {
  try {
    const { id } = req.query;
    const role = await Role.findByIdAndDelete({ _id: id });
    if (!role) return res.status(404).json(error("No records found", res.statusCode));
    return res.json(success("Success", role, res.statusCode));
  } catch (err) {
    Logger.error(`ROLE LIST ERROR LOGS: ${err}`);
    return res.status(500).json(error("We could not process your request. Try again after a while or contact our support for help", res.statusCode));
  }
}