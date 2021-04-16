import express from "express";
import User from "./models/User.js";
import jwt from "jsonwebtoken";
import keys from "./config/keys.js";
const router = express.Router();

router.get("/", async (req, res, next) => {
  let date = jwt.decode(req.headers.autorisation);
  console.log(date);
  let user = await User.findOne({ email: date?.email });
  if (user && user.password == date?.password)
    res.json({
      id: user._id,
      name_surname: user.name + " " + user.name_surname,
      ava: user.ava,
    });
  else res.json({ no_token: true });
});

export default router;
