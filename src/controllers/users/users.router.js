import { Router } from "express";
import { verifyUser } from "../../middleware/auth.js";
import {
  createAgent,
  deleteUser,
  email_login,
  email_signup,
  email_validation,
  logout,
  updateUser,
  userDetails,
  userList,
} from "./users.controller.js";
import { email_login_validation } from "./user.validator.js";

export const userRouter = Router();

userRouter.post("/email_signup", email_signup);
userRouter.post("/email_login", email_login_validation, email_login);
userRouter.post("/create-agent", verifyUser, createAgent);
userRouter.get("/list", userList);
userRouter.get("/logout", logout);
userRouter.get("/details", userDetails);
userRouter.put("/update", verifyUser, updateUser);
userRouter.delete("/delete", verifyUser, deleteUser);
