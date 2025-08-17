import bcrypt from "bcrypt";
import { sendEmail } from "../../utils/mailer.js";
import { otp_code } from "../../utils/code_gen.js";
import { User } from "../../controllers/users/users.schema.js";
import { error, success } from "../../config/response.js";
import { dynamic_template_data } from "../../utils/template.js";
import { emailTemplates } from "../../config/emailTemplatesId.js";
import Logger from "../../utils/logger.js";

export const forgotPassword = async (req, res) => {
  const { user_type } = req.body;
  try {
    let Account;

    switch (user_type) {
      case "user":
        Account = User;
        break;
      default:
        return res.status(400).json(error("Invalid user type", res.statusCode));
    }

    let isAccount = await Account.findOne({ email: req.body.email });
    if (!isAccount)
      return res
        .status(404)
        .json(
          error(
            `We could not find any account with the email ${req.body.email}`,
            res.statusCode
          )
        );

    isAccount.reset_password_otp = otp_code();
    isAccount.resetPasswordExpires = Date.now() + 3600000;

    isAccount = await isAccount.save();
    let link = isAccount.reset_password_otp;

    const name = isAccount.full_name.split(" ")[0];
    const email = isAccount.email;
    const mail_data = dynamic_template_data({
      email,
      template_id: emailTemplates.forgotPasswordEmail,
      data: { first_name: name, verification_code: link },
    });
    sendEmail(mail_data);
    return res.json(
      success("A password reset email was sent to you", {}, res.statusCode)
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

export const resetPassword = async (req, res) => {
  const { user_type } = req.body;
  try {
    let Account;

    switch (user_type) {
      case "user":
        Account = User;
        break;
      default:
        return res.status(400).json(error("Invalid user type", res.statusCode));
    }

    let isAccount = await Account.findOne({
      reset_password_otp: req.body.otp,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!isAccount)
      return res
        .status(401)
        .json(
          error(
            "Invalid password reset Code or Code has expired",
            res.statusCode
          )
        );

    const hash = bcrypt.hashSync(req.body.password, 12);
    isAccount.password = hash;
    isAccount.reset_password_otp = undefined;
    isAccount.resetPasswordExpires = undefined;
    const result = await isAccount.save();
    if (!result)
      return res
        .status(400)
        .json(error("Failed to update password. Try again", res.statusCode));

    const name = isAccount.full_name.split(" ")[0];
    const email = isAccount.email;
    const mail_data = dynamic_template_data({
      email,
      template_id: emailTemplates.resetPasswordEmail,
      data: { first_name: name },
    });
    sendEmail(mail_data);

    return res.json(
      success(
        "Success",
        { message: "Your password was reset successfully!" },
        res.statusCode
      )
    );
  } catch (err) {
    return res
      .status(500)
      .json(
        error(
          "Internal Server Error. Try again after some time",
          res.statusCode
        )
      );
  }
};
