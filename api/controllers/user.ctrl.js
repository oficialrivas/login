"use strict";
const User = require("../services/user.service");
const Role = require("../services/role.service");
const Phone = require("../services/phone.service");
const Email = require("../services/email.service");
const { OTPMailer } = require("../helpers/mailers/otpmailer");
const jwt = require("../helpers/jwt");
const { HTTP_OK } = require("../helpers/constants/httpStatusCodes");
const Boom = require("boom");

const controllers = {
  signup: async (req, res) => {
    try {
      const { email, phone } = req.body;

      let defaultRole = await Role.findOne({ default: true });
      if (!defaultRole)
        throw Boom.badData(
          "There are no default role registered, please contact an administrator to create it before start registering users."
        );

      req.body.role = defaultRole;
      req.body.username = email;

      delete req.body.repeatPassword;

      // Create and assign phone
      let phone_doc = await Phone.create({ phone });
      let email_doc = await Email.create({ email });

      req.body.phone = phone_doc;
      req.body.email = email_doc;

      const user = await User.register(req.body);
      phone_doc._user = user._id;
      email_doc._user = user._id;
      await phone_doc.save();
      let refresh_email = await email_doc.save();

      delete user?._doc?.hash;
      delete user?._doc?.salt;

      // Send OTP Email
      await new OTPMailer(email, refresh_email.email_otp, "welcome").send();

      return res.status(HTTP_OK).send({ status: 1, message: "success", user });
    } catch (err) {
      next(err);
    }
  },
  signin: async (req, res) => {
    let user = req.user;

    delete user?._doc?.hash;
    delete user?._doc?.salt;

    user._doc.token = jwt.createToken(user?._doc._id);
    user.last_login = new Date();
    await user.save();

    return res.json({ status: 1, user });
  },
  signout: async (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.json({ status: 1 });
    });
  },
  session: (req, res) => {
    if (req.user) return res.json({ status: 1, user: req.user });
    throw Boom.unauthorized("Unauthorized");
  },
  get_all: async (req, res) => {
    let users = await User.findAll();
    return res.json({ status: 1, users });
  },
};

module.exports = controllers;
