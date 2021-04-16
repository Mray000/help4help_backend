import passport_local from "passport-local";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
const LocalStrategy = passport_local.Strategy;

const Passport = async (passport) => {
  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        let user = await User.findOne({ email: email });
        if (!user) return done(null, false, { no_user: true });
        else if (user.password !== password) {
          done(null, false, { no_password: true });
        } else return done(null, user);
      }
    )
  );
  passport.serializeUser((user, done) => done(null, user._id));

  passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
      done(err, user);
    });
  });
};

export default Passport;
