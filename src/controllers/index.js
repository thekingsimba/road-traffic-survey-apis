import error from '../config/error.js';
import { authRouter } from './authhelper/auth.router.js';
import { permissionRoutes } from './permission/permission.router.js';
import { roleRouter } from "./role/role.router.js";
import { userRouter } from "./users/users.router.js";

export default function (app) {
  app.use("/api/auth", authRouter);
  app.use("/api/users", userRouter);
  app.use("/api/role", roleRouter);
  app.use("/api/permission", permissionRoutes);
  app.use(error);
}