import express from "express";
import User from "./models/User.js";
import jwt from "jsonwebtoken";
import keys from "./config/keys.js";
const router = express.Router();

router.post("/", async (req, res, next) => {
  let user = await User.findOne({ email: req.body.email });
  if (!user) res.json({ no_user: true });
  else if (user.password !== req.body.password) {
    res.json({ no_password: true });
  } else {
    const token = jwt.sign(
      {
        email: user.email,
        password: user.password,
      },
      keys.jwt,
      { expiresIn: 60 * 60 * 60 }
    );
    res.json({ token: token });
  }
});

export default router;
