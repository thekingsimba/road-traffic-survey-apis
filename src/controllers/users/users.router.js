import { Router } from "express";
import { verifyUser } from "../../middleware/auth.js";
import { 
  deleteUser, 
  email_login, 
  email_signup, 
  email_validation, 
  logout, 
  resend_otp,  
  updateUser, 
  userDetails, 
  userList, 
  verify_phone_number
} from "./users.controller.js";
import { email_login_validation } from "./user.validator.js";

export const userRouter = Router();

userRouter.post("/email_signup", email_signup);
userRouter.post("/email_login", email_login_validation, email_login);
userRouter.post("/otp/resend", resend_otp);
userRouter.post("/verify", verify_phone_number);
userRouter.get("/list", userList);
userRouter.get("/logout", logout);
userRouter.get("/details", userDetails);
userRouter.put("/update", verifyUser, updateUser);
userRouter.delete("/delete", verifyUser, deleteUser);
userRouter.post("/verify/email", email_validation);